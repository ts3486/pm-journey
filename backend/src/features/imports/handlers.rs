use axum::{extract::State, Json};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{ImportRequest, ImportResult};

#[utoipa::path(
    post,
    path = "/import",
    request_body = ImportRequest,
    responses((status = 200, body = ImportResult))
)]
pub async fn import_sessions(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<ImportRequest>,
) -> Result<Json<ImportResult>, AppError> {
    let result = state
        .services()
        .imports()
        .import_sessions(body.sessions, &auth.user_id)
        .await?;
    Ok(Json(result))
}
