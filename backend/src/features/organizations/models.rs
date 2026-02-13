use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Organization {
    pub id: String,
    pub name: String,
    #[serde(alias = "created_by_user_id")]
    pub created_by_user_id: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationMember {
    pub id: String,
    #[serde(alias = "organization_id")]
    pub organization_id: String,
    #[serde(alias = "user_id")]
    pub user_id: String,
    pub role: String,
    pub status: String,
    #[serde(alias = "invited_by_user_id")]
    pub invited_by_user_id: Option<String>,
    #[serde(alias = "joined_at")]
    pub joined_at: Option<String>,
    #[serde(alias = "created_at")]
    pub created_at: String,
    #[serde(alias = "updated_at")]
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationInvitation {
    pub id: String,
    #[serde(alias = "organization_id")]
    pub organization_id: String,
    pub email: String,
    pub role: String,
    #[serde(alias = "invite_token_hash")]
    pub invite_token_hash: String,
    #[serde(alias = "expires_at")]
    pub expires_at: String,
    pub status: String,
    #[serde(alias = "created_by_user_id")]
    pub created_by_user_id: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateOrganizationRequest {
    pub name: String,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateOrganizationRequest {
    pub name: String,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateInvitationRequest {
    pub email: String,
    pub role: String,
}

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMemberRequest {
    pub role: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CurrentOrganizationResponse {
    pub organization: Organization,
    pub membership: OrganizationMember,
    pub seat_limit: Option<i32>,
    pub active_member_count: i64,
    pub pending_invitation_count: i64,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct OrganizationMembersResponse {
    pub members: Vec<OrganizationMember>,
    pub seat_limit: Option<i32>,
    pub active_member_count: i64,
    pub pending_invitation_count: i64,
}

#[derive(Debug, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct InvitationResponse {
    pub invitation: OrganizationInvitation,
    pub invite_token: String,
}
