use sqlx::PgPool;

use crate::error::{anyhow_error, forbidden_error, AppError};
use crate::features::sessions::authorization::authorize_session_access;
use crate::models::TestCase;
use crate::shared::helpers::{next_id, now_ts};

use super::models::CreateTestCaseRequest;
use super::repository::TestCaseRepository;

#[derive(Clone)]
pub struct TestCaseService {
    pool: PgPool,
}

impl TestCaseService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn list_test_cases(
        &self,
        session_id: &str,
        user_id: &str,
    ) -> Result<Vec<TestCase>, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_view() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for test case view",
            ));
        }

        let repo = TestCaseRepository::new(self.pool.clone());
        let test_cases = repo
            .list_by_session(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to list test cases: {}", e)))?;
        Ok(test_cases)
    }

    pub async fn create_test_case(
        &self,
        session_id: &str,
        user_id: &str,
        body: CreateTestCaseRequest,
    ) -> Result<TestCase, AppError> {
        let access = authorize_session_access(&self.pool, session_id, user_id).await?;
        if !access.can_edit_session() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for test case create",
            ));
        }

        let repo = TestCaseRepository::new(self.pool.clone());

        let test_case = TestCase {
            id: next_id("tc"),
            session_id: session_id.to_string(),
            name: body.name,
            preconditions: body.preconditions,
            steps: body.steps,
            expected_result: body.expected_result,
            created_at: now_ts(),
        };

        let created = repo
            .create(&test_case)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create test case: {}", e)))?;

        Ok(created)
    }

    pub async fn delete_test_case(&self, id: &str, user_id: &str) -> Result<bool, AppError> {
        let repo = TestCaseRepository::new(self.pool.clone());
        let test_case = match repo
            .get(id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get test case: {}", e)))?
        {
            Some(test_case) => test_case,
            None => return Ok(false),
        };

        let access = authorize_session_access(&self.pool, &test_case.session_id, user_id).await?;
        if !access.can_edit_session() {
            return Err(forbidden_error(
                "FORBIDDEN_ROLE: insufficient permission for test case delete",
            ));
        }

        let deleted = repo
            .delete(id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to delete test case: {}", e)))?;
        Ok(deleted)
    }
}
