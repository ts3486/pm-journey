use axum::{extract::State, Json};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::EntitlementResponse;

#[utoipa::path(
    get,
    path = "/me/entitlements",
    responses((status = 200, body = EntitlementResponse))
)]
pub async fn get_my_entitlements(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<EntitlementResponse>, AppError> {
    let response = state
        .services()
        .entitlements()
        .get_my_entitlements(&auth.user_id)
        .await?;
    Ok(Json(response))
}
