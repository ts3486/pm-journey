use sqlx::PgPool;

use crate::error::{anyhow_error, AppError};
use crate::features::feature_flags::services::FeatureFlagService;
use crate::features::organizations::repository::OrganizationRepository;
use crate::models::ScenarioDiscipline;
use crate::shared::admin_override::is_admin_override_user;
use crate::shared::helpers::{next_id, now_ts};

use super::models::{EffectivePlan, EntitlementResponse, PlanCode, PlanLimits, ScenarioAccess};
use super::repository::EntitlementRepository;

const FREE_SCENARIO_IDS: &[&str] = &[
    "basic-intro-alignment",
    "basic-meeting-minutes",
    "basic-schedule-share",
    "test-login",
    "test-form",
    "test-file-upload",
];

fn normalize_plan_for_launch(plan_code: PlanCode, team_features_enabled: bool) -> PlanCode {
    if matches!(plan_code, PlanCode::Team) && !team_features_enabled {
        return PlanCode::Free;
    }

    plan_code
}

fn default_team_plan_for_testing_enabled() -> bool {
    std::env::var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING")
        .ok()
        .and_then(|value| {
            let normalized = value.trim().to_ascii_lowercase();
            match normalized.as_str() {
                "1" | "true" => Some(true),
                "0" | "false" => Some(false),
                _ => None,
            }
        })
        .unwrap_or(cfg!(debug_assertions))
}

fn default_fallback_plan_for_user(team_features_enabled: bool) -> PlanCode {
    if team_features_enabled && default_team_plan_for_testing_enabled() {
        return PlanCode::Team;
    }

    PlanCode::Free
}

#[derive(Clone)]
pub struct EntitlementService {
    pool: PgPool,
}

