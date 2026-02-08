use anyhow::{Context, Result};
use sqlx::PgPool;

/// Repository for user operations
#[derive(Clone)]
#[allow(dead_code)]
pub struct UserRepository {
    pool: PgPool,
}

#[allow(dead_code)]
impl UserRepository {
    /// Create a new repository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Upsert a user (insert or update if exists)
    pub async fn upsert(
        &self,
        id: &str,
        email: Option<&str>,
        name: Option<&str>,
        picture: Option<&str>,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO users (id, email, name, picture)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                picture = EXCLUDED.picture,
                updated_at = NOW()
            "#,
        )
        .bind(id)
        .bind(email)
        .bind(name)
        .bind(picture)
        .execute(&self.pool)
        .await
        .context("Failed to upsert user")?;

        Ok(())
    }
}
