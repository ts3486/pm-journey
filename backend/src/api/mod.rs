use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use uuid::Uuid;
use std::sync::Arc;
use sqlx::PgPool;
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

use crate::db::{SessionRepository, MessageRepository, EvaluationRepository, CommentRepository};
use crate::error::{anyhow_error, AppError};
use crate::models::{
    default_scenarios, Evaluation, HistoryItem, HistoryMetadata, ManagerComment, Message, MessageRole, MessageTag,
    Mission, MissionStatus, ProgressFlags, Scenario, ScenarioDiscipline, Session, SessionStatus,
};

#[allow(dead_code)]
pub const OPENAPI_SPEC_PATH: &str = "../specs/001-pm-simulation-web/contracts/openapi.yaml";

#[derive(OpenApi)]
#[openapi(
    paths(
        list_scenarios,
        get_scenario,
        health,
        create_session,
        list_sessions,
        get_session,
        delete_session,
        post_message,
        evaluate_session,
        list_comments,
        create_comment,
        import_sessions
    ),
    components(schemas(
        Scenario,
        Session,
        SessionStatus,
        ProgressFlags,
        Message,
        MessageRole,
        MessageTag,
        Evaluation,
        HistoryItem,
        ScenarioDiscipline,
        MissionStatus,
        Mission,
        ManagerComment,
        crate::models::ProductInfo,
        AgentContext
    ))
)]
struct ApiDoc;

pub struct AppState {
    pool: PgPool,
}

pub type SharedState = Arc<AppState>;

fn next_id(prefix: &str) -> String {
    format!("{prefix}-{}", Uuid::new_v4())
}

fn now_ts() -> String {
    chrono::Utc::now().to_rfc3339()
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

        if behavior.user_led.unwrap_or(false) {
            behavior_lines.push("- ユーザー主導：こちらから議題を進めない".to_string());
            behavior_lines.push("- まずは受領・挨拶の応答に留める".to_string());
        } else if behavior.allow_proactive.unwrap_or(true) {
            behavior_lines.push("- 必要な場合のみ次の一歩を1つ提案してよい".to_string());
        }

        let response_style = behavior.response_style.as_deref();
        let forbid_questions = behavior.user_led.unwrap_or(false)
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
    let forbid_questions = ctx.behavior.as_ref().map(|b| {
        b.user_led.unwrap_or(false)
            || b.response_style.as_deref() == Some("acknowledge_then_wait")
            || b.max_questions == Some(0)
    }).unwrap_or(false);
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

    let model_id = context.model_id.as_deref().unwrap_or("gemini-1.5-flash");
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
        return Err(anyhow_error(format!("Gemini API error {}: {}", status, text)));
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

pub fn state_with_pool(pool: PgPool) -> SharedState {
    Arc::new(AppState { pool })
}

pub fn router_with_state(state: SharedState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/scenarios", get(list_scenarios))
        .route("/scenarios/:id", get(get_scenario))
        .route("/sessions", post(create_session).get(list_sessions))
        .route("/sessions/:id", get(get_session).delete(delete_session))
        .route("/sessions/:id/messages", post(post_message))
        .route("/sessions/:id/evaluate", post(evaluate_session))
        .route(
            "/sessions/:id/comments",
            get(list_comments).post(create_comment),
        )
        .route("/import", post(import_sessions))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(state)
}

#[utoipa::path(
    get,
    path = "/health",
    responses((status = 200, description = "Health check"))
)]
async fn health() -> Json<&'static str> {
    Json("ok")
}

#[utoipa::path(
    get,
    path = "/scenarios",
    responses((status = 200, body = [Scenario]))
)]
async fn list_scenarios() -> Json<Vec<Scenario>> {
    Json(default_scenarios())
}

#[utoipa::path(
    get,
    path = "/scenarios/{id}",
    responses((status = 200, body = Scenario))
)]
async fn get_scenario(Path(id): Path<String>) -> Result<Json<Scenario>, AppError> {
    let scenario = default_scenarios()
        .into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| anyhow_error("scenario not found"))?;
    Ok(Json(scenario))
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateSessionRequest {
    #[serde(rename = "scenarioId", alias = "scenario_id")]
    scenario_id: String,
}

