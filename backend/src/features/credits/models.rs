use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreditWallet {
    pub id: String,
    pub scope_type: String,
    pub scope_id: String,
    pub monthly_credits: i32,
    pub purchased_credits: i32,
    pub monthly_reset_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreditLedgerEntry {
    pub id: String,
    pub wallet_id: String,
    pub direction: String,
    pub amount: i32,
    pub reason: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub occurred_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CreditBalanceResponse {
    pub available: i32,
    pub monthly_remaining: i32,
    pub purchased_remaining: i32,
}
