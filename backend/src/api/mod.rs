use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use sqlx::{PgPool, Row};
use serde_json::Value as JsonValue;
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

pub struct AppState {
    pool: Option<PgPool>,
    store: Mutex<HashMap<String, SessionRecord>>,
}

pub type SharedState = Arc<AppState>;

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

async fn load_store_from_db(pool: &PgPool) -> HashMap<String, SessionRecord> {
    let mut map = HashMap::new();
    if let Ok(rows) = sqlx::query("SELECT payload FROM session_store")
        .fetch_all(pool)
        .await
    {
        for row in rows {
            let val: JsonValue = row.get("payload");
            if let Ok(rec) = serde_json::from_value::<SessionRecord>(val) {
                map.insert(rec.session.id.clone(), rec);
            }
        }
    }
    map
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

async fn upsert_record_db(record: &SessionRecord, pool: Option<&PgPool>) {
    if let (Some(pool), Ok(val)) = (pool, serde_json::to_value(record)) {
        let _ = sqlx::query(
            "INSERT INTO session_store (id, payload) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET payload = $2",
        )
        .bind(&record.session.id)
        .bind(val)
        .execute(pool)
        .await;
    }
}

async fn delete_record_db(id: &str, pool: Option<&PgPool>) {
    if let Some(pool) = pool {
        let _ = sqlx::query("DELETE FROM session_store WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await;
    }
}

fn next_id(prefix: &str) -> String {
    let n = ID_GEN.fetch_add(1, Ordering::Relaxed);
    format!("{prefix}-{n}")
}

fn now_ts() -> String {
    chrono::Utc::now().to_rfc3339()
}

fn make_state(store: HashMap<String, SessionRecord>, pool: Option<PgPool>) -> SharedState {
    Arc::new(AppState {
        pool,
        store: Mutex::new(store),
    })
}

pub fn default_state() -> SharedState {
    make_state(load_store_from_disk(), None)
}

pub fn state_with_pool(pool: PgPool) -> SharedState {
    make_state(HashMap::new(), Some(pool))
}

pub async fn init_db(pool: &PgPool) -> Result<(), AppError> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS session_store (
            id TEXT PRIMARY KEY,
            payload JSONB NOT NULL
        );
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| anyhow_error(&format!("db init failed: {}", e)))?;
    Ok(())
}

pub async fn load_from_db(state: &SharedState) {
    if let Some(pool) = &state.pool {
        let map = load_store_from_db(pool).await;
        let mut store_lock = state.store.lock().unwrap();
        for (k, v) in map {
            store_lock.insert(k, v);
        }
    }
}

#[allow(dead_code)]
pub fn router() -> Router {
    router_with_state(default_state())
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
    let record = SessionRecord {
        session: session.clone(),
        messages: vec![],
        comments: vec![],
        evaluation: None,
    };
    let pool = state.pool.clone();
    {
        let mut data = state.store.lock().unwrap();
        data.insert(session.id.clone(), record.clone());
        persist_store(&data);
    }
    upsert_record_db(&record, pool.as_ref()).await;
    Ok(Json(session))
}

#[utoipa::path(
    get,
    path = "/sessions",
    responses((status = 200, body = [HistoryItem]))
)]
async fn list_sessions(State(state): State<SharedState>) -> Result<Json<Vec<HistoryItem>>, AppError> {
    let data = state.store.lock().unwrap();
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
async fn get_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<HistoryItem>, AppError> {
    let data = state.store.lock().unwrap();
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
async fn delete_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<&'static str>, AppError> {
    let pool = state.pool.clone();
    {
        let mut data = state.store.lock().unwrap();
        data.remove(&id);
        persist_store(&data);
    }
    delete_record_db(&id, pool.as_ref()).await;
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
    let pool = state.pool.clone();
    let (message, record_clone) = {
        let mut data = state.store.lock().unwrap();
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
        let record_clone = record.clone();
        persist_store(&data);
        (message, record_clone)
    };
    upsert_record_db(&record_clone, pool.as_ref()).await;
    Ok(Json(MessageResponse {
        reply: message,
        session: record_clone.session,
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
    let pool = state.pool.clone();
    let (eval, record_clone) = {
        let mut data = state.store.lock().unwrap();
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
        let record_clone = record.clone();
        persist_store(&data);
        (eval, record_clone)
    };
    upsert_record_db(&record_clone, pool.as_ref()).await;
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
    let data = state.store.lock().unwrap();
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
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<CreateCommentRequest>,
) -> Result<Json<ManagerComment>, AppError> {
    let pool = state.pool.clone();
    let (comment, record_clone) = {
        let mut data = state.store.lock().unwrap();
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
        let record_clone = record.clone();
        persist_store(&data);
        (comment, record_clone)
    };
    upsert_record_db(&record_clone, pool.as_ref()).await;
    Ok(Json(comment))
}
