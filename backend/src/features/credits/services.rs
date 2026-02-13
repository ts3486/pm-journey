use sqlx::PgPool;

use crate::error::{anyhow_error, payment_required_error, too_many_requests_error, AppError};

use super::models::{CreditBalanceResponse, CreditLedgerEntry, CreditWallet};
use super::repository::CreditWalletRepository;

#[derive(Clone)]
pub struct CreditService {
    pool: PgPool,
}

#[allow(dead_code)]
impl CreditService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Consume credits from a wallet with daily limit checking
    pub async fn consume_credit(
        &self,
        scope_type: &str,
        scope_id: &str,
        amount: i32,
        reason: &str,
        reference_type: Option<&str>,
        reference_id: Option<&str>,
        daily_limit: Option<i32>,
    ) -> Result<CreditLedgerEntry, AppError> {
        let wallet_repo = CreditWalletRepository::new(self.pool.clone());

        // Get wallet
        let wallet = wallet_repo
            .get_wallet(scope_type, scope_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch wallet: {}", e)))?
            .ok_or_else(|| anyhow_error("Wallet not found"))?;

        // Check daily limit if specified
        if let Some(limit) = daily_limit {
            let daily_usage = wallet_repo
                .daily_usage(&wallet.id)
                .await
                .map_err(|e| anyhow_error(&format!("Failed to check daily usage: {}", e)))?;

            if daily_usage + amount > limit {
                return Err(too_many_requests_error(format!(
                    "CREDIT_DAILY_LIMIT: Daily credit limit reached. Used: {}, Limit: {}",
                    daily_usage, limit
                )));
            }
        }

        // Check balance
        let balance = wallet_repo
            .get_balance(&wallet.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get balance: {}", e)))?;

        if balance.available < amount {
            return Err(payment_required_error(format!(
                "CREDIT_EXHAUSTED: Insufficient credits. Available: {}, Required: {}",
                balance.available, amount
            )));
        }

        // Debit in transaction
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

        let entry = wallet_repo
            .debit_in_tx(
                &mut tx,
                &wallet.id,
                amount,
                reason,
                reference_type,
                reference_id,
            )
            .await
            .map_err(|e| anyhow_error(&format!("Failed to debit credits: {}", e)))?;

        tx.commit()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to commit transaction: {}", e)))?;

        Ok(entry)
    }

    /// Ensure a wallet exists for the given scope
    pub async fn ensure_wallet(
        &self,
        scope_type: &str,
        scope_id: &str,
        monthly_credits: i32,
    ) -> Result<CreditWallet, AppError> {
        let wallet_repo = CreditWalletRepository::new(self.pool.clone());

        wallet_repo
            .get_or_create_wallet(scope_type, scope_id, monthly_credits)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to ensure wallet: {}", e)))
    }

    /// Get balance for a user's wallet
    pub async fn get_my_balance(
        &self,
        scope_type: &str,
        scope_id: &str,
    ) -> Result<CreditBalanceResponse, AppError> {
        let wallet_repo = CreditWalletRepository::new(self.pool.clone());

        let wallet = wallet_repo
            .get_wallet(scope_type, scope_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to fetch wallet: {}", e)))?
            .ok_or_else(|| anyhow_error("Wallet not found"))?;

        wallet_repo
            .get_balance(&wallet.id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get balance: {}", e)))
    }

    /// Run monthly reset for all wallets
    #[allow(dead_code)]
    pub async fn run_monthly_reset(&self) -> Result<u64, AppError> {
        let wallet_repo = CreditWalletRepository::new(self.pool.clone());

        // This is a simplified version - in production, you'd want to:
        // 1. Fetch wallets that need reset
        // 2. For each wallet, determine correct monthly_credits from entitlement
        // 3. Update wallet with new credits and reset date
        // 4. Insert ledger entry for "monthly_reset"

        wallet_repo
            .reset_expired_wallets()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to reset wallets: {}", e)))
    }

    /// Get credits for a user (wrapper that resolves effective plan scope)
    pub async fn get_my_credits(&self, user_id: &str) -> Result<CreditBalanceResponse, AppError> {
        let _ = user_id;
        // Ultra-simple launch mode: app-level credit wallets are disabled.
        Ok(CreditBalanceResponse {
            available: 0,
            monthly_remaining: 0,
            purchased_remaining: 0,
        })
    }
}
