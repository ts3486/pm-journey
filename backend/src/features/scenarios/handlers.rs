use axum::{
    extract::{Path, State},
    Json,
};

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::state::SharedState;

use super::models::Scenario;

#[utoipa::path(
    get,
    path = "/scenarios",
    responses((status = 200, body = [Scenario]))
)]
pub async fn list_scenarios(
    State(state): State<SharedState>,
    auth: AuthUser,
) -> Result<Json<Vec<Scenario>>, AppError> {
    let scenarios = state
        .services()
        .scenarios()
        .list_scenarios(&auth.user_id)
        .await?;
    Ok(Json(scenarios))
}

#[utoipa::path(
    post,
    path = "/scenarios",
    request_body = Scenario,
    responses((status = 201, body = Scenario))
)]
pub async fn create_scenario(
    State(state): State<SharedState>,
    auth: AuthUser,
    Json(scenario): Json<Scenario>,
) -> Result<Json<Scenario>, AppError> {
    let scenario = state
        .services()
        .scenarios()
        .create_scenario(&auth.user_id, &scenario)
        .await?;
    Ok(Json(scenario))
}

#[utoipa::path(
    get,
    path = "/scenarios/{id}",
    responses((status = 200, body = Scenario))
)]
pub async fn get_scenario(
    State(state): State<SharedState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Scenario>, AppError> {
    let scenario = state
        .services()
        .scenarios()
        .get_scenario(&id, &auth.user_id)
        .await?;
    Ok(Json(scenario))
}
