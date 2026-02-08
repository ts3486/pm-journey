use sqlx::PgPool;

use crate::error::AppError;

use super::repository::UserRepository;

#[derive(Clone)]
#[allow(dead_code)]
pub struct UserService {
    pool: PgPool,
}

#[allow(dead_code)]
impl UserService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Upsert a user (create or update)
    pub async fn upsert_user(
        &self,
        id: &str,
        email: Option<&str>,
        name: Option<&str>,
        picture: Option<&str>,
    ) -> Result<(), AppError> {
        let repo = UserRepository::new(self.pool.clone());
        repo.upsert(id, email, name, picture)
            .await
            .map_err(AppError::from)
    }
}
