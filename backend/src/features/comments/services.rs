use sqlx::PgPool;

use crate::error::{anyhow_error, forbidden_error, AppError};
use crate::features::sessions::authorization::authorize_session_access;
use crate::models::ManagerComment;
use crate::shared::helpers::{next_id, now_ts};

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
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_view() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for comment view",
            ));
        }

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
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_comment() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for manager comment",
            ));
        }

        let comment_repo = CommentRepository::new(self.pool.clone());

        let comment = ManagerComment {
            id: next_id("comment"),
            session_id: session_id.to_string(),
            author_name: body.author_name,
            author_user_id: Some(user_id.to_string()),
            author_role: access.comment_author_role().map(str::to_string),
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
