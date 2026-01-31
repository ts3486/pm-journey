use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};

use crate::error::AppError;
use crate::state::SharedState;

use super::models::{CreateTestCaseRequest, TestCaseResponse};

#[utoipa::path(
    get,
    path = "/sessions/{id}/test-cases",
    responses((status = 200, body = [TestCaseResponse]))
)]
pub async fn list_test_cases(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<Vec<TestCaseResponse>>, AppError> {
    let test_cases = state.services().test_cases().list_test_cases(&id).await?;
    let responses: Vec<TestCaseResponse> = test_cases.into_iter().map(Into::into).collect();
    Ok(Json(responses))
}

#[utoipa::path(
    post,
    path = "/sessions/{id}/test-cases",
    request_body = CreateTestCaseRequest,
    responses((status = 201, body = TestCaseResponse))
)]
pub async fn create_test_case(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<CreateTestCaseRequest>,
) -> Result<(StatusCode, Json<TestCaseResponse>), AppError> {
    let created = state
        .services()
        .test_cases()
        .create_test_case(&id, body)
        .await?;
    Ok((StatusCode::CREATED, Json(created.into())))
}

#[utoipa::path(
    delete,
    path = "/test-cases/{id}",
    responses((status = 204))
)]
pub async fn delete_test_case(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<StatusCode, AppError> {
    let deleted = state.services().test_cases().delete_test_case(&id).await?;
    if deleted {
        Ok(StatusCode::NO_CONTENT)
    } else {
        Ok(StatusCode::NOT_FOUND)
    }
}
