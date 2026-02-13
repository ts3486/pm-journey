use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{CreateOutputRequest, Output};

#[utoipa::path(
    get,
    path = "/sessions/{id}/outputs",
    responses((status = 200, body = [Output]))
)]
pub async fn list_outputs(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<Output>>, AppError> {
    let outputs = state
        .services()
        .outputs()
        .list_outputs(&id, &auth.user_id)
        .await?;
    Ok(Json(outputs))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/outputs",
    request_body = CreateOutputRequest,
    responses((status = 201, body = Output))
)]
pub async fn create_output(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(body): Json<CreateOutputRequest>,
) -> Result<(StatusCode, Json<Output>), AppError> {
    let output = state
        .services()
        .outputs()
        .create_output(&id, &auth.user_id, body)
        .await?;
    Ok((StatusCode::CREATED, Json(output)))
}

#[utoipa::path(
    delete,
    path = "/sessions/{id}/outputs/{outputId}",
    responses((status = 204))
)]
pub async fn delete_output(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path((session_id, output_id)): Path<(String, String)>,
) -> Result<StatusCode, AppError> {
    let deleted = state
        .services()
        .outputs()
        .delete_output(&session_id, &output_id, &auth.user_id)
        .await?;
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}
