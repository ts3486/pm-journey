use axum::http::StatusCode;
use sqlx::PgPool;

use crate::error::{anyhow_error, AppError};
use crate::features::organizations::services::OrganizationService;
use crate::features::sessions::repository::SessionRepository;
use crate::models::Session;
use crate::shared::admin_override::is_admin_override_user;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SessionPermissionScope {
    Owner,
    OrganizationRole(String),
    AdminOverride,
}

#[derive(Debug, Clone)]
pub struct SessionAccessContext {
    pub session: Session,
    scope: SessionPermissionScope,
}

impl SessionAccessContext {
    pub fn is_owner(&self) -> bool {
        matches!(self.scope, SessionPermissionScope::Owner)
    }

    pub fn is_admin_override(&self) -> bool {
        matches!(self.scope, SessionPermissionScope::AdminOverride)
    }

    pub fn org_role(&self) -> Option<&str> {
        match &self.scope {
            SessionPermissionScope::Owner => None,
            SessionPermissionScope::OrganizationRole(role) => Some(role.as_str()),
            SessionPermissionScope::AdminOverride => None,
        }
    }

    pub fn can_view(&self) -> bool {
        self.is_owner()
            || self.is_admin_override()
            || matches_org_role(self.org_role(), &["owner", "admin", "manager", "reviewer"])
    }

    pub fn can_edit_session(&self) -> bool {
        self.is_owner() || self.is_admin_override()
    }

    pub fn can_comment(&self) -> bool {
        self.is_owner()
            || self.is_admin_override()
            || matches_org_role(self.org_role(), &["owner", "admin", "manager", "reviewer"])
    }

    pub fn can_manage_outputs(&self) -> bool {
        self.is_owner()
            || self.is_admin_override()
            || matches_org_role(self.org_role(), &["owner", "admin", "manager", "reviewer"])
    }

    pub fn comment_author_role(&self) -> Option<&'static str> {
        if self.is_owner() {
            return Some("self");
        }
        if self.is_admin_override() {
            return Some("owner");
        }

        match self.org_role() {
            Some("manager") => Some("manager"),
            Some("reviewer") => Some("reviewer"),
            Some("owner") | Some("admin") => Some("owner"),
            _ => None,
        }
    }
}

fn matches_org_role(role: Option<&str>, allowed: &[&str]) -> bool {
    match role {
        Some(role) => allowed.contains(&role),
        None => false,
    }
}

pub async fn authorize_session_access(
    pool: &PgPool,
    session_id: &str,
    user_id: &str,
) -> Result<SessionAccessContext, AppError> {
    let repo = SessionRepository::new(pool.clone());
    let session = repo
        .get_by_id(session_id)
        .await
        .map_err(|e| anyhow_error(&format!("Failed to fetch session: {}", e)))?
        .ok_or_else(|| {
            AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("session not found"))
        })?;

    if is_admin_override_user(user_id) {
        return Ok(SessionAccessContext {
            session,
            scope: SessionPermissionScope::AdminOverride,
        });
    }

    let owner_session = repo
        .get_for_user(session_id, user_id)
        .await
        .map_err(|e| anyhow_error(&format!("Failed to fetch session for user: {}", e)))?;

    if owner_session.is_some() {
        return Ok(SessionAccessContext {
            session,
            scope: SessionPermissionScope::Owner,
        });
    }

    let org_id = session.organization_id.as_deref().ok_or_else(|| {
        AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("session not found"))
    })?;

    let org_service = OrganizationService::new(pool.clone());
    let member = org_service.find_member(org_id, user_id).await?;
    let member = member.ok_or_else(|| {
        AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("session not found"))
    })?;

    Ok(SessionAccessContext {
        session,
        scope: SessionPermissionScope::OrganizationRole(member.role.to_ascii_lowercase()),
    })
}

#[cfg(test)]
mod tests {
    use super::{SessionAccessContext, SessionPermissionScope};
    use crate::models::{ProgressFlags, Session, SessionStatus};

    fn sample_session() -> Session {
        Session {
            id: "session-test".to_string(),
            scenario_id: "basic-intro-alignment".to_string(),
            scenario_discipline: None,
            status: SessionStatus::Active,
            started_at: "2026-01-01T00:00:00Z".to_string(),
            ended_at: None,
            last_activity_at: "2026-01-01T00:00:00Z".to_string(),
            user_name: None,
            progress_flags: ProgressFlags {
                requirements: false,
                priorities: false,
                risks: false,
                acceptance: false,
            },
            evaluation_requested: false,
            mission_status: None,
            organization_id: None,
        }
    }

    #[test]
    fn admin_override_has_full_session_permissions() {
        let context = SessionAccessContext {
            session: sample_session(),
            scope: SessionPermissionScope::AdminOverride,
        };

        assert!(context.can_view());
        assert!(context.can_edit_session());
        assert!(context.can_comment());
        assert!(context.can_manage_outputs());
        assert_eq!(context.comment_author_role(), Some("owner"));
    }
}
