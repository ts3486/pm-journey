use sqlx::PgPool;
use crate::models::TestCase;
use anyhow::{Result, Context};
use chrono::{DateTime, Utc};

#[derive(Clone)]
pub struct TestCaseRepository {
    pool: PgPool,
}

impl TestCaseRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, test_case: &TestCase) -> Result<TestCase> {
        let created_at: DateTime<Utc> = test_case.created_at.parse()
            .context("Failed to parse created_at timestamp")?;

        sqlx::query!(
            r#"
            INSERT INTO test_cases (
                id, session_id, name, preconditions, steps, expected_result, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            test_case.id,
            test_case.session_id,
            test_case.name,
            test_case.preconditions,
            test_case.steps,
            test_case.expected_result,
            created_at,
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert test case")?;

        self.get(&test_case.id).await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created test case"))
    }

    pub async fn get(&self, id: &str) -> Result<Option<TestCase>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, session_id, name, preconditions, steps, expected_result,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM test_cases
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch test case")?;

        Ok(row.map(|r| TestCase {
            id: r.id,
            session_id: r.session_id,
            name: r.name,
            preconditions: r.preconditions,
            steps: r.steps,
            expected_result: r.expected_result,
            created_at: r.created_at.unwrap_or_default(),
        }))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<TestCase>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, session_id, name, preconditions, steps, expected_result,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM test_cases
            WHERE session_id = $1
            ORDER BY created_at ASC
            "#,
            session_id
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list test cases")?;

        Ok(rows.into_iter().map(|r| TestCase {
            id: r.id,
            session_id: r.session_id,
            name: r.name,
            preconditions: r.preconditions,
            steps: r.steps,
            expected_result: r.expected_result,
            created_at: r.created_at.unwrap_or_default(),
        }).collect())
    }

    pub async fn delete(&self, id: &str) -> Result<bool> {
        let result = sqlx::query!("DELETE FROM test_cases WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .context("Failed to delete test case")?;

        Ok(result.rows_affected() > 0)
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query!("DELETE FROM test_cases WHERE session_id = $1", session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete test cases")?;

        Ok(())
    }
}
