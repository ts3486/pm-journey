use sqlx::PgPool;

use super::authorization::authorize_session_access;
use crate::error::{anyhow_error, client_error, forbidden_error, payment_required_error, AppError};
use crate::features::comments::repository::CommentRepository;
use crate::features::entitlements::services::EntitlementService;
use crate::features::evaluations::repository::EvaluationRepository;
use crate::features::feature_flags::services::FeatureFlagService;
use crate::features::messages::repository::MessageRepository;
use crate::features::sessions::repository::SessionRepository;
use crate::models::{
    default_scenarios, HistoryItem, HistoryMetadata, MessageRole, ProgressFlags, Session,
    SessionStatus,
};
use crate::shared::admin_override::is_admin_override_user;
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
            .find(|s| s.id == scenario_id)
            .ok_or_else(|| client_error("scenario not found"))?;
        let discipline = Some(scenario.discipline.clone());
        let mut organization_id = None;

        let feature_flags = FeatureFlagService::new();
        if feature_flags.is_entitlement_enforced() {
            let entitlement_service = EntitlementService::new(self.pool.clone());
            let effective_plan = entitlement_service.resolve_effective_plan(user_id).await?;

            if !EntitlementService::can_access_scenario(
                &effective_plan.plan_code,
                &scenario_id,
                discipline.as_ref(),
            ) {
                return Err(payment_required_error(
                    "PLAN_REQUIRED: scenario is not available on current plan",
                ));
            }

            organization_id = effective_plan.organization_id;
        }

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
            organization_id,
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

        let sessions = if is_admin_override_user(user_id) {
            session_repo
                .list_all()
                .await
                .map_err(|e| anyhow_error(&format!("Failed to list all sessions: {}", e)))?
        } else {
            session_repo
                .list_for_user(user_id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to list sessions: {}", e)))?
        };

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
                    started_at: Some(session.started_at.clone()),
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
        let message_repo = MessageRepository::new(self.pool.clone());
        let eval_repo = EvaluationRepository::new(self.pool.clone());
        let comment_repo = CommentRepository::new(self.pool.clone());

        let access = authorize_session_access(&self.pool, id, user_id).await?;
        if !access.can_view() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for session view",
            ));
        }
        let session = access.session;

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
                started_at: Some(session.started_at.clone()),
            },
            actions: messages.iter().cloned().collect(),
            evaluation,
            storage_location: Some("api".to_string()),
            comments: Some(comments),
        };

        Ok(item)
    }

    pub async fn delete_session(&self, id: &str, user_id: &str) -> Result<(), AppError> {
        let repo = SessionRepository::new(self.pool.clone());
        if is_admin_override_user(user_id) {
            let deleted = repo
                .delete_by_id(id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to delete session: {}", e)))?;
            if !deleted {
                return Err(AppError::new(
                    StatusCode::NOT_FOUND,
                    anyhow::anyhow!("session not found"),
                ));
            }
            return Ok(());
        }

        let access = authorize_session_access(&self.pool, id, user_id).await?;
        if !access.can_edit_session() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for session delete",
            ));
        }

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
