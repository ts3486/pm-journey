use sqlx::PgPool;

use crate::error::{anyhow_error, client_error, forbidden_error, AppError};
use crate::features::sessions::authorization::authorize_session_access;
use crate::models::Output;
use crate::shared::helpers::{next_id, now_ts};

use super::models::CreateOutputRequest;
use super::repository::OutputRepository;

#[derive(Clone)]
pub struct OutputService {
    pool: PgPool,
}

impl OutputService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_outputs(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> Result<Vec<Output>, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_view() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for output view",
            ));
        }

        let repo = OutputRepository::new(self.pool.clone());
        repo.list_by_session(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list outputs: {}", e)))
    }

    pub async fn create_output(
        &self,
        session_id: &str,
        user_id: &str,
        body: CreateOutputRequest,
    ) -> Result<Output, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_manage_outputs() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for output create",
            ));
        }

        let value = body.value.trim();
        if value.is_empty() {
            return Err(client_error("output value is required"));
        }

        let output = Output {
            id: next_id("output"),
            session_id: session_id.to_string(),
            kind: body.kind,
            value: value.to_string(),
            note: body.note.and_then(trim_optional),
            created_by_user_id: user_id.to_string(),
            created_at: now_ts(),
        };

        let repo = OutputRepository::new(self.pool.clone());
        repo.create(&output)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create output: {}", e)))
    }

    pub async fn delete_output(
        &self,
        session_id: &str,
        output_id: &str,
        user_id: &str,
    ) -> Result<bool, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_manage_outputs() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for output delete",
            ));
        }

        let repo = OutputRepository::new(self.pool.clone());
        let output = match repo
            .get(output_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch output: {}", e)))?
        {
            Some(output) => output,
            None => return Ok(false),
        };

        if output.session_id != session_id {
            return Ok(false);
        }

        repo.delete(output_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to delete output: {}", e)))
    }
}

fn trim_optional(value: String) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}
