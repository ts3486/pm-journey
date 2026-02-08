use sqlx::PgPool;

use crate::error::{anyhow_error, AppError};
use crate::features::comments::repository::CommentRepository;
use crate::features::evaluations::repository::EvaluationRepository;
use crate::features::messages::repository::MessageRepository;
use crate::features::sessions::repository::SessionRepository;
use crate::models::{
    default_scenarios, HistoryItem, HistoryMetadata, MessageRole, ProgressFlags, Session,
    SessionStatus,
};
use crate::shared::helpers::{next_id, now_ts};
use axum::http::StatusCode;

#[derive(Clone)]
pub struct SessionService {
    pool: PgPool,
}

impl SessionService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_session(
        &self,
        scenario_id: String,
        user_id: &str,
    ) -> Result<Session, AppError> {
        let scenario = default_scenarios()
            .into_iter()
            .find(|s| s.id == scenario_id);
        let discipline = scenario.as_ref().map(|s| s.discipline.clone());
        let session = Session {
            id: next_id("session"),
            scenario_id,
            scenario_discipline: discipline,
            status: SessionStatus::Active,
            started_at: now_ts(),
            ended_at: None,
            last_activity_at: now_ts(),
            user_name: None,
            progress_flags: ProgressFlags {
                requirements: false,
                priorities: false,
                risks: false,
                acceptance: false,
            },
            evaluation_requested: false,
            mission_status: Some(vec![]),
        };

        let repo = SessionRepository::new(self.pool.clone());
        let created = repo
            .create(&session, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create session: {}", e)))?;

        Ok(created)
    }

    pub async fn list_sessions(&self, user_id: &str) -> Result<Vec<HistoryItem>, AppError> {
        let session_repo = SessionRepository::new(self.pool.clone());
        let message_repo = MessageRepository::new(self.pool.clone());
        let eval_repo = EvaluationRepository::new(self.pool.clone());
        let comment_repo = CommentRepository::new(self.pool.clone());

        let sessions = session_repo
            .list_for_user(user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list sessions: {}", e)))?;

        let mut items = Vec::new();
        for session in sessions {
            let messages = message_repo
                .list_by_session(&session.id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to list messages: {}", e)))?;
            let evaluation = eval_repo
                .get_by_session(&session.id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to get evaluation: {}", e)))?;
            let comments = comment_repo
                .list_by_session(&session.id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;

            items.push(HistoryItem {
                session_id: session.id.clone(),
                scenario_id: Some(session.scenario_id.clone()),
                scenario_discipline: session.scenario_discipline.clone(),
                metadata: HistoryMetadata {
                    duration: None,
                    message_count: Some(messages.len() as u64),
                },
                actions: messages
                    .iter()
                    .filter(|m| m.role != MessageRole::System)
                    .cloned()
                    .collect(),
                evaluation,
                storage_location: Some("api".to_string()),
                comments: Some(comments),
            });
        }
        Ok(items)
    }

    pub async fn get_session(&self, id: &str, user_id: &str) -> Result<HistoryItem, AppError> {
        let session_repo = SessionRepository::new(self.pool.clone());
        let message_repo = MessageRepository::new(self.pool.clone());
        let eval_repo = EvaluationRepository::new(self.pool.clone());
        let comment_repo = CommentRepository::new(self.pool.clone());

        let session = session_repo
            .get_for_user(id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
            .ok_or_else(|| {
                AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("session not found"))
            })?;

        let messages = message_repo
            .list_by_session(id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list messages: {}", e)))?;
        let evaluation = eval_repo
            .get_by_session(id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get evaluation: {}", e)))?;
        let comments = comment_repo
            .list_by_session(id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list comments: {}", e)))?;

        let item = HistoryItem {
            session_id: session.id.clone(),
            scenario_id: Some(session.scenario_id.clone()),
            scenario_discipline: session.scenario_discipline.clone(),
            metadata: HistoryMetadata {
                duration: None,
                message_count: Some(messages.len() as u64),
            },
            actions: messages
                .iter()
                .filter(|m| m.role != MessageRole::System)
                .cloned()
                .collect(),
            evaluation,
            storage_location: Some("api".to_string()),
            comments: Some(comments),
        };

        Ok(item)
    }

    pub async fn delete_session(&self, id: &str, user_id: &str) -> Result<(), AppError> {
        let repo = SessionRepository::new(self.pool.clone());
        let deleted = repo
            .delete_for_user(id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to delete session: {}", e)))?;
        if !deleted {
            return Err(AppError::new(
                StatusCode::NOT_FOUND,
                anyhow::anyhow!("session not found"),
            ));
        }
        Ok(())
    }
}
