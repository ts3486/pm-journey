use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::AppError;
use crate::state::SharedState;

use super::models::{CreateSessionRequest, HistoryItem, Session};

#[utoipa::path(
    post,
    path = "/sessions",
    request_body = CreateSessionRequest,
    responses((status = 201, body = Session))
)]
pub async fn create_session(
    State(state): State<SharedState>,
    Json(body): Json<CreateSessionRequest>,
) -> Result<Json<Session>, AppError> {
    let created = state
        .services()
        .sessions()
        .create_session(body.scenario_id)
        .await?;

    Ok(Json(created))
}

#[utoipa::path(
    get,
    path = "/sessions",
    responses((status = 200, body = [HistoryItem]))
)]
pub async fn list_sessions(
    State(state): State<SharedState>,
) -> Result<Json<Vec<HistoryItem>>, AppError> {
    let items = state.services().sessions().list_sessions().await?;
    Ok(Json(items))
}

#[utoipa::path(
    get,
    path = "/sessions/{id}",
    responses((status = 200, body = HistoryItem))
)]
pub async fn get_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<HistoryItem>, AppError> {
    let item = state.services().sessions().get_session(&id).await?;
    Ok(Json(item))
}

#[utoipa::path(
    delete,
    path = "/sessions/{id}",
    responses((status = 204, description = "Deleted"))
)]
pub async fn delete_session(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<&'static str>, AppError> {
    state.services().sessions().delete_session(&id).await?;
    Ok(Json("deleted"))
}
