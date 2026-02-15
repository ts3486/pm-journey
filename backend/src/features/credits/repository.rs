use super::models::{CreditBalanceResponse, CreditLedgerEntry, CreditWallet};
use anyhow::{Context, Result};
use chrono::{DateTime, Duration, Utc};
use sqlx::{postgres::PgRow, PgPool, Postgres, Row, Transaction};

#[derive(Clone)]
pub struct CreditWalletRepository {
    pool: PgPool,
}

#[allow(dead_code)]
impl CreditWalletRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn map_wallet_row(row: PgRow) -> CreditWallet {
        CreditWallet {
            id: row.try_get("id").unwrap_or_default(),
            scope_type: row.try_get("scope_type").unwrap_or_default(),
            scope_id: row.try_get("scope_id").unwrap_or_default(),
            monthly_credits: row.try_get("monthly_credits").unwrap_or(0),
            purchased_credits: row.try_get("purchased_credits").unwrap_or(0),
            monthly_reset_at: row
                .try_get::<Option<String>, _>("monthly_reset_at")
                .ok()
                .flatten(),
        }
    }

    pub async fn get_wallet(
        &self,
        scope_type: &str,
        scope_id: &str,
    ) -> Result<Option<CreditWallet>> {
        let row = sqlx::query(
            r#"
            SELECT
                id,
                scope_type,
                scope_id,
                monthly_credits,
                purchased_credits,
                to_char(monthly_reset_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as monthly_reset_at
            FROM credit_wallets
            WHERE scope_type = $1 AND scope_id = $2
            "#,
        )
        .bind(scope_type)
        .bind(scope_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch credit wallet")?;

        Ok(row.map(Self::map_wallet_row))
    }

    pub async fn create_wallet(&self, wallet: &CreditWallet) -> Result<CreditWallet> {
        let mut tx = self.pool.begin().await?;
        self.create_wallet_in_tx(&mut tx, wallet).await?;
        tx.commit().await?;

        self.get_wallet(&wallet.scope_type, &wallet.scope_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created wallet"))
    }

    pub async fn create_wallet_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        wallet: &CreditWallet,
    ) -> Result<()> {
        let monthly_reset_at: Option<DateTime<Utc>> = wallet
            .monthly_reset_at
            .as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse monthly_reset_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO credit_wallets (
                id, scope_type, scope_id, monthly_credits, purchased_credits, monthly_reset_at
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(&wallet.id)
        .bind(&wallet.scope_type)
        .bind(&wallet.scope_id)
        .bind(wallet.monthly_credits)
        .bind(wallet.purchased_credits)
        .bind(monthly_reset_at)
        .execute(&mut **tx)
        .await
        .context("Failed to insert credit wallet")?;

        Ok(())
    }

    pub async fn get_or_create_wallet(
        &self,
        scope_type: &str,
        scope_id: &str,
        monthly_credits: i32,
    ) -> Result<CreditWallet> {
        if let Some(wallet) = self.get_wallet(scope_type, scope_id).await? {
            return Ok(wallet);
        }

        let reset_at = Utc::now() + Duration::days(30);
        let wallet = CreditWallet {
            id: format!("wallet-{}", uuid::Uuid::new_v4()),
            scope_type: scope_type.to_string(),
            scope_id: scope_id.to_string(),
            monthly_credits,
            purchased_credits: 0,
            monthly_reset_at: Some(reset_at.to_rfc3339()),
        };

        self.create_wallet(&wallet).await
    }

    pub async fn debit_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        wallet_id: &str,
        amount: i32,
        reason: &str,
        reference_type: Option<&str>,
        reference_id: Option<&str>,
    ) -> Result<CreditLedgerEntry> {
        let wallet = sqlx::query(
            r#"
            SELECT id, monthly_credits, purchased_credits
            FROM credit_wallets
            WHERE id = $1
            FOR UPDATE
            "#,
        )
        .bind(wallet_id)
        .fetch_one(&mut **tx)
        .await
        .context("Failed to lock credit wallet")?;

        let monthly_credits: i32 = wallet.try_get("monthly_credits").unwrap_or(0);
        let (debit_monthly, debit_purchased) = if monthly_credits >= amount {
            (amount, 0)
        } else {
            let from_monthly = monthly_credits;
            let from_purchased = amount - from_monthly;
            (from_monthly, from_purchased)
        };

        sqlx::query(
            r#"
            UPDATE credit_wallets
            SET monthly_credits = monthly_credits - $1,
                purchased_credits = purchased_credits - $2
            WHERE id = $3
            "#,
        )
        .bind(debit_monthly)
        .bind(debit_purchased)
        .bind(wallet_id)
        .execute(&mut **tx)
        .await
        .context("Failed to debit credit wallet")?;

        let ledger_id = format!("ledger-{}", uuid::Uuid::new_v4());
        let occurred_at = Utc::now();

        sqlx::query(
            r#"
            INSERT INTO credit_ledger (
                id, wallet_id, direction, amount, reason, reference_type, reference_id, occurred_at
            )
            VALUES ($1, $2, 'debit', $3, $4, $5, $6, $7)
            "#,
        )
        .bind(&ledger_id)
        .bind(wallet_id)
        .bind(amount)
        .bind(reason)
        .bind(reference_type)
        .bind(reference_id)
        .bind(occurred_at)
        .execute(&mut **tx)
        .await
        .context("Failed to insert credit ledger entry")?;

        Ok(CreditLedgerEntry {
            id: ledger_id,
            wallet_id: wallet_id.to_string(),
            direction: "debit".to_string(),
            amount,
            reason: reason.to_string(),
            reference_type: reference_type.map(str::to_string),
            reference_id: reference_id.map(str::to_string),
            occurred_at: occurred_at.to_rfc3339(),
        })
    }

    pub async fn get_balance(&self, wallet_id: &str) -> Result<CreditBalanceResponse> {
        let wallet = sqlx::query(
            r#"
            SELECT monthly_credits, purchased_credits
            FROM credit_wallets
            WHERE id = $1
            "#,
        )
        .bind(wallet_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch wallet balance")?;

        let monthly_remaining: i32 = wallet.try_get("monthly_credits").unwrap_or(0);
        let purchased_remaining: i32 = wallet.try_get("purchased_credits").unwrap_or(0);
        let available = monthly_remaining + purchased_remaining;

        Ok(CreditBalanceResponse {
            available,
            monthly_remaining,
            purchased_remaining,
        })
    }

    pub async fn daily_usage(&self, wallet_id: &str) -> Result<i32> {
        let result = sqlx::query(
            r#"
            SELECT COALESCE(SUM(amount), 0) as total
            FROM credit_ledger
            WHERE wallet_id = $1
                AND direction = 'debit'
                AND occurred_at >= CURRENT_DATE
                AND occurred_at < CURRENT_DATE + INTERVAL '1 day'
            "#,
        )
        .bind(wallet_id)
        .fetch_one(&self.pool)
        .await
        .context("Failed to fetch daily usage")?;

        let total: i64 = result.try_get("total").unwrap_or(0_i64);
        Ok(total as i32)
    }

    #[allow(dead_code)]
    pub async fn reset_expired_wallets(&self) -> Result<u64> {
        let result = sqlx::query(
            r#"
            UPDATE credit_wallets
            SET monthly_credits = monthly_credits,
                monthly_reset_at = monthly_reset_at + INTERVAL '1 month'
            WHERE monthly_reset_at IS NOT NULL
                AND monthly_reset_at <= NOW()
            "#,
        )
        .execute(&self.pool)
        .await
        .context("Failed to reset expired wallets")?;

        Ok(result.rows_affected())
    }

    #[allow(dead_code)]
    pub async fn delete_wallet(&self, id: &str) -> Result<()> {
        sqlx::query("DELETE FROM credit_wallets WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .context("Failed to delete credit wallet")?;

        Ok(())
    }
}
