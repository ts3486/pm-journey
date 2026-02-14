use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
pub enum PlanCode {
    #[serde(rename = "FREE")]
    Free,
    #[serde(rename = "TEAM")]
    Team,
}

impl PlanCode {
    pub fn as_str(&self) -> &str {
        match self {
            PlanCode::Free => "FREE",
            PlanCode::Team => "TEAM",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "FREE" => Some(PlanCode::Free),
            // Backward compatibility for historical rows before Individual removal.
            "INDIVIDUAL" => Some(PlanCode::Free),
            "TEAM" => Some(PlanCode::Team),
            _ => None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Entitlement {
    pub id: String,
    pub scope_type: String,
    pub scope_id: String,
    pub plan_code: PlanCode,
    pub status: String,
    pub valid_from: String,
    pub valid_until: Option<String>,
    pub source_subscription_id: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone)]
pub struct EffectivePlan {
    pub plan_code: PlanCode,
    pub source_entitlement_id: String,
    pub organization_id: Option<String>,
}

pub enum ScenarioAccess {
    FreeOnly,
    All,
}

#[allow(dead_code)]
pub struct PlanLimits {
    pub monthly_credits: i32,
    pub max_daily_credits: Option<i32>,
    pub scenario_access: ScenarioAccess,
    pub history_retention_days: Option<i32>,
    pub team_features: bool,
}

// Response type for GET /me/entitlements
#[derive(Debug, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct EntitlementResponse {
    pub plan_code: PlanCode,
    pub monthly_credits: i32,
    pub max_daily_credits: Option<i32>,
    pub team_features: bool,
    pub organization_id: Option<String>,
}
