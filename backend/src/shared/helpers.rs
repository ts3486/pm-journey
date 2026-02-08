use chrono::Utc;
use uuid::Uuid;

pub fn next_id(prefix: &str) -> String {
    format!("{prefix}-{}", Uuid::new_v4())
}

pub fn now_ts() -> String {
    Utc::now().to_rfc3339()
}

pub fn normalize_model_id(model_id: &str) -> String {
    model_id
        .strip_prefix("models/")
        .unwrap_or(model_id)
        .to_string()
}

/// Verify that a session belongs to the specified user
pub async fn verify_session_ownership(
    pool: &sqlx::PgPool,
    session_id: &str,
    user_id: &str,
) -> Result<crate::models::Session, crate::error::AppError> {
    use crate::features::sessions::repository::SessionRepository;
    use axum::http::StatusCode;

    let repo = SessionRepository::new(pool.clone());
    repo.get_for_user(session_id, user_id)
        .await
        .map_err(|e| {
            crate::error::AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow::anyhow!("Failed to get session: {}", e),
            )
        })?
        .ok_or_else(|| {
            crate::error::AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("session not found"))
        })
}
