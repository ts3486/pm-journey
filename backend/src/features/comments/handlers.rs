use axum::{extract::{Path, State}, Json};

use crate::error::AppError;
use crate::state::SharedState;

use super::models::{CreateCommentRequest, ManagerComment};

#[utoipa::path(
    get,
    path = "/sessions/{id}/comments",
    responses((status = 200, body = [ManagerComment]))
)]
pub async fn list_comments(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<ManagerComment>>, AppError> {
    let comments = state.services().comments().list_comments(&id).await?;
    Ok(Json(comments))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/comments",
    request_body = CreateCommentRequest,
    responses((status = 201, body = ManagerComment))
)]
pub async fn create_comment(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<CreateCommentRequest>,
) -> Result<Json<ManagerComment>, AppError> {
    let created = state.services().comments().create_comment(&id, body).await?;
    Ok(Json(created))
}
