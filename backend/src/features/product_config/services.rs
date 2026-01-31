use sqlx::PgPool;

use crate::error::AppError;

use super::models::{ProductConfig, UpdateProductConfigRequest};
use super::repository::ProductConfigRepository;

#[derive(Clone)]
pub struct ProductConfigService {
    pool: PgPool,
}

impl ProductConfigService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get the current product configuration (custom or default)
    pub async fn get_product_config(&self) -> Result<ProductConfig, AppError> {
        let repo = ProductConfigRepository::new(self.pool.clone());

        match repo.get().await? {
            Some(config) => Ok(config),
            None => Ok(ProductConfig::default_product()),
        }
    }

    /// Update the product configuration
    pub async fn update_product_config(
        &self,
        request: &UpdateProductConfigRequest,
    ) -> Result<ProductConfig, AppError> {
        // Validate required fields
        if request.name.trim().is_empty() {
            return Err(crate::error::client_error("プロダクト名は必須です"));
        }
        if request.summary.trim().is_empty() {
            return Err(crate::error::client_error("概要は必須です"));
        }
        if request.audience.trim().is_empty() {
            return Err(crate::error::client_error("対象ユーザーは必須です"));
        }
        if request.problems.is_empty() {
            return Err(crate::error::client_error("課題は1つ以上必要です"));
        }
        if request.goals.is_empty() {
            return Err(crate::error::client_error("ゴールは1つ以上必要です"));
        }

        let repo = ProductConfigRepository::new(self.pool.clone());
        let config = repo.upsert(request).await?;
        Ok(config)
    }

    /// Reset to default product configuration
    pub async fn reset_product_config(&self) -> Result<ProductConfig, AppError> {
        let repo = ProductConfigRepository::new(self.pool.clone());
        repo.delete().await?;
        Ok(ProductConfig::default_product())
    }
}
