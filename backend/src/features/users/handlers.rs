use axum::{extract::State, http::StatusCode, Json};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::MyAccountResponse;

#[utoipa::path(
    get,
    path = "/me",
    responses((status = 200, body = MyAccountResponse))
)]
pub async fn get_my_account(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<MyAccountResponse>, AppError> {
    let account = state
        .services()
        .users()
        .get_my_account(&auth.user_id)
        .await?;
    Ok(Json(account))
}

#[utoipa::path(
    delete,
    path = "/me",
    responses((status = 204))
)]
pub async fn delete_my_account(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    state
        .services()
        .users()
        .delete_my_account(&auth.user_id)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
