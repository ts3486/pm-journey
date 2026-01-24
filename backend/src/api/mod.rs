use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicU64, Ordering};
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
        crate::models::ProductInfo
    ))
)]
struct ApiDoc;

pub struct AppState {
    pool: PgPool,
}

pub type SharedState = Arc<AppState>;

static ID_GEN: AtomicU64 = AtomicU64::new(1);

fn next_id(prefix: &str) -> String {
    let n = ID_GEN.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{n}")
}

fn now_ts() -> String {
    chrono::Utc::now().to_rfc3339()
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
    #[serde(alias = "scenario_id")]
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

    // Fetch updated session
    let updated_session = session_repo.get(&id).await
        .map_err(|e| anyhow_error(&format!("Failed to get updated session: {}", e)))?
        .ok_or_else(|| anyhow_error("session not found"))?;

    Ok(Json(MessageResponse {
        reply: message,
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
