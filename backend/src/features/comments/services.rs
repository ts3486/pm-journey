use sqlx::PgPool;

use crate::error::{anyhow_error, AppError};
use crate::models::ManagerComment;
use crate::shared::helpers::{next_id, now_ts, verify_session_ownership};

use super::models::CreateCommentRequest;
use super::repository::CommentRepository;

#[derive(Clone)]
pub struct CommentService {
    pool: PgPool,
}

impl CommentService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_comments(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> Result<Vec<ManagerComment>, AppError> {
        verify_session_ownership(&self.pool, session_id, user_id).await?;

        let comment_repo = CommentRepository::new(self.pool.clone());
        let comments = comment_repo
            .list_by_session(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;
        Ok(comments)
    }

    pub async fn create_comment(
        &self,
        session_id: &str,
        user_id: &str,
        body: CreateCommentRequest,
    ) -> Result<ManagerComment, AppError> {
        verify_session_ownership(&self.pool, session_id, user_id).await?;

        let comment_repo = CommentRepository::new(self.pool.clone());

        let comment = ManagerComment {
            id: next_id("comment"),
            session_id: session_id.to_string(),
            author_name: body.author_name,
            content: body.content,
            created_at: now_ts(),
        };

        let created = comment_repo
            .create(&comment)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create comment: {}", e)))?;

        Ok(created)
    }
}
