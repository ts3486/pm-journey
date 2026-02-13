use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{postgres::PgRow, PgPool, Row};

use crate::models::{Output, OutputKind};

#[derive(Clone)]
pub struct OutputRepository {
    pool: PgPool,
}

impl OutputRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn map_row(r: PgRow) -> Option<Output> {
        let kind = OutputKind::from_str(&r.try_get::<String, _>("kind").ok()?)?;

        Some(Output {
            id: r.try_get("id").ok()?,
            session_id: r.try_get("session_id").ok()?,
            kind,
            value: r.try_get("value").ok()?,
            note: r.try_get::<Option<String>, _>("note").ok().flatten(),
            created_by_user_id: r.try_get("created_by_user_id").ok()?,
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .ok()
                .flatten()
                .unwrap_or_default(),
        })
    }

    pub async fn create(&self, output: &Output) -> Result<Output> {
        let created_at: DateTime<Utc> = output
            .created_at
            .parse()
            .context("Failed to parse created_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO outputs (
                id, session_id, kind, value, note, created_by_user_id, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&output.id)
        .bind(&output.session_id)
        .bind(output.kind.as_str())
        .bind(&output.value)
        .bind(&output.note)
        .bind(&output.created_by_user_id)
        .bind(created_at)
        .execute(&self.pool)
        .await
        .context("Failed to insert output")?;

        self.get(&output.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created output"))
    }

    pub async fn get(&self, id: &str) -> Result<Option<Output>> {
        let row = sqlx::query(
            r#"
            SELECT
                id, session_id, kind, value, note, created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM outputs
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch output")?;

        Ok(row.and_then(Self::map_row))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<Output>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, session_id, kind, value, note, created_by_user_id,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM outputs
            WHERE session_id = $1
            ORDER BY created_at DESC
            "#,
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list outputs")?;

        Ok(rows.into_iter().filter_map(Self::map_row).collect())
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM outputs WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete output")?;

        Ok(result.rows_affected() > 0)
    }
}
