use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;

use crate::error::{anyhow_error, forbidden_error, AppError};
use crate::features::entitlements::fair_use::enforce_chat_daily_limit;
use crate::features::entitlements::models::PlanCode;
use crate::features::entitlements::services::EntitlementService;
use crate::features::feature_flags::services::FeatureFlagService;
use crate::features::sessions::authorization::authorize_session_access;
use crate::features::sessions::repository::SessionRepository;
use crate::models::{
    default_scenarios, Message, MessageRole, MessageTag, Mission, MissionStatus,
};
use crate::shared::gemini::resolve_chat_credentials;
use crate::shared::helpers::{next_id, now_ts};

use super::models::{AgentContext, CreateMessageRequest, MessageResponse};
use super::repository::MessageRepository;

fn single_turn_completion_message(title: Option<&str>) -> String {
    let intro = title
        .filter(|t| !t.is_empty())
        .map(|t| format!("『{}』", t))
        .unwrap_or_else(|| "このベーシックシナリオ".to_string());
    format!(
        "{}はこれで終了です。右側の「シナリオを完了する」ボタンから評価を依頼してください。",
        intro
    )
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct MissionCompletionOutput {
    completed_mission_ids: Vec<String>,
}

fn extract_json_value(text: &str) -> Option<serde_json::Value> {
    let trimmed = text.trim();
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
        return Some(value);
    }
    for (start, _) in trimmed.match_indices('{') {
        let slice = &trimmed[start..];
        let mut de = serde_json::Deserializer::from_str(slice);
        if let Ok(value) = serde_json::Value::deserialize(&mut de) {
            return Some(value);
        }
    }
    None
}

