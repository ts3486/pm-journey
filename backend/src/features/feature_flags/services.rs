use super::models::FeatureFlags;

#[derive(Clone)]
pub struct FeatureFlagService;

const TEAM_FEATURES_ENABLED: bool = true;
const ENTITLEMENT_ENFORCEMENT_ENABLED: bool = true;

impl FeatureFlagService {
    pub fn new() -> Self {
        Self
    }

    #[allow(dead_code)]
    pub fn flags(&self) -> FeatureFlags {
        FeatureFlags {
            billing_enabled: env_flag("FF_BILLING_ENABLED"),
            team_features_enabled: TEAM_FEATURES_ENABLED,
            entitlement_enforcement_enabled: ENTITLEMENT_ENFORCEMENT_ENABLED,
            team_dashboard_enabled: env_flag("FF_TEAM_DASHBOARD_ENABLED"),
        }
    }

    pub fn is_entitlement_enforced(&self) -> bool {
        ENTITLEMENT_ENFORCEMENT_ENABLED
    }

    pub fn is_billing_enabled(&self) -> bool {
        env_flag("FF_BILLING_ENABLED")
    }

    #[allow(dead_code)]
    pub fn is_team_features_enabled(&self) -> bool {
        TEAM_FEATURES_ENABLED
    }
}

fn env_flag(key: &str) -> bool {
    std::env::var(key)
        .map(|v| v == "true" || v == "1")
        .unwrap_or(false)
}
