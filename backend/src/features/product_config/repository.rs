use anyhow::{Context, Result};
use sqlx::PgPool;

use super::models::{ProductConfig, UpdateProductConfigRequest};

/// Repository for product configuration CRUD operations
#[derive(Clone)]
pub struct ProductConfigRepository {
    pool: PgPool,
}

impl ProductConfigRepository {
    /// Create a new repository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get the product configuration (there's only one row due to singleton constraint)
    pub async fn get(&self) -> Result<Option<ProductConfig>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id::text,
                name, summary, audience,
                problems, goals, differentiators,
                scope, constraints, timeline,
                success_criteria, unique_edge, tech_stack, core_features,
                product_prompt,
                created_at, updated_at
            FROM product_config
            LIMIT 1
            "#
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch product config")?;

        Ok(row.map(|r| {
            let problems: Vec<String> = serde_json::from_value(r.problems).unwrap_or_default();
            let goals: Vec<String> = serde_json::from_value(r.goals).unwrap_or_default();
            let differentiators: Vec<String> =
                r.differentiators.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
            let scope: Vec<String> =
                r.scope.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
            let constraints: Vec<String> =
                r.constraints.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
            let success_criteria: Vec<String> =
                r.success_criteria.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
            let tech_stack: Vec<String> =
                r.tech_stack.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
            let core_features: Vec<String> =
                r.core_features.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();

            ProductConfig {
                id: r.id,
                name: r.name,
                summary: r.summary,
                audience: r.audience,
                problems,
                goals,
                differentiators,
                scope,
                constraints,
                timeline: r.timeline,
                success_criteria,
                unique_edge: r.unique_edge,
                tech_stack,
                core_features,
                product_prompt: r.product_prompt,
                is_default: false,
                created_at: Some(r.created_at.to_rfc3339()),
                updated_at: Some(r.updated_at.to_rfc3339()),
            }
        }))
    }

    /// Create or update the product configuration (upsert)
    pub async fn upsert(&self, config: &UpdateProductConfigRequest) -> Result<ProductConfig> {
        let problems = serde_json::to_value(&config.problems)?;
        let goals = serde_json::to_value(&config.goals)?;
        let differentiators = serde_json::to_value(&config.differentiators)?;
        let scope = serde_json::to_value(&config.scope)?;
        let constraints = serde_json::to_value(&config.constraints)?;
        let success_criteria = serde_json::to_value(&config.success_criteria)?;
        let tech_stack = serde_json::to_value(&config.tech_stack)?;
        let core_features = serde_json::to_value(&config.core_features)?;
        let product_prompt = config.product_prompt.clone();

        // Use ON CONFLICT to upsert (the singleton index ensures only one row)
        let row = sqlx::query!(
            r#"
            INSERT INTO product_config (
                name, summary, audience,
                problems, goals, differentiators,
                scope, constraints, timeline,
                success_criteria, unique_edge, tech_stack, core_features,
                product_prompt
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT ((true))
            DO UPDATE SET
                name = EXCLUDED.name,
                summary = EXCLUDED.summary,
                audience = EXCLUDED.audience,
                problems = EXCLUDED.problems,
                goals = EXCLUDED.goals,
                differentiators = EXCLUDED.differentiators,
                scope = EXCLUDED.scope,
                constraints = EXCLUDED.constraints,
                timeline = EXCLUDED.timeline,
                success_criteria = EXCLUDED.success_criteria,
                unique_edge = EXCLUDED.unique_edge,
                tech_stack = EXCLUDED.tech_stack,
                core_features = EXCLUDED.core_features,
                product_prompt = EXCLUDED.product_prompt,
                updated_at = NOW()
            RETURNING
                id::text,
                name, summary, audience,
                problems, goals, differentiators,
                scope, constraints, timeline,
                success_criteria, unique_edge, tech_stack, core_features,
                product_prompt,
                created_at, updated_at
            "#,
            config.name,
            config.summary,
            config.audience,
            problems,
            goals,
            differentiators,
            scope,
            constraints,
            config.timeline,
            success_criteria,
            config.unique_edge,
            tech_stack,
            core_features,
            product_prompt,
        )
        .fetch_one(&self.pool)
        .await
        .context("Failed to upsert product config")?;

        let problems: Vec<String> = serde_json::from_value(row.problems).unwrap_or_default();
        let goals: Vec<String> = serde_json::from_value(row.goals).unwrap_or_default();
        let differentiators: Vec<String> =
            row.differentiators.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
        let scope: Vec<String> =
            row.scope.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
        let constraints: Vec<String> =
            row.constraints.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
        let success_criteria: Vec<String> =
            row.success_criteria.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
        let tech_stack: Vec<String> =
            row.tech_stack.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
        let core_features: Vec<String> =
            row.core_features.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();

        Ok(ProductConfig {
            id: row.id,
            name: row.name,
            summary: row.summary,
            audience: row.audience,
            problems,
            goals,
            differentiators,
            scope,
            constraints,
            timeline: row.timeline,
            success_criteria,
            unique_edge: row.unique_edge,
            tech_stack,
            core_features,
            product_prompt: row.product_prompt,
            is_default: false,
            created_at: Some(row.created_at.to_rfc3339()),
            updated_at: Some(row.updated_at.to_rfc3339()),
        })
    }

    /// Delete the product configuration (resets to default)
    pub async fn delete(&self) -> Result<()> {
        sqlx::query!("DELETE FROM product_config")
            .execute(&self.pool)
            .await
            .context("Failed to delete product config")?;

        Ok(())
    }
}