impl EntitlementService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Resolve the effective plan for a user, considering organization memberships
    pub async fn resolve_effective_plan(&self, user_id: &str) -> Result<EffectivePlan, AppError> {
        let team_features_enabled = FeatureFlagService::new().is_team_features_enabled();

        if is_admin_override_user(user_id) {
            return Ok(EffectivePlan {
                plan_code: PlanCode::Team,
                source_entitlement_id: "admin-override".to_string(),
                organization_id: None,
            });
        }

        let entitlement_repo = EntitlementRepository::new(self.pool.clone());

        // Check for direct user entitlement
        if let Some(entitlement) = entitlement_repo
            .find_active_for_user(user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch user entitlement: {}", e)))?
        {
            return Ok(EffectivePlan {
                plan_code: normalize_plan_for_launch(entitlement.plan_code, team_features_enabled),
                source_entitlement_id: entitlement.id,
                organization_id: None,
            });
        }

        // Next priority: active org membership with active org entitlement.
        let org_repo = OrganizationRepository::new(self.pool.clone());
        let active_memberships = org_repo
            .list_active_orgs_for_user(user_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch active memberships: {}", e)))?;

        for membership in active_memberships {
            if let Some(entitlement) = entitlement_repo
                .find_active_for_org(&membership.organization_id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to fetch org entitlement: {}", e)))?
            {
                let plan_code =
                    normalize_plan_for_launch(entitlement.plan_code, team_features_enabled);
                let organization_id = if matches!(plan_code, PlanCode::Team) {
                    Some(membership.organization_id)
                } else {
                    None
                };

                return Ok(EffectivePlan {
                    plan_code,
                    source_entitlement_id: entitlement.id,
                    organization_id,
                });
            }
        }

        // Fallback: auto-provision a default entitlement for first-time users.
        let default_plan = default_fallback_plan_for_user(team_features_enabled);
        let fallback_entitlement = super::models::Entitlement {
            id: next_id("entitlement"),
            scope_type: "user".to_string(),
            scope_id: user_id.to_string(),
            plan_code: default_plan,
            status: "active".to_string(),
            valid_from: now_ts(),
            valid_until: None,
            source_subscription_id: None,
        };

        let created = entitlement_repo
            .create(&fallback_entitlement)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create fallback entitlement: {}", e)))?;

        Ok(EffectivePlan {
            plan_code: normalize_plan_for_launch(created.plan_code, team_features_enabled),
            source_entitlement_id: created.id,
            organization_id: None,
        })
    }

    /// Check if a user can access a specific scenario based on their plan
    pub fn can_access_scenario(
        plan_code: &PlanCode,
        scenario_id: &str,
        _discipline: Option<&ScenarioDiscipline>,
    ) -> bool {
        match plan_code {
            PlanCode::Free => FREE_SCENARIO_IDS.contains(&scenario_id),
            PlanCode::Team => true,
        }
    }

    /// Get plan limits based on plan code
    pub fn plan_limits(plan_code: &PlanCode) -> PlanLimits {
        match plan_code {
            PlanCode::Free => PlanLimits {
                monthly_credits: 0,
                max_daily_credits: None,
                scenario_access: ScenarioAccess::FreeOnly,
                history_retention_days: Some(30),
                team_features: false,
            },
            PlanCode::Team => PlanLimits {
                monthly_credits: 0,
                max_daily_credits: None,
                scenario_access: ScenarioAccess::All,
                history_retention_days: None,
                team_features: true,
            },
        }
    }

    /// Get entitlements response for a user
    pub async fn get_my_entitlements(
        &self,
        user_id: &str,
    ) -> Result<EntitlementResponse, AppError> {
        let effective_plan = self.resolve_effective_plan(user_id).await?;
        let limits = Self::plan_limits(&effective_plan.plan_code);
        let team_features_enabled = FeatureFlagService::new().is_team_features_enabled();
        let team_features =
            matches!(effective_plan.plan_code, PlanCode::Team) && team_features_enabled;

        Ok(EntitlementResponse {
            plan_code: effective_plan.plan_code,
            monthly_credits: limits.monthly_credits,
            max_daily_credits: limits.max_daily_credits,
            team_features,
            organization_id: effective_plan.organization_id,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::sync::{Mutex, OnceLock};

    use crate::features::entitlements::models::PlanCode;
    use crate::features::entitlements::services::EntitlementService;
    use crate::models::ScenarioDiscipline;

    use super::{default_fallback_plan_for_user, normalize_plan_for_launch};

    fn env_lock() -> &'static Mutex<()> {
        static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
        LOCK.get_or_init(|| Mutex::new(()))
    }

    #[test]
    fn team_can_access_all_scenarios() {
        assert!(EntitlementService::can_access_scenario(
            &PlanCode::Team,
            "challenge-critical-tradeoff",
            Some(&ScenarioDiscipline::Challenge)
        ));
    }

    #[test]
    fn free_plan_remains_allowlist_only() {
        assert!(EntitlementService::can_access_scenario(
            &PlanCode::Free,
            "basic-intro-alignment",
            Some(&ScenarioDiscipline::Basic)
        ));
        assert!(!EntitlementService::can_access_scenario(
            &PlanCode::Free,
            "challenge-critical-tradeoff",
            Some(&ScenarioDiscipline::Challenge)
        ));
    }

    #[test]
    fn team_plan_downgrades_when_team_features_disabled() {
        assert_eq!(
            normalize_plan_for_launch(PlanCode::Team, false),
            PlanCode::Free
        );
    }

    #[test]
    fn team_plan_preserved_when_team_features_enabled() {
        assert_eq!(
            normalize_plan_for_launch(PlanCode::Team, true),
            PlanCode::Team
        );
    }

    #[test]
    fn fallback_default_is_team_when_testing_flag_enabled() {
        let _guard = env_lock().lock().expect("fallback env lock");
        let original = std::env::var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING").ok();
        unsafe {
            std::env::set_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING", "true");
        }

        assert_eq!(default_fallback_plan_for_user(true), PlanCode::Team);
        assert_eq!(default_fallback_plan_for_user(false), PlanCode::Free);

        unsafe {
            if let Some(value) = original {
                std::env::set_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING", value);
            } else {
                std::env::remove_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING");
            }
        }
    }

    #[test]
    fn fallback_default_is_free_when_testing_flag_disabled() {
        let _guard = env_lock().lock().expect("fallback env lock");
        let original = std::env::var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING").ok();
        unsafe {
            std::env::set_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING", "false");
        }

        assert_eq!(default_fallback_plan_for_user(true), PlanCode::Free);
        assert_eq!(default_fallback_plan_for_user(false), PlanCode::Free);

        unsafe {
            if let Some(value) = original {
                std::env::set_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING", value);
            } else {
                std::env::remove_var("FF_DEFAULT_TEAM_PLAN_FOR_TESTING");
            }
        }
    }
}
