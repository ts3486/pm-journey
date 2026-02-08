use reqwest::Client;
use serde_json::json;
use sqlx::PgPool;

use crate::error::{anyhow_error, AppError};
use crate::features::sessions::repository::SessionRepository;
use crate::models::{default_scenarios, Message, MessageRole, MessageTag, ScenarioType};
use crate::shared::helpers::{next_id, normalize_model_id, now_ts, verify_session_ownership};

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
        verify_session_ownership(&self.pool, session_id, user_id).await?;

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
        let session_repo = SessionRepository::new(self.pool.clone());
        let message_repo = MessageRepository::new(self.pool.clone());

        // Begin transaction for atomicity
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

        // Get session
        let mut session = session_repo
            .get_for_user(session_id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
            .ok_or_else(|| anyhow_error("session not found"))?;

        let is_user = body.role == MessageRole::User;
        let scenario_type = default_scenarios()
            .into_iter()
            .find(|s| s.id == session.scenario_id)
            .and_then(|s| s.scenario_type);

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
            let context = body
                .agent_context
                .as_ref()
                .ok_or_else(|| anyhow_error("agentContext is required for user messages"))?;
            let behavior_single_response = context
                .behavior
                .as_ref()
                .and_then(|b| b.single_response)
                .unwrap_or(false);
            let skip_agent_reply =
                behavior_single_response || matches!(scenario_type, Some(ScenarioType::Basic));

            if skip_agent_reply {
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

                let mut reply_tx = self.pool.begin().await.map_err(|e| {
                    anyhow_error(&format!("Failed to begin reply transaction: {}", e))
                })?;
                message_repo
                    .create_in_tx(&mut reply_tx, &system_message)
                    .await
                    .map_err(|e| {
                        anyhow_error(&format!("Failed to create system message: {}", e))
                    })?;
                session_repo
                    .update_last_activity_in_tx(&mut reply_tx, session_id)
                    .await
                    .map_err(|e| {
                        anyhow_error(&format!("Failed to update session activity: {}", e))
                    })?;
                reply_tx.commit().await.map_err(|e| {
                    anyhow_error(&format!("Failed to commit reply transaction: {}", e))
                })?;

                reply = system_message;
            } else {
                let history = message_repo
                    .list_by_session(session_id)
                    .await
                    .map_err(|e| anyhow_error(&format!("Failed to load message history: {}", e)))?;
                let reply_text = generate_agent_reply(context, &history).await?;

                let agent_message = Message {
                    id: next_id("msg"),
                    session_id: session_id.to_string(),
                    role: MessageRole::Agent,
                    content: reply_text,
                    created_at: now_ts(),
                    tags: Some(vec![MessageTag::Summary]),
                    queued_offline: None,
                };

                let mut reply_tx = self.pool.begin().await.map_err(|e| {
                    anyhow_error(&format!("Failed to begin reply transaction: {}", e))
                })?;
                message_repo
                    .create_in_tx(&mut reply_tx, &agent_message)
                    .await
                    .map_err(|e| anyhow_error(&format!("Failed to create agent message: {}", e)))?;
                session_repo
                    .update_last_activity_in_tx(&mut reply_tx, session_id)
                    .await
                    .map_err(|e| {
                        anyhow_error(&format!("Failed to update session activity: {}", e))
                    })?;
                reply_tx.commit().await.map_err(|e| {
                    anyhow_error(&format!("Failed to commit reply transaction: {}", e))
                })?;

                reply = agent_message;
            }
        }

        // Fetch updated session
        let updated_session = session_repo
            .get_for_user(session_id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get updated session: {}", e)))?
            .ok_or_else(|| anyhow_error("session not found"))?;

        Ok(MessageResponse {
            reply,
            session: updated_session,
        })
    }
}

fn build_system_instruction(ctx: &AgentContext) -> String {
    let mut sections = Vec::new();
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

    if let Some(product_context) = &ctx.product_context {
        sections.push(product_context.clone());
    }

    if let Some(behavior) = &ctx.behavior {
        let mut behavior_lines = vec!["## シナリオ行動方針".to_string()];

        if behavior.single_response.unwrap_or(false) {
            behavior_lines.push("- これは1回応答のシナリオです".to_string());
            behavior_lines.push(
                "- ユーザーの回答を受け取ったら、簡潔に内容を確認し、シナリオ終了を伝えてください"
                    .to_string(),
            );
            behavior_lines.push("- 回答の最後に必ず「以上でこのシナリオは終了です。右側の「シナリオを完了する」ボタンから評価を受けてください。」と伝えてください".to_string());
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
) -> Result<String, AppError> {
    let gemini_key = std::env::var("GEMINI_API_KEY")
        .or_else(|_| std::env::var("NEXT_PUBLIC_GEMINI_API_KEY"))
        .map_err(|_| anyhow_error("GEMINI_API_KEY is not set"))?;

    let default_model = std::env::var("GEMINI_DEFAULT_MODEL")
        .unwrap_or_else(|_| "gemini-3-flash-preview".to_string());
    let model_id = normalize_model_id(
        context
            .model_id
            .as_deref()
            .unwrap_or(default_model.as_str()),
    );
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
