use anyhow::{Context, Result};
use sqlx::{PgPool, Row};

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

    /// Get the product configuration for the authenticated user.
    pub async fn get(&self, user_id: &str) -> Result<Option<ProductConfig>> {
        let row = sqlx::query(
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
            WHERE user_id = $1
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch product config")?;

        Ok(row.map(|r| {
            let problems: Vec<String> = r
                .try_get::<serde_json::Value, _>("problems")
                .ok()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let goals: Vec<String> = r
                .try_get::<serde_json::Value, _>("goals")
                .ok()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let differentiators: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("differentiators")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let scope: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("scope")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let constraints: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("constraints")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let success_criteria: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("success_criteria")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let tech_stack: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("tech_stack")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();
            let core_features: Vec<String> = r
                .try_get::<Option<serde_json::Value>, _>("core_features")
                .ok()
                .flatten()
                .and_then(|v| serde_json::from_value(v).ok())
                .unwrap_or_default();

            ProductConfig {
                id: Some(r.get("id")),
                name: r.get("name"),
                summary: r.get("summary"),
                audience: r.get("audience"),
                problems,
                goals,
                differentiators,
                scope,
                constraints,
                timeline: r.try_get::<Option<String>, _>("timeline").ok().flatten(),
                success_criteria,
                unique_edge: r.try_get::<Option<String>, _>("unique_edge").ok().flatten(),
                tech_stack,
                core_features,
                product_prompt: r
                    .try_get::<Option<String>, _>("product_prompt")
                    .ok()
                    .flatten(),
                is_default: false,
                created_at: r
                    .try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                    .ok()
                    .map(|v| v.to_rfc3339()),
                updated_at: r
                    .try_get::<chrono::DateTime<chrono::Utc>, _>("updated_at")
                    .ok()
                    .map(|v| v.to_rfc3339()),
            }
        }))
    }

    /// Create or update the product configuration for a single user.
    pub async fn upsert(
        &self,
        user_id: &str,
        config: &UpdateProductConfigRequest,
    ) -> Result<ProductConfig> {
        let problems = serde_json::to_value(&config.problems)?;
        let goals = serde_json::to_value(&config.goals)?;
        let differentiators = serde_json::to_value(&config.differentiators)?;
        let scope = serde_json::to_value(&config.scope)?;
        let constraints = serde_json::to_value(&config.constraints)?;
        let success_criteria = serde_json::to_value(&config.success_criteria)?;
        let tech_stack = serde_json::to_value(&config.tech_stack)?;
        let core_features = serde_json::to_value(&config.core_features)?;
        let product_prompt = config.product_prompt.clone();

        let row = sqlx::query(
            r#"
            INSERT INTO product_config (
                user_id,
                name, summary, audience,
                problems, goals, differentiators,
                scope, constraints, timeline,
                success_criteria, unique_edge, tech_stack, core_features,
                product_prompt
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (user_id)
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
        )
        .bind(user_id)
        .bind(&config.name)
        .bind(&config.summary)
        .bind(&config.audience)
        .bind(problems)
        .bind(goals)
        .bind(differentiators)
        .bind(scope)
        .bind(constraints)
        .bind(&config.timeline)
        .bind(success_criteria)
        .bind(&config.unique_edge)
        .bind(tech_stack)
        .bind(core_features)
        .bind(product_prompt)
        .fetch_one(&self.pool)
        .await
        .context("Failed to upsert product config")?;

        let problems: Vec<String> = row
            .try_get::<serde_json::Value, _>("problems")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let goals: Vec<String> = row
            .try_get::<serde_json::Value, _>("goals")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let differentiators: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("differentiators")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let scope: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("scope")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let constraints: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("constraints")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let success_criteria: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("success_criteria")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let tech_stack: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("tech_stack")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();
        let core_features: Vec<String> = row
            .try_get::<Option<serde_json::Value>, _>("core_features")
            .ok()
            .flatten()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or_default();

        Ok(ProductConfig {
            id: Some(row.get("id")),
            name: row.get("name"),
            summary: row.get("summary"),
            audience: row.get("audience"),
            problems,
            goals,
            differentiators,
            scope,
            constraints,
            timeline: row.try_get::<Option<String>, _>("timeline").ok().flatten(),
            success_criteria,
            unique_edge: row
                .try_get::<Option<String>, _>("unique_edge")
                .ok()
                .flatten(),
            tech_stack,
            core_features,
            product_prompt: row
                .try_get::<Option<String>, _>("product_prompt")
                .ok()
                .flatten(),
            is_default: false,
            created_at: row
                .try_get::<chrono::DateTime<chrono::Utc>, _>("created_at")
                .ok()
                .map(|v| v.to_rfc3339()),
            updated_at: row
                .try_get::<chrono::DateTime<chrono::Utc>, _>("updated_at")
                .ok()
                .map(|v| v.to_rfc3339()),
        })
    }

    /// Delete the product configuration (resets to default) for one user.
    pub async fn delete(&self, user_id: &str) -> Result<()> {
        sqlx::query("DELETE FROM product_config WHERE user_id = $1")
            .bind(user_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete product config")?;

        Ok(())
    }
}
