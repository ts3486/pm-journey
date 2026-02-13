use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{
    CreateInvitationRequest, CreateOrganizationRequest, CurrentOrganizationResponse,
    InvitationResponse, Organization, OrganizationMember, OrganizationMembersResponse,
    UpdateMemberRequest, UpdateOrganizationRequest,
};

#[utoipa::path(
    post,
    path = "/organizations",
    request_body = CreateOrganizationRequest,
    responses((status = 201, body = Organization))
)]
pub async fn create_organization(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<CreateOrganizationRequest>,
) -> Result<(StatusCode, Json<Organization>), AppError> {
    let organization = state
        .services()
        .organizations()
        .create_organization(&auth.user_id, body)
        .await?;
    Ok((StatusCode::CREATED, Json(organization)))
}

#[utoipa::path(
    get,
    path = "/organizations/current",
    responses((status = 200, body = CurrentOrganizationResponse))
)]
pub async fn get_current_organization(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<CurrentOrganizationResponse>, AppError> {
    let current = state
        .services()
        .organizations()
        .get_current_organization(&auth.user_id)
        .await?;
    Ok(Json(current))
}

#[utoipa::path(
    patch,
    path = "/organizations/current",
    request_body = UpdateOrganizationRequest,
    responses((status = 200, body = Organization))
)]
pub async fn update_current_organization(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<UpdateOrganizationRequest>,
) -> Result<Json<Organization>, AppError> {
    let organization = state
        .services()
        .organizations()
        .update_current_organization(&auth.user_id, body)
        .await?;
    Ok(Json(organization))
}

#[utoipa::path(
    get,
    path = "/organizations/current/members",
    responses((status = 200, body = OrganizationMembersResponse))
)]
pub async fn list_current_members(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<OrganizationMembersResponse>, AppError> {
    let members = state
        .services()
        .organizations()
        .list_current_members(&auth.user_id)
        .await?;
    Ok(Json(members))
}

#[utoipa::path(
    post,
    path = "/organizations/current/invitations",
    request_body = CreateInvitationRequest,
    responses((status = 201, body = InvitationResponse))
)]
pub async fn create_invitation(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<CreateInvitationRequest>,
) -> Result<(StatusCode, Json<InvitationResponse>), AppError> {
    let response = state
        .services()
        .organizations()
        .create_invitation(&auth.user_id, body)
        .await?;
    Ok((StatusCode::CREATED, Json(response)))
}

#[utoipa::path(
    post,
    path = "/organizations/current/invitations/{token}/accept",
    responses((status = 200, body = CurrentOrganizationResponse))
)]
pub async fn accept_invitation(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(token): Path<String>,
) -> Result<Json<CurrentOrganizationResponse>, AppError> {
    let response = state
        .services()
        .organizations()
        .accept_invitation(&auth.user_id, auth.email.as_deref(), &token)
        .await?;
    Ok(Json(response))
}

#[utoipa::path(
    patch,
    path = "/organizations/current/members/{memberId}",
    request_body = UpdateMemberRequest,
    responses((status = 200, body = OrganizationMember))
)]
pub async fn update_member(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(member_id): Path<String>,
    Json(body): Json<UpdateMemberRequest>,
) -> Result<Json<OrganizationMember>, AppError> {
    let member = state
        .services()
        .organizations()
        .update_member(&auth.user_id, &member_id, body)
        .await?;
    Ok(Json(member))
}

#[utoipa::path(
    delete,
    path = "/organizations/current/members/{memberId}",
    responses((status = 204))
)]
pub async fn delete_member(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(member_id): Path<String>,
) -> Result<StatusCode, AppError> {
    state
        .services()
        .organizations()
        .delete_member(&auth.user_id, &member_id)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}