async fn infer_completed_mission_ids(
    context: &AgentContext,
    latest_user_message: &str,
    missions: &[Mission],
    plan_code: &PlanCode,
) -> Result<Vec<String>, AppError> {
    if missions.is_empty() {
        return Ok(Vec::new());
    }

    let credentials = resolve_chat_credentials(plan_code, context.model_id.as_deref())?;
    let gemini_key = credentials.api_key;
    let model_id = credentials.model_id;

    let mission_lines = missions
        .iter()
        .map(|mission| {
            let description = mission.description.as_deref().unwrap_or("なし");
            format!(
                "- id: {} / title: {} / description: {}",
                mission.id, mission.title, description
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    let system_instruction = [
        "あなたはミッション達成判定アシスタントです。",
        "ユーザーの最新回答のみを読んで、達成できたミッションIDだけを返してください。",
        "保守的に判定し、明確に達成していないミッションは含めないでください。",
        "出力はJSONのみで、形式は {\"completedMissionIds\":[\"...\"]} としてください。",
    ]
    .join("\n");

    let input_text = format!(
        "## ミッション一覧\n{}\n\n## ユーザー最新回答\n{}",
        mission_lines, latest_user_message
    );

    let payload = json!({
        "contents": [
            {
                "role": "user",
                "parts": [{ "text": input_text }]
            }
        ],
        "systemInstruction": { "parts": [{ "text": system_instruction }] },
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": 256,
            "responseMimeType": "application/json"
        }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model_id, gemini_key
    );

    let client = Client::new();
    let res = client
        .post(url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| anyhow_error(format!("Gemini mission completion check failed: {}", e)))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(anyhow_error(format!(
            "Gemini mission completion API error {}: {}",
            status, text
        )));
    }

    let data: serde_json::Value = res.json().await.map_err(|e| {
        anyhow_error(format!(
            "Failed to parse mission completion response: {}",
            e
        ))
    })?;

    let reply_text = data
        .get("candidates")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("content"))
        .and_then(|v| v.get("parts"))
        .and_then(|v| v.as_array())
        .map(|parts| {
            parts
                .iter()
                .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string()
        })
        .unwrap_or_default();

    let json_value = extract_json_value(&reply_text)
        .ok_or_else(|| anyhow_error("Mission completion output was not valid JSON"))?;
    let output: MissionCompletionOutput = serde_json::from_value(json_value)
        .map_err(|e| anyhow_error(format!("Failed to decode mission completion JSON: {}", e)))?;

    let known_ids = missions
        .iter()
        .map(|mission| mission.id.as_str())
        .collect::<std::collections::HashSet<_>>();
    let mut unique = std::collections::HashSet::new();
    let filtered = output
        .completed_mission_ids
        .into_iter()
        .filter(|id| known_ids.contains(id.as_str()))
        .filter(|id| unique.insert(id.clone()))
        .collect::<Vec<_>>();

    Ok(filtered)
}

fn merge_completed_missions(
    existing: Option<Vec<MissionStatus>>,
    completed_ids: &[String],
) -> (Option<Vec<MissionStatus>>, bool) {
    if completed_ids.is_empty() {
        return (existing, false);
    }

    let mut mission_status = existing.unwrap_or_default();
    let mut changed = false;
    let completed_at = now_ts();

    for mission_id in completed_ids {
        if let Some(entry) = mission_status
            .iter_mut()
            .find(|entry| entry.mission_id == *mission_id)
        {
            if entry.completed_at.is_none() {
                entry.completed_at = Some(completed_at.clone());
                changed = true;
            }
            continue;
        }
        mission_status.push(MissionStatus {
            mission_id: mission_id.clone(),
            completed_at: Some(completed_at.clone()),
        });
        changed = true;
    }

    let next = if mission_status.is_empty() {
        None
    } else {
        Some(mission_status)
    };

    (next, changed)
}

#[derive(Clone)]
pub struct MessageService {
    pool: PgPool,
}

impl MessageService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_messages(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> Result<Vec<Message>, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_view() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for message view",
            ));
        }

        let message_repo = MessageRepository::new(self.pool.clone());
        let messages = message_repo
            .list_by_session(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list messages: {}", e)))?;
        Ok(messages)
    }

    pub async fn post_message(
        &self,
        session_id: &str,
        user_id: &str,
        body: CreateMessageRequest,
    ) -> Result<MessageResponse, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_edit_session() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for message post",
            ));
        }

        let session_repo = SessionRepository::new(self.pool.clone());
        let message_repo = MessageRepository::new(self.pool.clone());

        // Begin transaction for atomicity
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

        let mut session = access.session;

        let is_user = body.role == MessageRole::User;
        let scenario = default_scenarios()
            .into_iter()
            .find(|s| s.id == session.scenario_id);
        let scenario_missions = scenario
            .as_ref()
            .and_then(|s| s.missions.clone())
            .unwrap_or_default();

        // Create message
        let message = Message {
            id: next_id("msg"),
            session_id: session_id.to_string(),
            role: body.role,
            content: body.content,
            created_at: now_ts(),
            tags: body.tags,
            queued_offline: None,
        };
        message_repo
            .create_in_tx(&mut tx, &message)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create message: {}", e)))?;

        // Update session
        if let Some(ms) = body.mission_status {
            session.mission_status = Some(ms);
            session_repo
                .update_mission_status_in_tx(&mut tx, session_id, &session.mission_status)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to update mission status: {}", e)))?;
        }
        session.last_activity_at = now_ts();
        session_repo
            .update_last_activity_in_tx(&mut tx, session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to update session: {}", e)))?;

        tx.commit()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to commit transaction: {}", e)))?;

        let mut reply = message.clone();

        if is_user {
            let entitlement_service = EntitlementService::new(self.pool.clone());
            let effective_plan = entitlement_service.resolve_effective_plan(user_id).await?;
            let plan_code = effective_plan.plan_code.clone();
            let organization_id = effective_plan.organization_id.clone();

            let context = body
                .agent_context
                .as_ref()
                .ok_or_else(|| anyhow_error("agentContext is required for user messages"))?;
            let agent_response_enabled = context
                .behavior
                .as_ref()
                .and_then(|b| b.agent_response_enabled)
                .unwrap_or(true);
            let behavior_single_response = context
                .behavior
                .as_ref()
                .and_then(|b| b.single_response)
                .unwrap_or(false);
            let should_append_completion_message = behavior_single_response;
            let should_invoke_ai =
                agent_response_enabled || !scenario_missions.is_empty();

            if FeatureFlagService::new().is_entitlement_enforced() && should_invoke_ai {
                enforce_chat_daily_limit(
                    &self.pool,
                    &plan_code,
                    user_id,
                    organization_id.as_deref(),
                )
                .await?;
            }

            let mut reply_tx =
                self.pool.begin().await.map_err(|e| {
                    anyhow_error(&format!("Failed to begin reply transaction: {}", e))
                })?;

            if agent_response_enabled {
                let history = message_repo
                    .list_by_session(session_id)
                    .await
                    .map_err(|e| anyhow_error(&format!("Failed to load message history: {}", e)))?;
                let reply_text = generate_agent_reply(context, &history, &plan_code).await?;

                let agent_message = Message {
                    id: next_id("msg"),
                    session_id: session_id.to_string(),
                    role: MessageRole::Agent,
                    content: reply_text,
                    created_at: now_ts(),
                    tags: Some(vec![MessageTag::Summary]),
                    queued_offline: None,
                };

                message_repo
                    .create_in_tx(&mut reply_tx, &agent_message)
                    .await
                    .map_err(|e| anyhow_error(&format!("Failed to create agent message: {}", e)))?;
                reply = agent_message;
            }

            if should_append_completion_message {
                let closing_content =
                    single_turn_completion_message(context.scenario_title.as_deref());
                let system_message = Message {
                    id: next_id("msg"),
                    session_id: session_id.to_string(),
                    role: MessageRole::System,
                    content: closing_content,
                    created_at: now_ts(),
                    tags: Some(vec![MessageTag::Summary]),
                    queued_offline: None,
                };
                message_repo
                    .create_in_tx(&mut reply_tx, &system_message)
                    .await
                    .map_err(|e| {
                        anyhow_error(&format!("Failed to create system message: {}", e))
                    })?;
                if !agent_response_enabled {
                    reply = system_message;
                }
            }

            if !scenario_missions.is_empty() {
                if let Ok(completed_ids) = infer_completed_mission_ids(
                    context,
                    &message.content,
                    &scenario_missions,
                    &plan_code,
                )
                .await
                {
                    let (next_status, changed) =
                        merge_completed_missions(session.mission_status.clone(), &completed_ids);
                    if changed {
                        session.mission_status = next_status;
                        session_repo
                            .update_mission_status_in_tx(
                                &mut reply_tx,
                                session_id,
                                &session.mission_status,
                            )
                            .await
                            .map_err(|e| {
                                anyhow_error(&format!(
                                    "Failed to persist auto mission completion: {}",
                                    e
                                ))
                            })?;
                    }
                }
            }

            session_repo
                .update_last_activity_in_tx(&mut reply_tx, session_id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to update session activity: {}", e)))?;
            reply_tx
                .commit()
                .await
                .map_err(|e| anyhow_error(&format!("Failed to commit reply transaction: {}", e)))?;
        }

        // Fetch updated session
        let updated_session = session_repo
            .get_by_id(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get updated session by id: {}", e)))?
            .ok_or_else(|| anyhow_error("session not found"))?;

        Ok(MessageResponse {
            reply,
            session: updated_session,
        })
    }
}

fn build_system_instruction(ctx: &AgentContext) -> String {
    let mut sections = Vec::new();

    // Custom prompt takes highest priority — placed first so the model sees it before all other instructions.
    if let Some(custom_prompt) = &ctx.custom_prompt {
        if !custom_prompt.trim().is_empty() {
            sections.push(format!("## 最優先指示\n以下の指示は他のすべての指示より優先されます。必ず従ってください。\n{}", custom_prompt));
        }
    }

    sections.push(ctx.system_prompt.clone());
    sections.push(ctx.scenario_prompt.clone());

    if ctx.scenario_title.is_some() || ctx.scenario_description.is_some() {
        let mut scenario_lines = Vec::new();
        scenario_lines.push("## シナリオ文脈".to_string());
        if let Some(title) = &ctx.scenario_title {
            scenario_lines.push(format!("- タイトル: {}", title));
        }
        if let Some(description) = &ctx.scenario_description {
            scenario_lines.push(format!("- 説明: {}", description));
        }
        sections.push(scenario_lines.join("\n"));
    }

    if let Some(tone_prompt) = &ctx.tone_prompt {
        if !tone_prompt.trim().is_empty() {
            sections.push(format!("## 会話トーン\n{}", tone_prompt));
        }
    }

    if let Some(product_context) = &ctx.product_context {
        sections.push(product_context.clone());
    }

    if let Some(behavior) = &ctx.behavior {
        let mut behavior_lines = vec!["## シナリオ行動方針".to_string()];

        if behavior.single_response.unwrap_or(false) {
            behavior_lines.push("- これは1回応答のシナリオです".to_string());
            behavior_lines.push("- ユーザーの入力意図を汲んで、実務的な返答を短く返す".to_string());
            behavior_lines.push("- 追加の質問はしない".to_string());
        } else if behavior.user_led.unwrap_or(false) {
            behavior_lines.push("- ユーザー主導：こちらから議題を進めない".to_string());
            behavior_lines.push("- まずは受領・挨拶の応答に留める".to_string());
        } else if behavior.allow_proactive.unwrap_or(true) {
            behavior_lines.push("- 必要な場合のみ次の一歩を1つ提案してよい".to_string());
        }

        let response_style = behavior.response_style.as_deref();
        let is_single_response = behavior.single_response.unwrap_or(false);
        let forbid_questions = is_single_response
            || behavior.user_led.unwrap_or(false)
            || response_style == Some("acknowledge_then_wait")
            || behavior.max_questions == Some(0);

        if forbid_questions {
            behavior_lines.push("- 質問は禁止".to_string());
        } else if let Some(max_questions) = behavior.max_questions {
            behavior_lines.push(format!("- 質問は最大{max_questions}つまで"));
        }

        if let Some(style) = response_style {
            let style_line = match style {
                "acknowledge_then_wait" => "受領・共感中心で、次の進行はユーザーに委ねる",
                "guide_lightly" => "短く受領し、必要な場合のみ軽く方向づける",
                "advisor" => "前提を確認しつつ簡潔に助言する",
                _ => "簡潔で礼儀正しく応答する",
            };
            behavior_lines.push(format!("- 応答スタイル: {}", style_line));
        }

        if let Some(phase) = behavior.phase.as_deref() {
            behavior_lines.push(format!("- フェーズ: {}", phase));
        }

        sections.push(behavior_lines.join("\n"));
    }

    let mut response_rules = vec![
        "## 応答ルール".to_string(),
        "- 1〜2文で回答する".to_string(),
        "- 箇条書きやMarkdown記法は使わない".to_string(),
    ];
    let forbid_questions = ctx
        .behavior
        .as_ref()
        .map(|b| {
            b.user_led.unwrap_or(false)
                || b.single_response.unwrap_or(false)
                || b.response_style.as_deref() == Some("acknowledge_then_wait")
                || b.max_questions == Some(0)
        })
        .unwrap_or(false);
    if forbid_questions {
        response_rules.push("- 質問はしない".to_string());
    } else {
        response_rules.push("- 質問は1つだけにする".to_string());
    }
    sections.push(response_rules.join("\n"));

    sections.join("\n\n")
}

async fn generate_agent_reply(
    context: &AgentContext,
    messages: &[Message],
    plan_code: &PlanCode,
) -> Result<String, AppError> {
    let credentials = resolve_chat_credentials(plan_code, context.model_id.as_deref())?;
    let gemini_key = credentials.api_key;
    let model_id = credentials.model_id;
    let system_instruction = build_system_instruction(context);

    let context_messages = if messages.len() > 20 {
        &messages[messages.len() - 20..]
    } else {
        messages
    };

    let contents: Vec<_> = context_messages
        .iter()
        .filter(|m| m.role != MessageRole::System)
        .map(|m| {
            let role = match m.role {
                MessageRole::Agent => "model",
                _ => "user",
            };
            json!({
                "role": role,
                "parts": [{ "text": m.content }]
            })
        })
        .collect();

    let payload = json!({
        "contents": contents,
        "systemInstruction": { "parts": [{ "text": system_instruction }] }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model_id, gemini_key
    );

    let client = Client::new();
    let res = client
        .post(url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| anyhow_error(format!("Gemini request failed: {}", e)))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(anyhow_error(format!(
            "Gemini API error {}: {}",
            status, text
        )));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(|e| anyhow_error(format!("Failed to parse Gemini response: {}", e)))?;

    let reply = data
        .get("candidates")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("content"))
        .and_then(|v| v.get("parts"))
        .and_then(|v| v.as_array())
        .map(|parts| {
            parts
                .iter()
                .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string()
        })
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "（応答を生成できませんでした）".to_string());

    Ok(reply)
}
