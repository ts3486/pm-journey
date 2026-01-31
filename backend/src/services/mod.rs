pub mod comments;
pub mod evaluations;
pub mod helpers;
pub mod imports;
pub mod messages;
pub mod scenarios;
pub mod sessions;

use sqlx::PgPool;

#[derive(Clone)]
pub struct Services {
    pool: PgPool,
}

impl Services {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn scenarios(&self) -> scenarios::ScenarioService {
        scenarios::ScenarioService::new(self.pool.clone())
    }

    pub fn sessions(&self) -> sessions::SessionService {
        sessions::SessionService::new(self.pool.clone())
    }

    pub fn messages(&self) -> messages::MessageService {
        messages::MessageService::new(self.pool.clone())
    }

    pub fn evaluations(&self) -> evaluations::EvaluationService {
        evaluations::EvaluationService::new(self.pool.clone())
    }

    pub fn comments(&self) -> comments::CommentService {
        comments::CommentService::new(self.pool.clone())
    }

    pub fn imports(&self) -> imports::ImportService {
        imports::ImportService::new(self.pool.clone())
    }
}
