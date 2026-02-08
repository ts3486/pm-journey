use sqlx::PgPool;

use crate::error::{client_error, AppError};
use crate::models::{default_scenarios, Scenario};
use axum::http::StatusCode;

use super::repository::ScenarioRepository;

#[derive(Clone)]
pub struct ScenarioService {
    pool: PgPool,
}

impl ScenarioService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create_scenario(
        &self,
        user_id: &str,
        scenario: &Scenario,
    ) -> Result<Scenario, AppError> {
        Self::validate_id(scenario)?;
        Self::validate_weights(scenario)?;

        let repo = ScenarioRepository::new(self.pool.clone());

        if repo
            .get_for_user(&scenario.id, user_id)
            .await
            .map_err(AppError::from)?
            .is_some()
        {
            return Err(client_error("このIDのカスタムシナリオは既に存在します"));
        }

        repo.create(scenario, user_id).await.map_err(AppError::from)
    }

    pub async fn list_scenarios(&self, user_id: &str) -> Result<Vec<Scenario>, AppError> {
        let repo = ScenarioRepository::new(self.pool.clone());
        let mut scenarios = default_scenarios();
        let custom = repo.list_for_user(user_id).await.map_err(AppError::from)?;
        scenarios.extend(custom);
        Ok(scenarios)
    }

    pub async fn get_scenario(&self, id: &str, user_id: &str) -> Result<Scenario, AppError> {
        if let Some(scenario) = default_scenarios().into_iter().find(|s| s.id == id) {
            return Ok(scenario);
        }

        let repo = ScenarioRepository::new(self.pool.clone());
        repo.get_for_user(id, user_id)
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| {
                AppError::new(StatusCode::NOT_FOUND, anyhow::anyhow!("scenario not found"))
            })
    }
}

impl ScenarioService {
    fn validate_id(scenario: &Scenario) -> Result<(), AppError> {
        if scenario.id.is_empty() {
            return Err(client_error("IDは必須です"));
        }

        if default_scenarios().iter().any(|s| s.id == scenario.id) {
            return Err(client_error(
                "このIDは組み込みシナリオで既に使用されています",
            ));
        }

        if !scenario
            .id
            .chars()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
        {
            return Err(client_error("IDは小文字英数字とハイフンのみ使用できます"));
        }

        Ok(())
    }

    fn validate_weights(scenario: &Scenario) -> Result<(), AppError> {
        let total_weight: f32 = scenario
            .evaluation_criteria
            .iter()
            .map(|criterion| criterion.weight)
            .sum();

        if (total_weight - 100.0).abs() > 0.01 {
            return Err(client_error(
                "評価基準の重みの合計は100%である必要があります",
            ));
        }

        Ok(())
    }
}
