use crate::models::{
    Mission, ProductInfo, RatingCriterion, Scenario, ScenarioBehavior, ScenarioDiscipline,
};
use anyhow::{Context, Result};
use sqlx::{PgPool, Row};

/// Repository for custom scenarios CRUD operations
#[allow(dead_code)]
#[derive(Clone)]
pub struct ScenarioRepository {
    pool: PgPool,
}

#[allow(dead_code)]
impl ScenarioRepository {
    /// Create a new repository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Create a new custom scenario for the authenticated user.
    pub async fn create(&self, scenario: &Scenario, user_id: &str) -> Result<Scenario> {
        let discipline = match scenario.discipline {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        };

        let behavior = serde_json::to_value(&scenario.behavior)?;
        let product = serde_json::to_value(&scenario.product)?;
        let evaluation_criteria = serde_json::to_value(&scenario.evaluation_criteria)?;
        let missions = serde_json::to_value(&scenario.missions)?;

        sqlx::query(
            r#"
            INSERT INTO custom_scenarios (
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions, user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            "#,
        )
        .bind(&scenario.id)
        .bind(&scenario.title)
        .bind(&scenario.description)
        .bind(discipline)
        .bind(&scenario.mode)
        .bind(&scenario.kickoff_prompt)
        .bind(scenario.passing_score)
        .bind(&scenario.supplemental_info)
        .bind(behavior)
        .bind(product)
        .bind(evaluation_criteria)
        .bind(missions)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .context("Failed to insert scenario")?;

        self.get_for_user(&scenario.id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created scenario"))
    }

    fn map_row(r: sqlx::postgres::PgRow) -> Scenario {
        let discipline = match r.get::<String, _>("discipline").as_str() {
            "CHALLENGE" => ScenarioDiscipline::Challenge,
            _ => ScenarioDiscipline::Basic,
        };

        let behavior: ScenarioBehavior = r
            .try_get::<Option<serde_json::Value>, _>("behavior")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let product: ProductInfo = r
            .try_get::<serde_json::Value, _>("product")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or(ProductInfo {
                name: String::new(),
                summary: String::new(),
                audience: String::new(),
                problems: vec![],
                goals: vec![],
                differentiators: vec![],
                scope: vec![],
                constraints: vec![],
                timeline: String::new(),
                success_criteria: vec![],
                unique_edge: None,
                tech_stack: None,
                core_features: None,
            });
        let evaluation_criteria: Vec<RatingCriterion> = r
            .try_get::<serde_json::Value, _>("evaluation_criteria")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let missions: Option<Vec<Mission>> = r
            .try_get::<Option<serde_json::Value>, _>("missions")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok());

        Scenario {
            id: r.get("id"),
            title: r.get("title"),
            description: r.get("description"),
            discipline,
            scenario_type: None,
            feature_mockup: None,
            product,
            mode: r.get("mode"),
            behavior,
            kickoff_prompt: r.get("kickoff_prompt"),
            evaluation_criteria: evaluation_criteria
                .into_iter()
                .map(|c| crate::models::EvaluationCategory {
                    name: c.name,
                    weight: c.weight,
                    score: None,
                    feedback: None,
                })
                .collect(),
            passing_score: r.try_get::<Option<f32>, _>("passing_score").ok().flatten(),
            missions,
            supplemental_info: r
                .try_get::<Option<String>, _>("supplemental_info")
                .ok()
                .flatten(),
        }
    }

    /// Get a custom scenario by ID for the authenticated user.
    /// `user_id IS NULL` rows are treated as globally shared custom scenarios.
    pub async fn get_for_user(&self, id: &str, user_id: &str) -> Result<Option<Scenario>> {
        let row = sqlx::query(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch scenario")?;

        Ok(row.map(Self::map_row))
    }

    /// List custom scenarios visible to the authenticated user.
    pub async fn list_for_user(&self, user_id: &str) -> Result<Vec<Scenario>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            WHERE user_id = $1 OR user_id IS NULL
            ORDER BY created_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list scenarios")?;

        Ok(rows.into_iter().map(Self::map_row).collect())
    }

    /// Delete a user-owned scenario by ID.
    pub async fn delete_for_user(&self, id: &str, user_id: &str) -> Result<()> {
        let result = sqlx::query("DELETE FROM custom_scenarios WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete scenario")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Scenario not found");
        }

        Ok(())
    }
}
