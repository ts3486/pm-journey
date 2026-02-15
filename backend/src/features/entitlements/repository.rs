use super::models::{Entitlement, PlanCode};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{postgres::PgRow, PgPool, Postgres, Row, Transaction};

#[derive(Clone)]
pub struct EntitlementRepository {
    pool: PgPool,
}

impl EntitlementRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn map_row(row: PgRow) -> Option<Entitlement> {
        let plan_code_raw: String = row.try_get("plan_code").ok()?;
        let plan_code = PlanCode::from_str(&plan_code_raw)?;

        Some(Entitlement {
            id: row.try_get("id").ok()?,
            scope_type: row.try_get("scope_type").ok()?,
            scope_id: row.try_get("scope_id").ok()?,
            plan_code,
            status: row.try_get("status").ok()?,
            valid_from: row
                .try_get::<Option<String>, _>("valid_from")
                .ok()
                .flatten()
                .unwrap_or_default(),
            valid_until: row
                .try_get::<Option<String>, _>("valid_until")
                .ok()
                .flatten(),
            source_subscription_id: row
                .try_get::<Option<String>, _>("source_subscription_id")
                .ok()
                .flatten(),
        })
    }

    pub async fn find_active_for_user(&self, user_id: &str) -> Result<Option<Entitlement>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                scope_type,
                scope_id,
                plan_code,
                status,
                to_char(valid_from, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_from,
                to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_until,
                source_subscription_id
            FROM entitlements
            WHERE scope_type = 'user'
                AND scope_id = $1
                AND status = 'active'
                AND valid_from <= NOW()
                AND (valid_until IS NULL OR valid_until > NOW())
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch active entitlement for user")?;

        Ok(row.and_then(Self::map_row))
    }

    #[allow(dead_code)]
    pub async fn find_active_for_org(&self, org_id: &str) -> Result<Option<Entitlement>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                scope_type,
                scope_id,
                plan_code,
                status,
                to_char(valid_from, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_from,
                to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_until,
                source_subscription_id
            FROM entitlements
            WHERE scope_type = 'organization'
                AND scope_id = $1
                AND status = 'active'
                AND valid_from <= NOW()
                AND (valid_until IS NULL OR valid_until > NOW())
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(org_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch active entitlement for organization")?;

        Ok(row.and_then(Self::map_row))
    }

    pub async fn create(&self, entitlement: &Entitlement) -> Result<Entitlement> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, entitlement).await?;
        tx.commit().await?;

        self.get(&entitlement.id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created entitlement"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        entitlement: &Entitlement,
    ) -> Result<()> {
        let valid_from: DateTime<Utc> = entitlement
            .valid_from
            .parse()
            .context("Failed to parse valid_from timestamp")?;

        let valid_until: Option<DateTime<Utc>> = entitlement
            .valid_until
            .as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse valid_until timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO entitlements (
                id, scope_type, scope_id, plan_code, status, valid_from, valid_until, source_subscription_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(&entitlement.id)
        .bind(&entitlement.scope_type)
        .bind(&entitlement.scope_id)
        .bind(entitlement.plan_code.as_str())
        .bind(&entitlement.status)
        .bind(valid_from)
        .bind(valid_until)
        .bind(&entitlement.source_subscription_id)
        .execute(&mut **tx)
        .await
        .context("Failed to insert entitlement")?;

        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<Option<Entitlement>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                scope_type,
                scope_id,
                plan_code,
                status,
                to_char(valid_from, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_from,
                to_char(valid_until, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as valid_until,
                source_subscription_id
            FROM entitlements
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch entitlement")?;

        Ok(row.and_then(Self::map_row))
    }

    #[allow(dead_code)]
    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM entitlements WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete entitlement")?;

        Ok(())
    }
}
