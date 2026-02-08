use crate::models::ManagerComment;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Postgres, Transaction};

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

        sqlx::query!(
            r#"
            INSERT INTO comments (
                id, session_id, author_name, content, created_at
            )
            VALUES ($1, $2, $3, $4, $5)
            "#,
            comment.id,
            comment.session_id,
            comment.author_name,
            comment.content,
            created_at,
        )
        .execute(&mut **tx)
        .await
        .context("Failed to insert comment")?;

        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<Option<ManagerComment>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, session_id, author_name, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM comments
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch comment")?;

        Ok(row.map(|r| ManagerComment {
            id: r.id,
            session_id: r.session_id,
            author_name: r.author_name,
            content: r.content,
            created_at: r.created_at.unwrap_or_default(),
        }))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<ManagerComment>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, session_id, author_name, content,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM comments
            WHERE session_id = $1
            ORDER BY created_at ASC
            "#,
            session_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list comments")?;

        Ok(rows
            .into_iter()
            .map(|r| ManagerComment {
                id: r.id,
                session_id: r.session_id,
                author_name: r.author_name,
                content: r.content,
                created_at: r.created_at.unwrap_or_default(),
            })
            .collect())
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query!("DELETE FROM comments WHERE session_id = $1", session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete comments")?;

        Ok(())
    }
}
