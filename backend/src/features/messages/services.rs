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

fn build_support_system_instruction(ctx: &AgentContext) -> String {
    let mut sections = Vec::new();

    // 1. Fixed role (from systemPrompt — now the support-assistant identity)
    sections.push(ctx.system_prompt.clone());

    // 2. Task instruction (from scenario_prompt, which frontend now populates with task details)
    sections.push(ctx.scenario_prompt.clone());

    // 3. Scenario context
    if ctx.scenario_title.is_some() || ctx.scenario_description.is_some() {
        let mut lines = vec!["## シナリオ文脈".to_string()];
        if let Some(title) = &ctx.scenario_title {
            lines.push(format!("- タイトル: {}", title));
        }
        if let Some(desc) = &ctx.scenario_description {
            lines.push(format!("- 説明: {}", desc));
        }
        sections.push(lines.join("\n"));
    }

    // 4. Tone
    if let Some(tone) = &ctx.tone_prompt {
        if !tone.trim().is_empty() {
            sections.push(format!("## 会話トーン\n{}", tone));
        }
    }

    // 5. Product context
    if let Some(product) = &ctx.product_context {
        sections.push(product.clone());
    }

    // 6. Assistance mode rules (from behavior.assistance_mode)
    if let Some(behavior) = &ctx.behavior {
        if let Some(mode) = &behavior.assistance_mode {
            let mode_section = match mode.as_str() {
                "hands-off" => [
                    "## 支援モード: 見守り",
                    "- ユーザーの質問には答えない",
                    "- タスク完了後に評価のみ行う",
                    "- ユーザーが提出した内容に対しても、判断の根拠や前提を問い直す",
                    "- ミッションの完全な答えは絶対に提示しない",
                ]
                .join("\n"),
                "on-request" => [
                    "## 支援モード: 質問対応",
                    "- ユーザーから質問があった場合のみ応答する",
                    "- こちらから積極的にアドバイスしない",
                    "- ヒントは求められたときだけ提供する",
                    "- ユーザーの判断に疑問を投げかけ、考えを深めさせる",
                    "- ミッションの完全な答えは絶対に提示しない",
                ]
                .join("\n"),
                "guided" => [
                    "## 支援モード: ガイド付き",
                    "- ユーザーの進捗を確認し、次のステップを提案してよい",
                    "- 質問は1つずつ",
                    "- 考え方のフレームワークを示してよいが、答えは教えない",
                    "- ユーザーの判断に疑問を投げかけ、考えを深めさせる",
                    "- ミッションの完全な答えは絶対に提示しない",
                ]
                .join("\n"),
                "review" => [
                    "## 支援モード: レビュー",
                    "- ユーザーが成果物を提出するまで待つ",
                    "- 提出されたら、弱い論拠や抜け漏れを指摘する",
                    "- 良い点にも触れるが、改善すべき点を重点的にフィードバックする",
                    "- ユーザーの判断に疑問を投げかけ、考えを深めさせる",
                    "- ミッションの完全な答えは絶対に提示しない",
                ]
                .join("\n"),
                _ => format!("## 支援モード\n- {}", mode),
            };
            sections.push(mode_section);
        }
    }

    // 7. Guardrails (always appended for support mode)
    sections.push(
        [
            "## ガードレール",
            "- ミッションの完全な答えを提示しない（最優先）",
            "- ユーザーの判断や前提を積極的に問い直す",
            "- チームメンバーを演じない（エンジニア、デザイナー、PO等の役割を装わない）",
            "- ユーザーの代わりに成果物を書かない",
            "- 1〜2文で簡潔に応答する（最大3文）",
            "- テンプレート提示時以外は箇条書き・Markdownを使わない",
        ]
        .join("\n"),
    );

    sections.join("\n\n")
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

    // If forbidRolePlay is set, add guardrail even in legacy path
    if ctx
        .behavior
        .as_ref()
        .and_then(|b| b.forbid_role_play)
        .unwrap_or(false)
    {
        sections.push(
            "## ガードレール\n- チームメンバーを演じない（エンジニア、デザイナー、PO等の役割を装わない）"
                .to_string(),
        );
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
    let system_instruction = if context.task.is_some() {
        build_support_system_instruction(context)
    } else {
        build_system_instruction(context)
    };

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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::features::messages::models::AgentBehavior;
    use crate::models::{DeliverableFormat, TaskDefinition};

    fn make_legacy_context() -> AgentContext {
        AgentContext {
            system_prompt: "あなたはエンジニア兼デザイナーです".to_string(),
            tone_prompt: Some("フラットで淡々とした口調".to_string()),
            scenario_prompt: "このチケットの目的と受入条件を整理してください。".to_string(),
            scenario_title: Some("チケット要件整理".to_string()),
            scenario_description: Some("チケットの目的と受入条件を整理する。".to_string()),
            product_context: Some("## プロダクト\n勤怠管理アプリ".to_string()),
            model_id: None,
            behavior: Some(AgentBehavior {
                user_led: Some(false),
                allow_proactive: Some(false),
                max_questions: Some(0),
                response_style: Some("acknowledge_then_wait".to_string()),
                phase: None,
                single_response: Some(true),
                agent_response_enabled: Some(true),
                assistance_mode: None,
                forbid_role_play: None,
            }),
            custom_prompt: Some("あなたはチケットの整理内容を受け取るエンジニアです。".to_string()),
            task: None,
        }
    }

    fn make_support_context() -> AgentContext {
        AgentContext {
            system_prompt: "あなたはPMスキル学習の支援アシスタントです。".to_string(),
            tone_prompt: Some("簡潔で具体的に答える".to_string()),
            scenario_prompt: "## タスク指示\nチケットの目的と受入条件を整理してください。".to_string(),
            scenario_title: Some("チケット要件整理".to_string()),
            scenario_description: Some("チケットの目的と受入条件を整理する。".to_string()),
            product_context: Some("## プロダクト\n勤怠管理アプリ".to_string()),
            model_id: None,
            behavior: Some(AgentBehavior {
                user_led: None,
                allow_proactive: None,
                max_questions: None,
                response_style: None,
                phase: None,
                single_response: None,
                agent_response_enabled: None,
                assistance_mode: Some("on-request".to_string()),
                forbid_role_play: Some(true),
            }),
            custom_prompt: None,
            task: Some(TaskDefinition {
                instruction: "チケットの目的と受入条件を整理してください。".to_string(),
                deliverable_format: DeliverableFormat::Structured,
                template: None,
                reference_info: Some("背景情報です".to_string()),
                hints: None,
            }),
        }
    }

    #[test]
    fn legacy_context_produces_old_style_instruction() {
        let ctx = make_legacy_context();
        let result = build_system_instruction(&ctx);

        assert!(result.contains("最優先指示"), "should contain custom prompt priority header");
        assert!(result.contains("エンジニアです"), "should contain role-play custom prompt");
        assert!(result.contains("シナリオ文脈"), "should contain scenario context section");
        assert!(result.contains("会話トーン"), "should contain tone section");
        assert!(result.contains("応答ルール"), "should contain response rules");
        assert!(!result.contains("ガードレール"), "legacy without forbidRolePlay should not have guardrails");
    }

    #[test]
    fn legacy_context_with_forbid_role_play_adds_guardrail() {
        let mut ctx = make_legacy_context();
        if let Some(behavior) = ctx.behavior.as_mut() {
            behavior.forbid_role_play = Some(true);
        }
        let result = build_system_instruction(&ctx);

        assert!(result.contains("ガードレール"), "should contain guardrails when forbidRolePlay is set");
        assert!(result.contains("チームメンバーを演じない"), "guardrail should forbid role-play");
    }

    #[test]
    fn support_context_produces_support_instruction() {
        let ctx = make_support_context();
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("PMスキル学習の支援アシスタント"), "should contain support identity");
        assert!(result.contains("タスク指示"), "should contain task instruction");
        assert!(result.contains("シナリオ文脈"), "should contain scenario context");
        assert!(result.contains("会話トーン"), "should contain tone");
        assert!(result.contains("ガードレール"), "should always contain guardrails");
        assert!(result.contains("チームメンバーを演じない"), "guardrail should forbid role-play");
        assert!(result.contains("成果物を書かない"), "guardrail should forbid producing deliverable");
        assert!(result.contains("ミッションの完全な答えを提示しない"), "guardrail should prohibit complete answers");
        assert!(result.contains("判断や前提を積極的に問い直す"), "guardrail should require challenging user");
    }

    #[test]
    fn support_instruction_does_not_contain_role_play() {
        let ctx = make_support_context();
        let result = build_support_system_instruction(&ctx);

        assert!(!result.contains("最優先指示"), "should not have custom prompt priority section");
        assert!(!result.contains("エンジニア兼デザイナー"), "should not have old role-play identity");
    }

    #[test]
    fn support_instruction_includes_assistance_mode_on_request() {
        let ctx = make_support_context();
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("支援モード: 質問対応"), "should include on-request mode rules");
        assert!(result.contains("ユーザーから質問があった場合のみ応答する"), "should include on-request details");
        assert!(result.contains("ミッションの完全な答えは絶対に提示しない"), "on-request mode should prohibit complete answers");
    }

    #[test]
    fn support_instruction_includes_assistance_mode_guided() {
        let mut ctx = make_support_context();
        if let Some(behavior) = ctx.behavior.as_mut() {
            behavior.assistance_mode = Some("guided".to_string());
        }
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("支援モード: ガイド付き"), "should include guided mode rules");
        assert!(result.contains("ミッションの完全な答えは絶対に提示しない"), "guided mode should prohibit complete answers");
    }

    #[test]
    fn support_instruction_includes_assistance_mode_review() {
        let mut ctx = make_support_context();
        if let Some(behavior) = ctx.behavior.as_mut() {
            behavior.assistance_mode = Some("review".to_string());
        }
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("支援モード: レビュー"), "should include review mode rules");
        assert!(result.contains("弱い論拠や抜け漏れを指摘する"), "review mode should focus on weak reasoning");
        assert!(result.contains("ミッションの完全な答えは絶対に提示しない"), "review mode should prohibit complete answers");
    }

    #[test]
    fn support_instruction_includes_assistance_mode_hands_off() {
        let mut ctx = make_support_context();
        if let Some(behavior) = ctx.behavior.as_mut() {
            behavior.assistance_mode = Some("hands-off".to_string());
        }
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("支援モード: 見守り"), "should include hands-off mode rules");
        assert!(result.contains("ミッションの完全な答えは絶対に提示しない"), "hands-off mode should prohibit complete answers");
    }

    #[test]
    fn support_instruction_without_behavior_still_has_guardrails() {
        let mut ctx = make_support_context();
        ctx.behavior = None;
        let result = build_support_system_instruction(&ctx);

        assert!(result.contains("ガードレール"), "guardrails should always be present");
        assert!(!result.contains("支援モード"), "no assistance mode when behavior is absent");
    }

    #[test]
    fn routing_uses_support_path_when_task_present() {
        let ctx = make_support_context();
        assert!(ctx.task.is_some(), "support context should have task");

        // The routing logic: if task is present, use support path
        let result = if ctx.task.is_some() {
            build_support_system_instruction(&ctx)
        } else {
            build_system_instruction(&ctx)
        };

        assert!(result.contains("ガードレール"), "should use support path with guardrails");
        assert!(!result.contains("最優先指示"), "should not use legacy path");
    }

    #[test]
    fn routing_uses_legacy_path_when_no_task() {
        let ctx = make_legacy_context();
        assert!(ctx.task.is_none(), "legacy context should not have task");

        let result = if ctx.task.is_some() {
            build_support_system_instruction(&ctx)
        } else {
            build_system_instruction(&ctx)
        };

        assert!(result.contains("最優先指示"), "should use legacy path with custom prompt");
        assert!(result.contains("応答ルール"), "should have legacy response rules");
    }
}
