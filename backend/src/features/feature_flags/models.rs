use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct FeatureFlags {
    pub billing_enabled: bool,
    pub team_features_enabled: bool,
    pub entitlement_enforcement_enabled: bool,
    pub team_dashboard_enabled: bool,
}
