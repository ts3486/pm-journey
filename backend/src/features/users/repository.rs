use anyhow::{Context, Result};
use sqlx::{PgPool, Row};

use super::models::MyAccountResponse;

/// Repository for user operations
#[derive(Clone)]
pub struct UserRepository {
    pool: PgPool,
}

impl UserRepository {
    /// Create a new repository instance
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Upsert a user (insert or update if exists)
    pub async fn upsert(
        &self,
        id: &str,
        email: Option<&str>,
        name: Option<&str>,
        picture: Option<&str>,
    ) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO users (id, email, name, picture)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id)
            DO UPDATE SET
                email = EXCLUDED.email,
                name = EXCLUDED.name,
                picture = EXCLUDED.picture,
                updated_at = NOW()
            "#,
        )
        .bind(id)
        .bind(email)
        .bind(name)
        .bind(picture)
        .execute(&self.pool)
        .await
        .context("Failed to upsert user")?;

        Ok(())
    }

    pub async fn get_by_id(&self, id: &str) -> Result<Option<MyAccountResponse>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                email,
                name,
                picture,
                to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
            FROM users
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch user by id")?;

        Ok(row.map(|r| MyAccountResponse {
            id: r.get("id"),
            email: r.try_get::<Option<String>, _>("email").unwrap_or(None),
            name: r.try_get::<Option<String>, _>("name").unwrap_or(None),
            picture: r.try_get::<Option<String>, _>("picture").unwrap_or(None),
            created_at: r
                .try_get::<Option<String>, _>("created_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            updated_at: r
                .try_get::<Option<String>, _>("updated_at")
                .unwrap_or(None)
                .unwrap_or_default(),
        }))
    }

    pub async fn find_blocking_owned_org(&self, user_id: &str) -> Result<Option<String>> {
        let row = sqlx::query(
            r#"
            SELECT o.name
            FROM organizations o
            INNER JOIN organization_members m
              ON m.organization_id = o.id
             AND m.status = 'active'
             AND m.user_id <> $1
            WHERE o.created_by_user_id = $1
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to check blocking organizations for account deletion")?;

        Ok(row.and_then(|r| r.try_get::<Option<String>, _>("name").ok().flatten()))
    }

    pub async fn find_blocking_owner_org(&self, user_id: &str) -> Result<Option<String>> {
        let row = sqlx::query(
            r#"
            SELECT o.name
            FROM organization_members m
            INNER JOIN organizations o
              ON o.id = m.organization_id
            WHERE m.user_id = $1
              AND m.role = 'owner'
              AND m.status = 'active'
              AND EXISTS (
                  SELECT 1
                  FROM organization_members active_members
                  WHERE active_members.organization_id = m.organization_id
                    AND active_members.status = 'active'
                    AND active_members.user_id <> $1
              )
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to check owner memberships for account deletion")?;

        Ok(row.and_then(|r| r.try_get::<Option<String>, _>("name").ok().flatten()))
    }

    pub async fn delete_account_data(&self, user_id: &str) -> Result<()> {
        let mut tx = self
            .pool
            .begin()
            .await
            .context("Failed to start account deletion transaction")?;

        let owned_org_rows = sqlx::query(
            r#"
            SELECT id
            FROM organizations
            WHERE created_by_user_id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&mut *tx)
        .await
        .context("Failed to list owned organizations for account deletion")?;

        let owned_org_ids: Vec<String> = owned_org_rows
            .into_iter()
            .filter_map(|row| row.try_get::<Option<String>, _>("id").ok().flatten())
            .collect();

        if !owned_org_ids.is_empty() {
            sqlx::query(
                r#"
                UPDATE sessions
                SET organization_id = NULL
                WHERE organization_id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to detach sessions from owned organizations")?;

            sqlx::query(
                r#"
                DELETE FROM entitlements
                WHERE scope_type = 'organization'
                  AND scope_id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete organization entitlements")?;

            sqlx::query(
                r#"
                DELETE FROM entitlements
                WHERE source_subscription_id IN (
                    SELECT id
                    FROM subscriptions
                    WHERE organization_id = ANY($1)
                )
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete entitlements linked to organization subscriptions")?;

            sqlx::query(
                r#"
                DELETE FROM credit_ledger
                WHERE wallet_id IN (
                    SELECT id
                    FROM credit_wallets
                    WHERE scope_type = 'organization'
                      AND scope_id = ANY($1)
                )
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete organization credit ledger rows")?;

            sqlx::query(
                r#"
                DELETE FROM credit_wallets
                WHERE scope_type = 'organization'
                  AND scope_id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete organization credit wallets")?;

            sqlx::query(
                r#"
                DELETE FROM billing_customers
                WHERE organization_id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete organization billing customers")?;

            sqlx::query(
                r#"
                DELETE FROM subscriptions
                WHERE organization_id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete organization subscriptions")?;

            sqlx::query(
                r#"
                DELETE FROM organizations
                WHERE id = ANY($1)
                "#,
            )
            .bind(&owned_org_ids)
            .execute(&mut *tx)
            .await
            .context("Failed to delete owned organizations")?;
        }

        sqlx::query(
            r#"
            UPDATE organization_members
            SET invited_by_user_id = NULL
            WHERE invited_by_user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to clear organization invitation references")?;

        sqlx::query(
            r#"
            DELETE FROM organization_invitations
            WHERE created_by_user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user-created organization invitations")?;

        sqlx::query(
            r#"
            DELETE FROM organization_members
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete organization memberships")?;

        sqlx::query(
            r#"
            UPDATE comments
            SET author_user_id = NULL
            WHERE author_user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to clear comment author references")?;

        sqlx::query(
            r#"
            DELETE FROM outputs
            WHERE created_by_user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user-created outputs")?;

        sqlx::query(
            r#"
            DELETE FROM sessions
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user sessions")?;

        sqlx::query(
            r#"
            DELETE FROM custom_scenarios
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete custom scenarios")?;

        sqlx::query(
            r#"
            DELETE FROM product_config
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete product configuration")?;

        sqlx::query(
            r#"
            DELETE FROM entitlements
            WHERE source_subscription_id IN (
                SELECT id
                FROM subscriptions
                WHERE user_id = $1
            )
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete entitlements linked to user subscriptions")?;

        sqlx::query(
            r#"
            DELETE FROM entitlements
            WHERE scope_type = 'user'
              AND scope_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user entitlements")?;

        sqlx::query(
            r#"
            DELETE FROM credit_ledger
            WHERE wallet_id IN (
                SELECT id
                FROM credit_wallets
                WHERE scope_type = 'user'
                  AND scope_id = $1
            )
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user credit ledger rows")?;

        sqlx::query(
            r#"
            DELETE FROM credit_wallets
            WHERE scope_type = 'user'
              AND scope_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user credit wallets")?;

        sqlx::query(
            r#"
            DELETE FROM billing_customers
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user billing customers")?;

        sqlx::query(
            r#"
            DELETE FROM subscriptions
            WHERE user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user subscriptions")?;

        sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .context("Failed to delete user account record")?;

        tx.commit()
            .await
            .context("Failed to commit account deletion transaction")?;

        Ok(())
    }
}
