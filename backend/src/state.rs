use std::sync::Arc;

use sqlx::PgPool;

use crate::features::Services;
use crate::middleware::auth::JwksKeys;

pub struct AppState {
    services: Services,
    jwks: Arc<JwksKeys>,
}

pub type SharedState = Arc<AppState>;

impl AppState {
    pub fn services(&self) -> &Services {
        &self.services
    }

    pub fn jwks(&self) -> &JwksKeys {
        &self.jwks
    }
}

pub fn state_with_pool(pool: PgPool, jwks: JwksKeys) -> SharedState {
    Arc::new(AppState {
        services: Services::new(pool),
        jwks: Arc::new(jwks),
    })
}
