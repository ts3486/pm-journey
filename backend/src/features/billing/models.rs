use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateTeamCheckoutRequest {
    pub organization_id: String,
    pub seat_quantity: i32,
    pub success_url: Option<String>,
    pub cancel_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TeamCheckoutResponse {
    pub mode: String,
    pub checkout_url: Option<String>,
    pub already_entitled: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateBillingPortalSessionRequest {
    pub return_url: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct BillingPortalSessionResponse {
    pub url: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct StripeWebhookResponse {
    pub received: bool,
    pub duplicate: bool,
    pub event_type: Option<String>,
}
