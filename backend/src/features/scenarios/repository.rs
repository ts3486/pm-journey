use sqlx::PgPool;
use crate::models::{
    Mission, ProductInfo, RatingCriterion, Scenario, ScenarioBehavior, ScenarioDiscipline,
};
use anyhow::{Result, Context};

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

       /// Create a new custom scenario
    pub async fn create(&self, scenario: &Scenario) -> Result<Scenario> {
        let discipline = match scenario.discipline {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        };

        // Convert nested structs to JSONB
        let behavior = serde_json::to_value(&scenario.behavior)?;
        let product = serde_json::to_value(&scenario.product)?;
        let evaluation_criteria = serde_json::to_value(&scenario.evaluation_criteria)?;
        let missions = serde_json::to_value(&scenario.missions)?;

        sqlx::query!(
            r#"
            INSERT INTO custom_scenarios (
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
            scenario.id,
            scenario.title,
            scenario.description,
            discipline,
            scenario.mode,
            scenario.kickoff_prompt,
            scenario.passing_score,
            scenario.supplemental_info,
            behavior,
            product,
            evaluation_criteria,
            missions,
        )
        .execute(&self.pool)
        .await
        .context("Failed to insert scenario")?;

        // Return the created scenario
        self.get(&scenario.id).await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created scenario"))
    }

    /// Get a scenario by ID
    pub async fn get(&self, id: &str) -> Result<Option<Scenario>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch scenario")?;

        Ok(row.map(|r| {
            // Convert discipline string to enum
            let discipline = match r.discipline.as_str() {
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            };

            // Parse JSONB back to structs
            let behavior: ScenarioBehavior = r
                .behavior
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let product: ProductInfo = serde_json::from_value(r.product)
                .expect("Invalid product JSON in database");
            let evaluation_criteria: Vec<RatingCriterion> =
                serde_json::from_value(r.evaluation_criteria)
                    .unwrap_or_default();
            let missions: Option<Vec<Mission>> = r.missions
                .and_then(|v| serde_json::from_value(v).ok());

            Scenario {
                id: r.id,
                title: r.title,
                description: r.description,
                discipline,
                product,
                mode: r.mode,
                behavior,
                kickoff_prompt: r.kickoff_prompt,
                evaluation_criteria: evaluation_criteria.into_iter()
                    .map(|c| crate::models::EvaluationCategory {
                        name: c.name,
                        weight: c.weight,
                        score: None,
                        feedback: None,
                    })
                    .collect(),
                passing_score: r.passing_score,
                missions,
                supplemental_info: r.supplemental_info,
            }
        }))
    }

    /// List all custom scenarios
    pub async fn list(&self) -> Result<Vec<Scenario>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, title, description, discipline, mode,
                kickoff_prompt, passing_score, supplemental_info,
                behavior, product, evaluation_criteria, missions
            FROM custom_scenarios
            ORDER BY created_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list scenarios")?;

        Ok(rows.into_iter().map(|r| {
            let discipline = match r.discipline.as_str() {
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            };

            let behavior: ScenarioBehavior = r
                .behavior
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let product: ProductInfo = serde_json::from_value(r.product)
                .expect("Invalid product JSON");
            let evaluation_criteria: Vec<RatingCriterion> =
                serde_json::from_value(r.evaluation_criteria)
                    .unwrap_or_default();
            let missions: Option<Vec<Mission>> = r.missions
                .and_then(|v| serde_json::from_value(v).ok());

            Scenario {
                id: r.id,
                title: r.title,
                description: r.description,
                discipline,
                product,
                mode: r.mode,
                behavior,
                kickoff_prompt: r.kickoff_prompt,
                evaluation_criteria: evaluation_criteria.into_iter()
                    .map(|c| crate::models::EvaluationCategory {
                        name: c.name,
                        weight: c.weight,
                        score: None,
                        feedback: None,
                    })
                    .collect(),
                passing_score: r.passing_score,
                missions,
                supplemental_info: r.supplemental_info,
            }
        }).collect())
    }

    /// Update an existing scenario
    pub async fn update(&self, scenario: &Scenario) -> Result<Scenario> {
        let discipline = match scenario.discipline {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        };

        let behavior = serde_json::to_value(&scenario.behavior)?;
        let product = serde_json::to_value(&scenario.product)?;
        let evaluation_criteria = serde_json::to_value(&scenario.evaluation_criteria)?;
        let missions = serde_json::to_value(&scenario.missions)?;

        let result = sqlx::query!(
            r#"
            UPDATE custom_scenarios
            SET title = $2,
                description = $3,
                discipline = $4,
                mode = $5,
                kickoff_prompt = $6,
                passing_score = $7,
                supplemental_info = $8,
                behavior = $9,
                product = $10,
                evaluation_criteria = $11,
                missions = $12
            WHERE id = $1
            "#,
            scenario.id,
            scenario.title,
            scenario.description,
            discipline,
            scenario.mode,
            scenario.kickoff_prompt,
            scenario.passing_score,
            scenario.supplemental_info,
            behavior,
            product,
            evaluation_criteria,
            missions,
        )
        .execute(&self.pool)
        .await
        .context("Failed to update scenario")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Scenario not found");
        }

        self.get(&scenario.id).await?
            .ok_or_else(|| anyhow::anyhow!("Scenario not found after update"))
    }

    /// Delete a scenario by ID
    pub async fn delete(&self, id: &str) -> Result<()> {
        let result = sqlx::query!("DELETE FROM custom_scenarios WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .context("Failed to delete scenario")?;

        if result.rows_affected() == 0 {
            anyhow::bail!("Scenario not found");
        }

        Ok(())
    }

    /// Check if a scenario ID exists
    pub async fn exists(&self, id: &str) -> Result<bool> {
        let result = sqlx::query!(
            "SELECT EXISTS(SELECT 1 FROM custom_scenarios WHERE id = $1) as exists",
            id
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to check scenario existence")?;

        Ok(result.exists.unwrap_or(false))
    }
}
