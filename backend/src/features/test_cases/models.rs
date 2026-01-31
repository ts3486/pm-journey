use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub use crate::models::TestCase;

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateTestCaseRequest {
    pub name: String,
    pub preconditions: String,
    pub steps: String,
    pub expected_result: String,
}

#[derive(Serialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct TestCaseResponse {
    pub id: String,
    pub session_id: String,
    pub name: String,
    pub preconditions: String,
    pub steps: String,
    pub expected_result: String,
    pub created_at: String,
}

impl From<TestCase> for TestCaseResponse {
    fn from(tc: TestCase) -> Self {
        Self {
            id: tc.id,
            session_id: tc.session_id,
            name: tc.name,
            preconditions: tc.preconditions,
            steps: tc.steps,
            expected_result: tc.expected_result,
            created_at: tc.created_at,
        }
    }
}
