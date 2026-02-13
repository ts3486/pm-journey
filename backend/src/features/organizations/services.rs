use axum::http::StatusCode;
use sqlx::PgPool;

use crate::error::{anyhow_error, client_error, forbidden_error, AppError};
use crate::shared::helpers::{next_id, now_ts};

use super::models::{
    CreateInvitationRequest, CreateOrganizationRequest, CurrentOrganizationResponse,
    InvitationResponse, Organization, OrganizationInvitation, OrganizationMember,
    OrganizationMembersResponse, UpdateMemberRequest, UpdateOrganizationRequest,
};
use super::repository::OrganizationRepository;

#[derive(Clone)]
pub struct OrganizationService {
    pool: PgPool,
}

impl OrganizationService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn find_member(
        &self,
        org_id: &str,
        user_id: &str,
    ) -> Result<Option<OrganizationMember>, AppError> {
        let org_repo = OrganizationRepository::new(self.pool.clone());
        org_repo
            .find_member(org_id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to find organization member: {}", e)))
    }

    pub async fn create_organization(
        &self,
        user_id: &str,
        body: CreateOrganizationRequest,
    ) -> Result<Organization, AppError> {
        let name = body.name.trim();
        if name.is_empty() {
            return Err(client_error("organization name is required"));
        }

        let org = Organization {
            id: next_id("org"),
            name: name.to_string(),
            created_by_user_id: user_id.to_string(),
            created_at: now_ts(),
            updated_at: now_ts(),
        };
        let repo = OrganizationRepository::new(self.pool.clone());
        repo.create(&org, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create organization: {}", e)))
    }

    pub async fn get_current_organization(
        &self,
        user_id: &str,
    ) -> Result<CurrentOrganizationResponse, AppError> {
        let (organization, membership) = self.resolve_current_org_context(user_id).await?;
        let org_id = organization.id.clone();
        self.build_current_org_response(&org_id, organization, membership)
            .await
    }

    pub async fn update_current_organization(
        &self,
        user_id: &str,
        body: UpdateOrganizationRequest,
    ) -> Result<Organization, AppError> {
        let name = body.name.trim();
        if name.is_empty() {
            return Err(client_error("organization name is required"));
        }

        let (organization, membership) = self.resolve_current_org_context(user_id).await?;
        if !can_manage_organization(&membership.role) {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for organization update",
            ));
        }

        let repo = OrganizationRepository::new(self.pool.clone());
        repo.update_name(&organization.id, name)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to update organization: {}", e)))?
            .ok_or_else(|| not_found("organization not found"))
    }

    pub async fn list_current_members(
        &self,
        user_id: &str,
    ) -> Result<OrganizationMembersResponse, AppError> {
        let (organization, _membership) = self.resolve_current_org_context(user_id).await?;
        let repo = OrganizationRepository::new(self.pool.clone());

        let members = repo
            .list_members(&organization.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list members: {}", e)))?;
        let seat_limit = repo
            .get_active_seat_limit(&organization.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch seat limit: {}", e)))?;
        let active_member_count = repo
            .count_active_members(&organization.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to count active members: {}", e)))?;
        let pending_invitation_count = repo
            .count_pending_invitations(&organization.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to count pending invitations: {}", e)))?;

        Ok(OrganizationMembersResponse {
            members,
            seat_limit,
            active_member_count,
            pending_invitation_count,
        })
    }

    pub async fn create_invitation(
        &self,
        user_id: &str,
        body: CreateInvitationRequest,
    ) -> Result<InvitationResponse, AppError> {
        let (organization, membership) = self.resolve_current_org_context(user_id).await?;
        if !can_manage_members(&membership.role) {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for invitation creation",
            ));
        }

        let email = body.email.trim().to_lowercase();
        if email.is_empty() {
            return Err(client_error("invitation email is required"));
        }
        if !is_assignable_role(&body.role) {
            return Err(client_error("invalid invitation role"));
        }

        let repo = OrganizationRepository::new(self.pool.clone());
        if repo
            .find_pending_invitation_by_email(&organization.id, &email)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to check existing invitation: {}", e)))?
            .is_some()
        {
            return Err(client_error("invitation already pending for this email"));
        }

        self.enforce_seat_limit(&organization.id, true).await?;

        let invite_token = next_id("org_invite");
        let invitation = OrganizationInvitation {
            id: next_id("org_invitation"),
            organization_id: organization.id,
            email,
            role: body.role.to_ascii_lowercase(),
            invite_token_hash: invite_token.clone(),
            expires_at: (chrono::Utc::now() + chrono::Duration::days(7)).to_rfc3339(),
            status: "pending".to_string(),
            created_by_user_id: user_id.to_string(),
            created_at: now_ts(),
        };

        let created = repo
            .create_invitation(&invitation)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create invitation: {}", e)))?;

        Ok(InvitationResponse {
            invitation: created,
            invite_token,
        })
    }

    pub async fn accept_invitation(
        &self,
        user_id: &str,
        user_email: Option<&str>,
        invite_token: &str,
    ) -> Result<CurrentOrganizationResponse, AppError> {
        let repo = OrganizationRepository::new(self.pool.clone());
        let invitation = repo
            .find_invitation_by_token(invite_token)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to find invitation: {}", e)))?
            .ok_or_else(|| not_found("invitation not found"))?;

        if invitation.status != "pending" {
            return Err(client_error("invitation is no longer active"));
        }

        let expires_at = chrono::DateTime::parse_from_rfc3339(&invitation.expires_at)
            .map_err(|_| client_error("invalid invitation expiry"))?
            .with_timezone(&chrono::Utc);
        if expires_at <= chrono::Utc::now() {
            let _ = repo
                .update_invitation_status(&invitation.id, "expired")
                .await
                .map_err(|e| anyhow_error(&format!("Failed to expire invitation: {}", e)))?;
            return Err(client_error("invitation has expired"));
        }

        if let Some(email) = user_email {
            if !email.eq_ignore_ascii_case(&invitation.email) {
                return Err(forbidden_error(
                    "FORBIDDEN_ROLE: invitation email does not match current user",
                ));
            }
        }

        self.enforce_seat_limit(&invitation.organization_id, false)
            .await?;

        let _member = repo
            .create_member(
                &invitation.organization_id,
                user_id,
                &invitation.role,
                &invitation.created_by_user_id,
            )
            .await
            .map_err(|e| anyhow_error(&format!("Failed to accept invitation: {}", e)))?;

        let _updated_invitation = repo
            .update_invitation_status(&invitation.id, "accepted")
            .await
            .map_err(|e| anyhow_error(&format!("Failed to update invitation status: {}", e)))?;

        let organization = repo
            .get_by_id(&invitation.organization_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch organization: {}", e)))?
            .ok_or_else(|| not_found("organization not found"))?;
        let membership = repo
            .find_member(&invitation.organization_id, user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch membership: {}", e)))?
            .ok_or_else(|| not_found("membership not found"))?;

        self.build_current_org_response(&invitation.organization_id, organization, membership)
            .await
    }

    pub async fn update_member(
        &self,
        user_id: &str,
        member_id: &str,
        body: UpdateMemberRequest,
    ) -> Result<OrganizationMember, AppError> {
        let (organization, membership) = self.resolve_current_org_context(user_id).await?;
        if !can_manage_members(&membership.role) {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for member update",
            ));
        }

        if body.role.is_none() && body.status.is_none() {
            return Err(client_error("no member update fields provided"));
        }
        if let Some(role) = body.role.as_deref() {
            if !is_assignable_role(role) && role != "owner" {
                return Err(client_error("invalid member role"));
            }
        }
        if let Some(status) = body.status.as_deref() {
            if !is_member_status(status) {
                return Err(client_error("invalid member status"));
            }
        }

        let repo = OrganizationRepository::new(self.pool.clone());
        let target = repo
            .find_member_by_id(&organization.id, member_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch target member: {}", e)))?
            .ok_or_else(|| not_found("member not found"))?;

        enforce_role_transition_policy(&membership, &target, body.role.as_deref())?;

        if let Some(next_status) = body.status.as_deref() {
            let is_activation = target.status != "active" && next_status == "active";
            if is_activation {
                self.enforce_seat_limit(&organization.id, false).await?;
            }
        }

        repo.update_member(
            &organization.id,
            member_id,
            body.role.as_deref(),
            body.status.as_deref(),
        )
        .await
        .map_err(|e| anyhow_error(&format!("Failed to update member: {}", e)))?
        .ok_or_else(|| not_found("member not found"))
    }

    pub async fn delete_member(&self, user_id: &str, member_id: &str) -> Result<(), AppError> {
        let (organization, membership) = self.resolve_current_org_context(user_id).await?;
        if !can_manage_members(&membership.role) {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for member delete",
            ));
        }

        let repo = OrganizationRepository::new(self.pool.clone());
        let target = repo
            .find_member_by_id(&organization.id, member_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch target member: {}", e)))?
            .ok_or_else(|| not_found("member not found"))?;
        if target.role == "owner" {
            return Err(client_error("cannot delete owner membership"));
        }

        enforce_role_transition_policy(&membership, &target, None)?;

        let deleted = repo
            .delete_member(&organization.id, member_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to delete member: {}", e)))?;
        if !deleted {
            return Err(not_found("member not found"));
        }
        Ok(())
    }

    async fn resolve_current_org_context(
        &self,
        user_id: &str,
    ) -> Result<(Organization, OrganizationMember), AppError> {
        let repo = OrganizationRepository::new(self.pool.clone());
        let memberships = repo
            .list_active_orgs_for_user(user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to load memberships: {}", e)))?;
        let membership = memberships
            .into_iter()
            .next()
            .ok_or_else(|| not_found("organization not found for current user"))?;
        let organization = repo
            .get_by_id(&membership.organization_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch organization: {}", e)))?
            .ok_or_else(|| not_found("organization not found"))?;
        Ok((organization, membership))
    }

    async fn build_current_org_response(
        &self,
        org_id: &str,
        organization: Organization,
        membership: OrganizationMember,
    ) -> Result<CurrentOrganizationResponse, AppError> {
        let repo = OrganizationRepository::new(self.pool.clone());
        let seat_limit = repo
            .get_active_seat_limit(org_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch seat limit: {}", e)))?;
        let active_member_count = repo
            .count_active_members(org_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to count active members: {}", e)))?;
        let pending_invitation_count = repo
            .count_pending_invitations(org_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to count pending invitations: {}", e)))?;

        Ok(CurrentOrganizationResponse {
            organization,
            membership,
            seat_limit,
            active_member_count,
            pending_invitation_count,
        })
    }

    async fn enforce_seat_limit(
        &self,
        org_id: &str,
        include_pending_invitations: bool,
    ) -> Result<(), AppError> {
        let repo = OrganizationRepository::new(self.pool.clone());
        let Some(limit) = repo
            .get_active_seat_limit(org_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch seat limit: {}", e)))?
        else {
            return Ok(());
        };

        if limit <= 0 {
            return Err(client_error(
                "SEAT_LIMIT_REACHED: team subscription has no seats configured",
            ));
        }

        let active = repo
            .count_active_members(org_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to count active members: {}", e)))?;
        let pending = if include_pending_invitations {
            repo.count_pending_invitations(org_id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to count pending invitations: {}", e)))?
        } else {
            0
        };
        if active + pending >= i64::from(limit) {
            return Err(client_error(
                "SEAT_LIMIT_REACHED: active seats are at the subscription limit",
            ));
        }
        Ok(())
    }
}

fn can_manage_organization(role: &str) -> bool {
    matches!(role, "owner" | "admin")
}

fn can_manage_members(role: &str) -> bool {
    matches!(role, "owner" | "admin" | "manager")
}

fn is_assignable_role(role: &str) -> bool {
    matches!(role, "admin" | "manager" | "member" | "reviewer")
}

fn is_member_status(status: &str) -> bool {
    matches!(status, "active" | "deactivated" | "invited")
}

fn enforce_role_transition_policy(
    actor: &OrganizationMember,
    target: &OrganizationMember,
    requested_role: Option<&str>,
) -> Result<(), AppError> {
    if actor.role == "manager" && matches!(target.role.as_str(), "owner" | "admin") {
        return Err(forbidden_error(
            "FORBIDDEN_ROLE: managers cannot manage owner/admin memberships",
        ));
    }
    if actor.role == "admin" && target.role == "owner" {
        return Err(forbidden_error(
            "FORBIDDEN_ROLE: admins cannot modify owner memberships",
        ));
    }
    if let Some(role) = requested_role {
        if actor.role == "manager" && matches!(role, "owner" | "admin") {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: managers cannot assign owner/admin roles",
            ));
        }
        if actor.role == "admin" && role == "owner" {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: admins cannot assign owner role",
            ));
        }
    }
    Ok(())
}

fn not_found(message: &str) -> AppError {
    AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!(message.to_string()))
}
