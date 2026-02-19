use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;

const SUPPORT_SYSTEM_PROMPT: &str = "あなたはPMスキル学習の支援アシスタントです。ユーザーはPMスキルを練習中の学習者です。\n\n## あなたの役割\n- ユーザーの思考プロセスを鍛える\n- ユーザーの判断や前提に疑問を投げかけ、考えを深めさせる\n- 安易な結論に対して「なぜそう判断したか？」「他の選択肢は検討したか？」と問い直す\n- ユーザーの成果物をレビューし、弱い論拠や抜け漏れを指摘する\n\n## 最優先ルール（絶対厳守）\n1. ミッションの完全な答えを提示してはいけない\n2. ユーザーの代わりに成果物を作成してはいけない\n3. チームメンバー（エンジニア、デザイナー、POなど）を演じない\n\n## コア行動\n- ユーザーの判断に対して必ず「なぜ？」「根拠は？」と問う\n- 弱い論拠や曖昧な表現を見逃さず指摘する\n- フレームワークや考え方の方向性は示してよいが、具体的な答えは出さない\n- 「もう少し具体的に」「〇〇の観点は検討しましたか？」のように問いかけで導く\n\n## 応答スタイル\n- 1〜2文で簡潔に応答する（最大3文）\n- 箇条書きやMarkdownは、テンプレート提示時のみ使用可\n- 敬語で丁寧に、ただし冗長にならない";

const SUPPORT_TONE_PROMPT: &str = "会話トーン:\n- 思考を鍛える厳しめのメンターとして振る舞う\n- 簡潔で鋭く答える\n- 過度な褒め言葉は避け、改善すべき点を率直に指摘する\n- ユーザーの判断が甘いときは遠慮なく問い直す\n- 「ユーザーさん」や「あなた」は使わず、直接的に語りかける";

use crate::features::product_config::models::ProductConfig;
use crate::error::{anyhow_error, forbidden_error, AppError};
use crate::features::entitlements::fair_use::enforce_chat_daily_limit;
use crate::features::entitlements::models::PlanCode;
use crate::features::entitlements::services::EntitlementService;
use crate::features::feature_flags::services::FeatureFlagService;
use crate::features::sessions::authorization::authorize_session_access;
use crate::features::sessions::repository::SessionRepository;
use crate::models::{
    default_scenarios, Message, MessageRole, MessageTag, Mission, MissionStatus,
    Scenario,
};
use crate::features::product_config::services::ProductConfigService;
use crate::shared::gemini::resolve_chat_credentials;
use crate::shared::helpers::{next_id, now_ts};

use super::models::{CreateMessageRequest, MessageResponse};
use super::repository::MessageRepository;

