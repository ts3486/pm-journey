use crate::models::TestCase;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{PgPool, Row};

#[derive(Clone)]
pub struct TestCaseRepository {
    pool: PgPool,
}

impl TestCaseRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, test_case: &TestCase) -> Result<TestCase> {
        let created_at: DateTime<Utc> = test_case
            .created_at
            .parse()
            .context("Failed to parse created_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO test_cases (
                id, session_id, name, preconditions, steps, expected_result, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&test_case.id)
        .bind(&test_case.session_id)
        .bind(&test_case.name)
        .bind(&test_case.preconditions)
        .bind(&test_case.steps)
        .bind(&test_case.expected_result)
        .bind(created_at)
        .execute(&self.pool)
        .await
        .context("Failed to insert test case")?;

        self.get(&test_case.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created test case"))
    }

    pub async fn get(&self, id: &str) -> Result<Option<TestCase>> {
        let row = sqlx::query(
            r#"
            SELECT
                id, session_id, name, preconditions, steps, expected_result,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM test_cases
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch test case")?;

        Ok(row.map(|r| {
            let created_at = r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default();

            TestCase {
                id: r.get("id"),
                session_id: r.get("session_id"),
                name: r.get("name"),
                preconditions: r.get("preconditions"),
                steps: r.get("steps"),
                expected_result: r.get("expected_result"),
                created_at,
            }
        }))
    }

    pub async fn list_by_session(&self, session_id: &str) -> Result<Vec<TestCase>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, session_id, name, preconditions, steps, expected_result,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
            FROM test_cases
            WHERE session_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list test cases")?;

        Ok(rows
            .into_iter()
            .map(|r| {
                let created_at = r
                    .try_get::<Option<String>, _>("created_at")
                    .unwrap_or(None)
                    .unwrap_or_default();

                TestCase {
                    id: r.get("id"),
                    session_id: r.get("session_id"),
                    name: r.get("name"),
                    preconditions: r.get("preconditions"),
                    steps: r.get("steps"),
                    expected_result: r.get("expected_result"),
                    created_at,
                }
            })
            .collect())
    }

    pub async fn delete_for_user(&self, id: &str, user_id: &str) -> Result<bool> {
        let result = sqlx::query(
            r#"
            DELETE FROM test_cases tc
            USING sessions s
            WHERE tc.id = $1
              AND tc.session_id = s.id
              AND s.user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .context("Failed to delete test case")?;

        Ok(result.rows_affected() > 0)
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM test_cases WHERE session_id = $1")
            .bind(session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete test cases")?;

        Ok(())
    }
}
