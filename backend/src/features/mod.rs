pub mod billing;
pub mod comments;
pub mod credits;
pub mod entitlements;
pub mod evaluations;
pub mod feature_flags;
pub mod health;
pub mod imports;
pub mod messages;
pub mod organizations;
pub mod outputs;
pub mod product_config;
pub mod scenarios;
pub mod sessions;
pub mod test_cases;
pub mod users;

use sqlx::PgPool;

#[derive(Clone)]
pub struct Services {
    pool: PgPool,
}

impl Services {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn billing(&self) -> billing::services::BillingService {
        billing::services::BillingService::new(self.pool.clone())
    }

    pub fn scenarios(&self) -> scenarios::services::ScenarioService {
        scenarios::services::ScenarioService::new(self.pool.clone())
    }

    pub fn sessions(&self) -> sessions::services::SessionService {
        sessions::services::SessionService::new(self.pool.clone())
    }

    pub fn messages(&self) -> messages::services::MessageService {
        messages::services::MessageService::new(self.pool.clone())
    }

    pub fn outputs(&self) -> outputs::services::OutputService {
        outputs::services::OutputService::new(self.pool.clone())
    }

    pub fn organizations(&self) -> organizations::services::OrganizationService {
        organizations::services::OrganizationService::new(self.pool.clone())
    }

    pub fn evaluations(&self) -> evaluations::services::EvaluationService {
        evaluations::services::EvaluationService::new(self.pool.clone())
    }

    pub fn entitlements(&self) -> entitlements::services::EntitlementService {
        entitlements::services::EntitlementService::new(self.pool.clone())
    }

    pub fn credits(&self) -> credits::services::CreditService {
        credits::services::CreditService::new(self.pool.clone())
    }

    pub fn comments(&self) -> comments::services::CommentService {
        comments::services::CommentService::new(self.pool.clone())
    }

    pub fn imports(&self) -> imports::services::ImportService {
        imports::services::ImportService::new(self.pool.clone())
    }

    pub fn test_cases(&self) -> test_cases::services::TestCaseService {
        test_cases::services::TestCaseService::new(self.pool.clone())
    }

    pub fn product_config(&self) -> product_config::services::ProductConfigService {
        product_config::services::ProductConfigService::new(self.pool.clone())
    }

    #[allow(dead_code)]
    pub fn users(&self) -> users::services::UserService {
        users::services::UserService::new(self.pool.clone())
    }

    #[allow(dead_code)]
    pub fn feature_flags(&self) -> feature_flags::services::FeatureFlagService {
        feature_flags::services::FeatureFlagService::new()
    }
}
