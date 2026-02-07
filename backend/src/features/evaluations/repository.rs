use crate::models::{Evaluation, EvaluationCategory};
use anyhow::{Context, Result};
use sqlx::{PgPool, Postgres, Transaction};

#[derive(Clone)]
pub struct EvaluationRepository {
    pool: PgPool,
}

impl EvaluationRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    #[allow(dead_code)]
    pub async fn create(&self, evaluation: &Evaluation) -> Result<Evaluation> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, evaluation).await?;
        tx.commit().await?;

        self.get_by_session(&evaluation.session_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created evaluation"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        evaluation: &Evaluation,
    ) -> Result<()> {
        let categories = serde_json::to_value(&evaluation.categories)?;

        sqlx::query!(
            r#"
            INSERT INTO evaluations (
                session_id, overall_score, passing, categories, summary, improvement_advice
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (session_id) DO UPDATE
            SET overall_score = EXCLUDED.overall_score,
                passing = EXCLUDED.passing,
                categories = EXCLUDED.categories,
                summary = EXCLUDED.summary,
                improvement_advice = EXCLUDED.improvement_advice,
                created_at = NOW()
            "#,
            evaluation.session_id,
            evaluation.overall_score,
            evaluation.passing,
            categories,
            evaluation.summary,
            evaluation.improvement_advice,
        )
        .execute(&mut **tx)
        .await
        .context("Failed to insert evaluation")?;

        Ok(())
    }

    pub async fn get_by_session(&self, session_id: &str) -> Result<Option<Evaluation>> {
        let row = sqlx::query!(
            r#"
            SELECT session_id, overall_score, passing, categories, summary, improvement_advice
            FROM evaluations
            WHERE session_id = $1
            "#,
            session_id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch evaluation")?;

        Ok(row.map(|r| {
            let categories: Vec<EvaluationCategory> =
                serde_json::from_value(r.categories).unwrap_or_default();

            Evaluation {
                session_id: r.session_id,
                overall_score: r.overall_score,
                passing: r.passing,
                categories,
                summary: r.summary,
                improvement_advice: r.improvement_advice,
            }
        }))
    }

    #[allow(dead_code)]
    pub async fn delete_by_session(&self, session_id: &str) -> Result<()> {
        sqlx::query!("DELETE FROM evaluations WHERE session_id = $1", session_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete evaluation")?;

        Ok(())
    }
}
