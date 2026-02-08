use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{Evaluation, EvaluationRequest};

#[utoipa::path(
    post,
    path = "/sessions/{id}/evaluate",
    request_body = EvaluationRequest,
    responses((status = 200, body = Evaluation))
)]
pub async fn evaluate_session(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(body): Json<EvaluationRequest>,
) -> Result<Json<Evaluation>, AppError> {
    let eval = state
        .services()
        .evaluations()
        .evaluate_session(&id, &auth.user_id, body)
        .await?;
    Ok(Json(eval))
}
