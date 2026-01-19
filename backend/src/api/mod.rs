use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

use crate::error::{anyhow_error, AppError};
use crate::models::{
    default_scenarios, Evaluation, HistoryItem, Message, MessageRole, MessageTag, ProgressFlags, Scenario,
    ScenarioDiscipline, Session, SessionStatus,
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
        evaluate_session
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
        crate::models::ProductInfo
    ))
)]
struct ApiDoc;

pub fn router() -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/scenarios", get(list_scenarios))
        .route("/scenarios/:id", get(get_scenario))
        .route("/sessions", post(create_session).get(list_sessions))
        .route(
            "/sessions/:id",
            get(get_session).delete(delete_session),
        )
        .route("/sessions/:id/messages", post(post_message))
        .route("/sessions/:id/evaluate", post(evaluate_session))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
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

#[derive(Deserialize)]
#[derive(ToSchema)]
#[serde(rename_all = "camelCase")]
struct CreateSessionRequest {
    scenario_id: String,
}

#[utoipa::path(
    post,
    path = "/sessions",
    request_body = CreateSessionRequest,
    responses((status = 201, body = Session))
)]
async fn create_session(
    Json(body): Json<CreateSessionRequest>,
) -> Result<Json<Session>, AppError> {
    let discipline = default_scenarios()
        .into_iter()
        .find(|s| s.id == body.scenario_id)
        .map(|s| s.discipline);
    let session = Session {
        id: "session-1".to_string(),
        scenario_id: body.scenario_id,
        scenario_discipline: discipline,
        status: SessionStatus::Active,
        started_at: chrono::Utc::now().to_rfc3339(),
        ended_at: None,
        last_activity_at: chrono::Utc::now().to_rfc3339(),
        user_name: None,
        progress_flags: ProgressFlags {
            requirements: false,
            priorities: false,
            risks: false,
            acceptance: false,
        },
        evaluation_requested: false,
    };
    Ok(Json(session))
}

#[utoipa::path(
    get,
    path = "/sessions",
    responses((status = 200, body = [HistoryItem]))
)]
async fn list_sessions() -> Result<Json<Vec<HistoryItem>>, AppError> {
    Ok(Json(vec![]))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}",
    responses((status = 200, body = HistoryItem))
)]
async fn get_session() -> Result<Json<HistoryItem>, AppError> {
    let item = HistoryItem {
        session_id: "session-1".to_string(),
        scenario_id: Some("pm-attendance-modernization".to_string()),
        scenario_discipline: Some(ScenarioDiscipline::PM),
        metadata: crate::models::HistoryMetadata {
            duration: Some(0.0),
            message_count: Some(0),
        },
        actions: vec![],
        evaluation: None,
        storage_location: Some("api".to_string()),
    };
    Ok(Json(item))
}

#[utoipa::path(
    delete,
    path = "/sessions/{id}",
    responses((status = 204, description = "Deleted"))
)]
async fn delete_session() -> Result<Json<&'static str>, AppError> {
    Ok(Json("deleted"))
}

#[derive(Deserialize)]
#[derive(ToSchema)]
struct CreateMessageRequest {
    role: MessageRole,
    content: String,
    tags: Option<Vec<MessageTag>>,
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/messages",
    request_body = CreateMessageRequest,
    responses((status = 200, body = Message))
)]
async fn post_message(
    Json(body): Json<CreateMessageRequest>,
) -> Result<Json<Message>, AppError> {
    let message = Message {
        id: "msg-1".to_string(),
        session_id: "session-1".to_string(),
        role: body.role,
        content: body.content,
        created_at: chrono::Utc::now().to_rfc3339(),
        tags: body.tags,
        queued_offline: None,
    };
    Ok(Json(message))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/evaluate",
    responses((status = 200, body = Evaluation))
)]
async fn evaluate_session() -> Result<Json<Evaluation>, AppError> {
    Err(anyhow_error("not implemented"))
}