#[utoipa::path(
    post,
    path = "/sessions",
    request_body = CreateSessionRequest,
    responses((status = 201, body = Session))
)]
async fn create_session(
    State(state): State<SharedState>,
    Json(body): Json<CreateSessionRequest>,
) -> Result<Json<Session>, AppError> {
    let scenario = default_scenarios()
        .into_iter()
        .find(|s| s.id == body.scenario_id);
    let discipline = scenario.as_ref().map(|s| s.discipline.clone());
    let session = Session {
        id: next_id("session"),
        scenario_id: body.scenario_id,
        scenario_discipline: discipline,
        status: SessionStatus::Active,
        started_at: now_ts(),
        ended_at: None,
        last_activity_at: now_ts(),
        user_name: None,
        progress_flags: ProgressFlags {
            requirements: false,
            priorities: false,
            risks: false,
            acceptance: false,
        },
        evaluation_requested: false,
        mission_status: Some(vec![]),
    };

    let repo = SessionRepository::new(state.pool.clone());
    let created = repo.create(&session).await
        .map_err(|e| anyhow_error(&format!("Failed to create session: {}", e)))?;

    Ok(Json(created))
}

#[utoipa::path(
    get,
    path = "/sessions",
    responses((status = 200, body = [HistoryItem]))
)]
async fn list_sessions(State(state): State<SharedState>) -> Result<Json<Vec<HistoryItem>>, AppError> {
    let session_repo = SessionRepository::new(state.pool.clone());
    let message_repo = MessageRepository::new(state.pool.clone());
    let eval_repo = EvaluationRepository::new(state.pool.clone());
    let comment_repo = CommentRepository::new(state.pool.clone());

    let sessions = session_repo.list().await
        .map_err(|e| anyhow_error(&format!("Failed to list sessions: {}", e)))?;

    let mut items = Vec::new();
    for session in sessions {
        let messages = message_repo.list_by_session(&session.id).await
            .map_err(|e| anyhow_error(&format!("Failed to list messages: {}", e)))?;
        let evaluation = eval_repo.get_by_session(&session.id).await
            .map_err(|e| anyhow_error(&format!("Failed to get evaluation: {}", e)))?;
        let comments = comment_repo.list_by_session(&session.id).await
            .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;

        items.push(HistoryItem {
            session_id: session.id.clone(),
            scenario_id: Some(session.scenario_id.clone()),
            scenario_discipline: session.scenario_discipline.clone(),
            metadata: HistoryMetadata {
                duration: None,
                message_count: Some(messages.len() as u64),
            },
            actions: messages
                .iter()
                .filter(|m| m.tags.is_some() && !m.tags.as_ref().unwrap().is_empty())
                .cloned()
                .collect(),
            evaluation,
            storage_location: Some("api".to_string()),
            comments: Some(comments),
        });
    }
    Ok(Json(items))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}",
    responses((status = 200, body = HistoryItem))
)]
async fn get_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<HistoryItem>, AppError> {
    let session_repo = SessionRepository::new(state.pool.clone());
    let message_repo = MessageRepository::new(state.pool.clone());
    let eval_repo = EvaluationRepository::new(state.pool.clone());
    let comment_repo = CommentRepository::new(state.pool.clone());

    let session = session_repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
        .ok_or_else(|| anyhow_error("session not found"))?;

    let messages = message_repo.list_by_session(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to list messages: {}", e)))?;
    let evaluation = eval_repo.get_by_session(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get evaluation: {}", e)))?;
    let comments = comment_repo.list_by_session(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;

    let item = HistoryItem {
        session_id: session.id.clone(),
        scenario_id: Some(session.scenario_id.clone()),
        scenario_discipline: session.scenario_discipline.clone(),
        metadata: HistoryMetadata {
            duration: None,
            message_count: Some(messages.len() as u64),
        },
        actions: messages
            .iter()
            .filter(|m| m.tags.is_some() && !m.tags.as_ref().unwrap().is_empty())
            .cloned()
            .collect(),
        evaluation,
        storage_location: Some("api".to_string()),
        comments: Some(comments),
    };
    Ok(Json(item))
}

#[utoipa::path(
    delete,
    path = "/sessions/{id}",
    responses((status = 204, description = "Deleted"))
)]
async fn delete_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<&'static str>, AppError> {
    let repo = SessionRepository::new(state.pool.clone());
    repo.delete(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to delete session: {}", e)))?;
    Ok(Json("deleted"))
}

#[derive(Deserialize, ToSchema)]
struct CreateMessageRequest {
    role: MessageRole,
    content: String,
    tags: Option<Vec<MessageTag>>,
    #[serde(rename = "missionStatus")]
    mission_status: Option<Vec<MissionStatus>>,
    #[serde(rename = "agentContext")]
    agent_context: Option<AgentContext>,
}

#[derive(Deserialize, ToSchema, Clone)]
struct AgentContext {
    #[serde(rename = "systemPrompt")]
    system_prompt: String,
    #[serde(rename = "scenarioPrompt")]
    scenario_prompt: String,
    #[serde(rename = "scenarioTitle")]
    scenario_title: Option<String>,
    #[serde(rename = "scenarioDescription")]
    scenario_description: Option<String>,
    #[serde(rename = "productContext")]
    product_context: Option<String>,
    #[serde(rename = "modelId")]
    model_id: Option<String>,
    #[serde(rename = "behavior")]
    behavior: Option<AgentBehavior>,
}

#[derive(Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
struct AgentBehavior {
    user_led: Option<bool>,
    allow_proactive: Option<bool>,
    max_questions: Option<u32>,
    response_style: Option<String>,
    phase: Option<String>,
}

#[derive(Serialize, ToSchema)]
struct MessageResponse {
    reply: Message,
    session: Session,
}

#[derive(Deserialize, ToSchema)]
struct CreateCommentRequest {
    #[serde(rename = "authorName")]
    author_name: Option<String>,
    content: String,
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/messages",
    request_body = CreateMessageRequest,
    responses((status = 200, body = MessageResponse))
)]
async fn post_message(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<CreateMessageRequest>,
) -> Result<Json<MessageResponse>, AppError> {
    let session_repo = SessionRepository::new(state.pool.clone());
    let message_repo = MessageRepository::new(state.pool.clone());

    // Begin transaction for atomicity
    let mut tx = state.pool.begin().await
        .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

    // Get session
    let mut session = session_repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
        .ok_or_else(|| anyhow_error("session not found"))?;

    let is_user = body.role == MessageRole::User;

    // Create message
    let message = Message {
        id: next_id("msg"),
        session_id: id.clone(),
        role: body.role,
        content: body.content,
        created_at: now_ts(),
        tags: body.tags,
        queued_offline: None,
    };
    message_repo.create_in_tx(&mut tx, &message).await
        .map_err(|e| anyhow_error(&format!("Failed to create message: {}", e)))?;

    // Update session
    if let Some(ms) = body.mission_status {
        session.mission_status = Some(ms);
    }
    session.last_activity_at = now_ts();
    session_repo.update_last_activity_in_tx(&mut tx, &id).await
        .map_err(|e| anyhow_error(&format!("Failed to update session: {}", e)))?;

    tx.commit().await
        .map_err(|e| anyhow_error(&format!("Failed to commit transaction: {}", e)))?;

    let mut reply = message.clone();

    if is_user {
        let context = body.agent_context.as_ref()
            .ok_or_else(|| anyhow_error("agentContext is required for user messages"))?;
        let history = message_repo.list_by_session(&id).await
            .map_err(|e| anyhow_error(&format!("Failed to load message history: {}", e)))?;
        let reply_text = generate_agent_reply(context, &history).await?;

        let agent_message = Message {
            id: next_id("msg"),
            session_id: id.clone(),
            role: MessageRole::Agent,
            content: reply_text,
            created_at: now_ts(),
            tags: Some(vec![MessageTag::Summary]),
            queued_offline: None,
        };

        let mut reply_tx = state.pool.begin().await
            .map_err(|e| anyhow_error(&format!("Failed to begin reply transaction: {}", e)))?;
        message_repo.create_in_tx(&mut reply_tx, &agent_message).await
            .map_err(|e| anyhow_error(&format!("Failed to create agent message: {}", e)))?;
        session_repo.update_last_activity_in_tx(&mut reply_tx, &id).await
            .map_err(|e| anyhow_error(&format!("Failed to update session activity: {}", e)))?;
        reply_tx.commit().await
            .map_err(|e| anyhow_error(&format!("Failed to commit reply transaction: {}", e)))?;

        reply = agent_message;
    }

    // Fetch updated session
    let updated_session = session_repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get updated session: {}", e)))?
        .ok_or_else(|| anyhow_error("session not found"))?;

    Ok(Json(MessageResponse {
        reply,
        session: updated_session,
    }))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/evaluate",
    responses((status = 200, body = Evaluation))
)]
async fn evaluate_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Evaluation>, AppError> {
    let session_repo = SessionRepository::new(state.pool.clone());
    let eval_repo = EvaluationRepository::new(state.pool.clone());

    // Begin transaction
    let mut tx = state.pool.begin().await
        .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

    // Get session
    let mut session = session_repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
        .ok_or_else(|| anyhow_error("session not found"))?;

    // Create evaluation
    let eval = Evaluation {
        session_id: id.clone(),
        overall_score: Some(80.0),
        passing: Some(true),
        categories: vec![
            crate::models::EvaluationCategory {
                name: "方針提示とリード力".to_string(),
                weight: 25.0,
                score: Some(80.0),
                feedback: Some("方針が明確です。".to_string()),
            },
            crate::models::EvaluationCategory {
                name: "計画と実行可能性".to_string(),
                weight: 25.0,
                score: Some(80.0),
                feedback: Some("計画の粒度が適切です。".to_string()),
            },
            crate::models::EvaluationCategory {
                name: "コラボレーションとフィードバック".to_string(),
                weight: 25.0,
                score: Some(80.0),
                feedback: Some("対話が円滑です。".to_string()),
            },
            crate::models::EvaluationCategory {
                name: "リスク/前提管理と改善姿勢".to_string(),
                weight: 25.0,
                score: Some(80.0),
                feedback: Some("リスク感度が良好です。".to_string()),
            },
        ],
        summary: Some("評価サンプル".to_string()),
        improvement_advice: Some("リスク対応の優先度を明確にしてください。".to_string()),
    };
    eval_repo.create_in_tx(&mut tx, &eval).await
        .map_err(|e| anyhow_error(&format!("Failed to create evaluation: {}", e)))?;

    // Update session status
    session.status = SessionStatus::Evaluated;
    session.evaluation_requested = true;
    session.last_activity_at = now_ts();
    session_repo.update_last_activity_in_tx(&mut tx, &id).await
        .map_err(|e| anyhow_error(&format!("Failed to update session: {}", e)))?;

    tx.commit().await
        .map_err(|e| anyhow_error(&format!("Failed to commit transaction: {}", e)))?;

    Ok(Json(eval))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}/comments",
    responses((status = 200, body = [ManagerComment]))
)]
async fn list_comments(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<ManagerComment>>, AppError> {
    let comment_repo = CommentRepository::new(state.pool.clone());
    let comments = comment_repo.list_by_session(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;
    Ok(Json(comments))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/comments",
    request_body = CreateCommentRequest,
    responses((status = 201, body = ManagerComment))
)]
async fn create_comment(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<CreateCommentRequest>,
) -> Result<Json<ManagerComment>, AppError> {
    let comment_repo = CommentRepository::new(state.pool.clone());

    let comment = ManagerComment {
        id: next_id("comment"),
        session_id: id,
        author_name: body.author_name,
        content: body.content,
        created_at: now_ts(),
    };

    let created = comment_repo.create(&comment).await
        .map_err(|e| anyhow_error(&format!("Failed to create comment: {}", e)))?;

    Ok(Json(created))
}

#[derive(Deserialize, ToSchema)]
struct SessionSnapshot {
    session: Session,
    messages: Vec<Message>,
    evaluation: Option<Evaluation>,
}

#[derive(Deserialize, ToSchema)]
struct ImportRequest {
    sessions: Vec<SessionSnapshot>,
}

#[derive(Serialize, ToSchema)]
struct ImportResult {
    imported: usize,
    failed: Vec<String>,
}

#[utoipa::path(
    post,
    path = "/import",
    request_body = ImportRequest,
    responses((status = 200, body = ImportResult))
)]
async fn import_sessions(
    State(state): State<SharedState>,
    Json(body): Json<ImportRequest>,
) -> Result<Json<ImportResult>, AppError> {
    let mut imported = 0;
    let mut failed = Vec::new();

    for snapshot in body.sessions {
        match import_snapshot(&state.pool, &snapshot).await {
            Ok(_) => imported += 1,
            Err(e) => failed.push(format!("{}: {}", snapshot.session.id, e)),
        }
    }

    Ok(Json(ImportResult { imported, failed }))
}

async fn import_snapshot(pool: &PgPool, snapshot: &SessionSnapshot) -> anyhow::Result<()> {
    let mut tx = pool.begin().await?;

    // Insert session
    let session_repo = SessionRepository::new(pool.clone());
    session_repo.create_in_tx(&mut tx, &snapshot.session).await?;

    // Insert messages
    let message_repo = MessageRepository::new(pool.clone());
    for msg in &snapshot.messages {
        message_repo.create_in_tx(&mut tx, msg).await?;
    }

    // Insert evaluation if exists
    if let Some(eval) = &snapshot.evaluation {
        let eval_repo = EvaluationRepository::new(pool.clone());
        eval_repo.create_in_tx(&mut tx, eval).await?;
    }

    tx.commit().await?;
    Ok(())
}
