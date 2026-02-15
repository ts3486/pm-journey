use axum::{body::Bytes, extract::State, http::HeaderMap, Json};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::{
    BillingPortalSessionResponse, CreateBillingPortalSessionRequest, CreateTeamCheckoutRequest,
    StripeWebhookResponse, TeamCheckoutResponse,
};

#[utoipa::path(
    post,
    path = "/billing/checkout/team",
    request_body = CreateTeamCheckoutRequest,
    responses((status = 200, body = TeamCheckoutResponse))
)]
pub async fn checkout_team(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<CreateTeamCheckoutRequest>,
) -> Result<Json<TeamCheckoutResponse>, AppError> {
    let response = state
        .services()
        .billing()
        .create_team_checkout(&auth.user_id, body)
        .await?;
    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/billing/portal/session",
    request_body = CreateBillingPortalSessionRequest,
    responses((status = 200, body = BillingPortalSessionResponse))
)]
pub async fn create_portal_session(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(body): Json<CreateBillingPortalSessionRequest>,
) -> Result<Json<BillingPortalSessionResponse>, AppError> {
    let response = state
        .services()
        .billing()
        .create_billing_portal_session(&auth.user_id, body)
        .await?;
    Ok(Json(response))
}

#[utoipa::path(
    post,
    path = "/billing/webhook/stripe",
    responses((status = 200, body = StripeWebhookResponse))
)]
pub async fn stripe_webhook(
    State(state): State<SharedState>,
    headers: HeaderMap,
    payload: Bytes,
) -> Result<Json<StripeWebhookResponse>, AppError> {
    let signature = headers
        .get("stripe-signature")
        .and_then(|value| value.to_str().ok());
    let response = state
        .services()
        .billing()
        .handle_stripe_webhook(signature, &payload)
        .await?;
    Ok(Json(response))
}
