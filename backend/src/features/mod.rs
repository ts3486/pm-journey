pub mod comments;
pub mod evaluations;
pub mod health;
pub mod imports;
pub mod messages;
pub mod scenarios;
pub mod sessions;
pub mod test_cases;

use sqlx::PgPool;

#[derive(Clone)]
pub struct Services {
    pool: PgPool,
}

impl Services {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
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

    pub fn evaluations(&self) -> evaluations::services::EvaluationService {
        evaluations::services::EvaluationService::new(self.pool.clone())
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
}
