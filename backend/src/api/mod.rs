use axum::{
    extract::Path,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Mutex, OnceLock};
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;

use crate::error::{anyhow_error, AppError};
use crate::models::{
    default_scenarios, Evaluation, HistoryItem, ManagerComment, Message, MessageRole, MessageTag,
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
        create_comment
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

#[derive(Clone, Serialize, Deserialize)]
struct SessionRecord {
    session: Session,
    messages: Vec<Message>,
    comments: Vec<ManagerComment>,
    evaluation: Option<Evaluation>,
}

static STORE: OnceLock<Mutex<HashMap<String, SessionRecord>>> = OnceLock::new();
static ID_GEN: AtomicU64 = AtomicU64::new(1);

fn store_path() -> PathBuf {
    std::env::var("STORE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("/tmp/pm_journey_store.json"))
}

fn load_store_from_disk() -> HashMap<String, SessionRecord> {
    let path = store_path();
    if let Ok(bytes) = fs::read(&path) {
        if let Ok(map) = serde_json::from_slice::<HashMap<String, SessionRecord>>(&bytes) {
            return map;
        }
    }
    HashMap::new()
}

fn persist_store(data: &HashMap<String, SessionRecord>) {
    let path = store_path();
    if let Ok(json) = serde_json::to_vec_pretty(data) {
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(path, json);
    }
}

fn store() -> &'static Mutex<HashMap<String, SessionRecord>> {
    STORE.get_or_init(|| Mutex::new(load_store_from_disk()))
}

fn next_id(prefix: &str) -> String {
    let n = ID_GEN.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{n}")
}

fn now_ts() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn router() -> Router {
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
async fn create_session(Json(body): Json<CreateSessionRequest>) -> Result<Json<Session>, AppError> {
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
    let record = SessionRecord {
        session: session.clone(),
        messages: vec![],
        comments: vec![],
        evaluation: None,
    };
    let mut data = store().lock().unwrap();
    data.insert(session.id.clone(), record);
    persist_store(&data);
    Ok(Json(session))
}

#[utoipa::path(
    get,
    path = "/sessions",
    responses((status = 200, body = [HistoryItem]))
)]
async fn list_sessions() -> Result<Json<Vec<HistoryItem>>, AppError> {
    let data = store().lock().unwrap();
    let mut items = Vec::new();
    for record in data.values() {
        let messages = &record.messages;
        items.push(HistoryItem {
            session_id: record.session.id.clone(),
            scenario_id: Some(record.session.scenario_id.clone()),
            scenario_discipline: record.session.scenario_discipline.clone(),
            metadata: crate::models::HistoryMetadata {
                duration: None,
                message_count: Some(messages.len() as u64),
            },
            actions: messages
                .iter()
                .filter(|m| m.tags.is_some() && !m.tags.as_ref().unwrap().is_empty())
                .cloned()
                .collect(),
            evaluation: record.evaluation.clone(),
            storage_location: Some("api".to_string()),
            comments: Some(record.comments.clone()),
        });
    }
    Ok(Json(items))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}",
    responses((status = 200, body = HistoryItem))
)]
async fn get_session(Path(id): Path<String>) -> Result<Json<HistoryItem>, AppError> {
    let data = store().lock().unwrap();
    let record = data
        .get(&id)
        .ok_or_else(|| anyhow_error("session not found"))?;
    let messages = &record.messages;
    let item = HistoryItem {
        session_id: record.session.id.clone(),
        scenario_id: Some(record.session.scenario_id.clone()),
        scenario_discipline: record.session.scenario_discipline.clone(),
        metadata: crate::models::HistoryMetadata {
            duration: None,
            message_count: Some(messages.len() as u64),
        },
        actions: messages
            .iter()
            .filter(|m| m.tags.is_some() && !m.tags.as_ref().unwrap().is_empty())
            .cloned()
            .collect(),
        evaluation: record.evaluation.clone(),
        storage_location: Some("api".to_string()),
        comments: Some(record.comments.clone()),
    };
    Ok(Json(item))
}

#[utoipa::path(
    delete,
    path = "/sessions/{id}",
    responses((status = 204, description = "Deleted"))
)]
async fn delete_session(Path(id): Path<String>) -> Result<Json<&'static str>, AppError> {
    let mut data = store().lock().unwrap();
    data.remove(&id);
    persist_store(&data);
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
    Path(id): Path<String>,
    Json(body): Json<CreateMessageRequest>,
) -> Result<Json<MessageResponse>, AppError> {
    let mut data = store().lock().unwrap();
    let record = data
        .get_mut(&id)
        .ok_or_else(|| anyhow_error("session not found"))?;
    let message = Message {
        id: next_id("msg"),
        session_id: id.clone(),
        role: body.role,
        content: body.content,
        created_at: now_ts(),
        tags: body.tags,
        queued_offline: None,
    };
    record.messages.push(message.clone());
    if let Some(ms) = body.mission_status {
        record.session.mission_status = Some(ms);
    }
    record.session.last_activity_at = now_ts();
    let session = record.session.clone();
    let reply = message.clone();
    persist_store(&data);
    Ok(Json(MessageResponse {
        reply,
        session,
    }))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/evaluate",
    responses((status = 200, body = Evaluation))
)]
async fn evaluate_session(Path(id): Path<String>) -> Result<Json<Evaluation>, AppError> {
    let mut data = store().lock().unwrap();
    let record = data
        .get_mut(&id)
        .ok_or_else(|| anyhow_error("session not found"))?;
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
    record.evaluation = Some(eval.clone());
    record.session.status = SessionStatus::Evaluated;
    record.session.evaluation_requested = true;
    record.session.last_activity_at = now_ts();
    persist_store(&data);
    Ok(Json(eval))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}/comments",
    responses((status = 200, body = [ManagerComment]))
)]
async fn list_comments(Path(id): Path<String>) -> Result<Json<Vec<ManagerComment>>, AppError> {
    let data = store().lock().unwrap();
    let record = data
        .get(&id)
        .ok_or_else(|| anyhow_error("session not found"))?;
    Ok(Json(record.comments.clone()))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/comments",
    request_body = CreateCommentRequest,
    responses((status = 201, body = ManagerComment))
)]
async fn create_comment(
    Path(id): Path<String>,
    Json(body): Json<CreateCommentRequest>,
) -> Result<Json<ManagerComment>, AppError> {
    let mut data = store().lock().unwrap();
    let record = data
        .get_mut(&id)
        .ok_or_else(|| anyhow_error("session not found"))?;
    let comment = ManagerComment {
        id: next_id("comment"),
        session_id: id,
        author_name: body.author_name,
        content: body.content,
        created_at: now_ts(),
    };
    record.comments.push(comment.clone());
    Ok(Json(comment))
}