fn format_product_context(config: &ProductConfig, scenario_title: &str) -> String {
    let list = |label: &str, items: &[String]| -> String {
        if items.is_empty() {
            String::new()
        } else {
            format!("- {}: {}", label, items.join("、"))
        }
    };

    let render_template = |template: &str| -> String {
        template
            .replace("{{scenarioTitle}}", scenario_title)
            .replace("{{productName}}", &config.name)
            .replace("{{productSummary}}", &config.summary)
            .replace("{{productAudience}}", &config.audience)
            .replace("{{productTimeline}}", config.timeline.as_deref().unwrap_or(""))
    };

    let mut sections: Vec<String> = Vec::new();

    if let Some(prompt) = &config.product_prompt {
        let rendered = render_template(prompt.trim());
        if !rendered.is_empty() {
            sections.push(format!("## プロジェクトメモ\n{}", rendered));
        }
    }

    let product_lines: Vec<String> = [
        if !config.name.is_empty() { format!("- 名前: {}", config.name) } else { String::new() },
        if !config.summary.is_empty() { format!("- 概要: {}", config.summary) } else { String::new() },
        if !config.audience.is_empty() { format!("- 対象: {}", config.audience) } else { String::new() },
        list("課題", &config.problems),
        list("目標", &config.goals),
        list("差別化要素", &config.differentiators),
        list("スコープ", &config.scope),
        list("制約", &config.constraints),
        config.timeline.as_ref()
            .filter(|t| !t.is_empty())
            .map(|t| format!("- タイムライン: {}", t))
            .unwrap_or_default(),
        list("成功条件", &config.success_criteria),
    ]
    .into_iter()
    .filter(|s| !s.is_empty())
    .collect();

    if !product_lines.is_empty() {
        sections.push(format!("## プロダクト情報\n{}", product_lines.join("\n")));
    }

    sections.join("\n\n")
}

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
    latest_user_message: &str,
    missions: &[Mission],
    plan_code: &PlanCode,
) -> Result<Vec<String>, AppError> {
    if missions.is_empty() {
        return Ok(Vec::new());
    }

    let credentials = resolve_chat_credentials(plan_code, None)?;
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

            let product_config = ProductConfigService::new(self.pool.clone())
                .get_product_config(user_id)
                .await
                .unwrap_or_else(|_| ProductConfig::default_product());
            let product_context = format_product_context(
                &product_config,
                scenario.as_ref().map(|s| s.title.as_str()).unwrap_or(""),
            );
            let agent_response_enabled = true;
            let behavior_single_response = scenario
                .as_ref()
                .and_then(|s| s.single_response)
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
                let all_missions_complete = !scenario_missions.is_empty() && {
                    let completed_ids: std::collections::HashSet<&str> = session
                        .mission_status
                        .as_deref()
                        .unwrap_or(&[])
                        .iter()
                        .map(|m| m.mission_id.as_str())
                        .collect();
                    scenario_missions.iter().all(|m| completed_ids.contains(m.id.as_str()))
                };
                let reply_text = generate_agent_reply(scenario.as_ref().unwrap(), Some(&product_context), &history, &plan_code, all_missions_complete).await?;

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
                    single_turn_completion_message(scenario.as_ref().map(|s| s.title.as_str()));
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

fn build_support_system_instruction(
    scenario: &Scenario,
    product_context: Option<&str>,
    all_missions_complete: bool,
) -> String {
    let mut sections = Vec::new();

    // 1. Fixed role (hardcoded support-assistant identity)
    sections.push(SUPPORT_SYSTEM_PROMPT.to_string());

    // 2. Task instruction (from scenario.agent_prompt)
    if let Some(agent_prompt) = &scenario.agent_prompt {
        if !agent_prompt.is_empty() {
            sections.push(agent_prompt.clone());
        }
    }

    // 3. Scenario context
    sections.push(format!(
        "## シナリオ文脈\n- タイトル: {}\n- 説明: {}",
        scenario.title, scenario.description
    ));

    // 4. Tone (always use hardcoded tone prompt)
    sections.push(format!("## 会話トーン\n{}", SUPPORT_TONE_PROMPT));

    // 5. Product context (fetched from backend)
    if let Some(product) = product_context {
        if !product.is_empty() {
            sections.push(product.to_string());
        }
    }

    // 6. Guardrails (always appended)
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

    // 7. Mission completion section (only when all missions are done)
    if all_missions_complete {
        sections.push("## ミッション完了\n全てのミッションが達成されました。以下を行ってください:\n- ユーザーの取り組みと達成を端的に称える（1文）\n- 今回練習した内容で特に良かった点を1つ挙げる\n- 次に意識すべき改善ポイントを1つ提案する\n- 評価ボタンで振り返りができることを案内する".to_string());
    }

    sections.join("\n\n")
}

async fn generate_agent_reply(
    scenario: &Scenario,
    product_context: Option<&str>,
    messages: &[Message],
    plan_code: &PlanCode,
    all_missions_complete: bool,
) -> Result<String, AppError> {
    let credentials = resolve_chat_credentials(plan_code, None)?;
    let gemini_key = credentials.api_key;
    let model_id = credentials.model_id;
    let system_instruction = build_support_system_instruction(scenario, product_context, all_missions_complete);

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
    use crate::models::ScenarioType;

    fn make_scenario(agent_prompt: Option<&str>) -> Scenario {
        Scenario {
            id: "test-scenario".to_string(),
            title: "チケット要件整理".to_string(),
            description: "チケットの目的と受入条件を整理する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "チケットを整理してください。".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: agent_prompt.map(|s| s.to_string()),
            single_response: None,
        }
    }

    #[test]
    fn support_context_produces_support_instruction() {
        let scenario = make_scenario(Some("## タスク指示\nチケットの目的と受入条件を整理してください。"));
        let result = build_support_system_instruction(&scenario, None, false);

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
        let scenario = make_scenario(None);
        let result = build_support_system_instruction(&scenario, None, false);

        assert!(!result.contains("最優先指示"), "should not have custom prompt priority section");
        assert!(!result.contains("エンジニア兼デザイナー"), "should not have old role-play identity");
    }

    #[test]
    fn support_instruction_without_agent_prompt_still_has_guardrails() {
        let scenario = make_scenario(None);
        let result = build_support_system_instruction(&scenario, None, false);

        assert!(result.contains("ガードレール"), "guardrails should always be present");
    }

    #[test]
    fn support_instruction_includes_product_context_when_provided() {
        let scenario = make_scenario(None);
        let result = build_support_system_instruction(&scenario, Some("## プロダクト\n勤怠管理アプリ"), false);

        assert!(result.contains("勤怠管理アプリ"), "should include provided product context");
    }

    #[test]
    fn support_instruction_includes_agent_prompt_when_present() {
        let scenario = make_scenario(Some("## カスタム指示\n特別なタスクを実行してください。"));
        let result = build_support_system_instruction(&scenario, None, false);

        assert!(result.contains("カスタム指示"), "should include agent_prompt content");
        assert!(result.contains("特別なタスクを実行してください。"), "should include agent_prompt details");
    }

    #[test]
    fn support_instruction_includes_mission_complete_when_all_done() {
        let scenario = make_scenario(None);
        let result = build_support_system_instruction(&scenario, None, true);

        assert!(result.contains("ミッション完了"), "should include mission complete message when all done");
    }
}
