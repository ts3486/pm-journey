use std::sync::Arc;

use sqlx::PgPool;

use crate::features::Services;

pub struct AppState {
    services: Services,
}

pub type SharedState = Arc<AppState>;

impl AppState {
    pub fn services(&self) -> &Services {
        &self.services
    }
}

pub fn state_with_pool(pool: PgPool) -> SharedState {
    Arc::new(AppState {
        services: Services::new(pool),
    })
}
