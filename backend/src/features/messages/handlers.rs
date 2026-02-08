use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{CreateMessageRequest, Message, MessageResponse};

#[utoipa::path(
    get,
    path = "/sessions/{id}/messages",
    responses((status = 200, body = [Message]))
)]
pub async fn list_messages(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<Message>>, AppError> {
    let messages = state
        .services()
        .messages()
        .list_messages(&id, &auth.user_id)
        .await?;
    Ok(Json(messages))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/messages",
    request_body = CreateMessageRequest,
    responses((status = 200, body = MessageResponse))
)]
pub async fn post_message(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(body): Json<CreateMessageRequest>,
) -> Result<Json<MessageResponse>, AppError> {
    let response = state
        .services()
        .messages()
        .post_message(&id, &auth.user_id, body)
        .await?;
    Ok(Json(response))
}
