use crate::models::ManagerComment;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{postgres::PgRow, PgPool, Postgres, Row, Transaction};

#[derive(Clone)]
pub struct CommentRepository {
    pool: PgPool,
}

impl CommentRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, comment: &ManagerComment) -> Result<ManagerComment> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, comment).await?;
        tx.commit().await?;

        self.get(&comment.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created comment"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        comment: &ManagerComment,
    ) -> Result<()> {
        let created_at: DateTime<Utc> = comment
            .created_at
            .parse()
            .context("Failed to parse created_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO comments (
                id, session_id, author_name, author_user_id, author_role, content, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&comment.id)
        .bind(&comment.session_id)
        .bind(&comment.author_name)
        .bind(&comment.author_user_id)
        .bind(&comment.author_role)
        .bind(&comment.content)
        .bind(created_at)
        .execute(&mut **tx)
        .await
        .context("Failed to insert comment")?;

        Ok(())
    }

    fn map_row(r: PgRow) -> ManagerComment {
        ManagerComment {
            id: r.get("id"),
            session_id: r.get("session_id"),
            author_name: r
                .try_get::<Option<String>, _>("author_name")
                .unwrap_or(None),
            author_user_id: r
                .try_get::<Option<String>, _>("author_user_id")
                .unwrap_or(None),
            author_role: r
                .try_get::<Option<String>, _>("author_role")
                .unwrap_or(None),
            content: r.get("content"),
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default(),
        }
    }

    pub async fn get(&self, id: &str) -> Result<Option<ManagerComment>> {
        let row = sqlx::query(
            r#"
            SELECT
                id, session_id, author_name, author_user_id, author_role, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM comments
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch comment")?;

        Ok(row.map(Self::map_row))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<ManagerComment>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, session_id, author_name, author_user_id, author_role, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM comments
            WHERE session_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list comments")?;

        Ok(rows.into_iter().map(Self::map_row).collect())
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM comments WHERE session_id = $1")
            .bind(session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete comments")?;

        Ok(())
    }
}
