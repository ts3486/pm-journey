use axum::{extract::State, Json};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::CreditBalanceResponse;

#[utoipa::path(
    get,
    path = "/me/credits",
    responses((status = 200, body = CreditBalanceResponse))
)]
pub async fn get_my_credits(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<CreditBalanceResponse>, AppError> {
    let response = state
        .services()
        .credits()
        .get_my_credits(&auth.user_id)
        .await?;
    Ok(Json(response))
}
