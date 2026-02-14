use axum::http::StatusCode;
use sqlx::PgPool;

use crate::error::{client_error, AppError};

use super::models::MyAccountResponse;
use super::repository::UserRepository;

#[derive(Clone)]
pub struct UserService {
    pool: PgPool,
}

impl UserService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Upsert a user (create or update)
    pub async fn upsert_user(
        &self,
        id: &str,
        email: Option<&str>,
        name: Option<&str>,
        picture: Option<&str>,
    ) -> Result<(), AppError> {
        let repo = UserRepository::new(self.pool.clone());
        repo.upsert(id, email, name, picture)
            .await
            .map_err(AppError::from)
    }

    pub async fn get_my_account(&self, user_id: &str) -> Result<MyAccountResponse, AppError> {
        let repo = UserRepository::new(self.pool.clone());
        repo.get_by_id(user_id)
            .await
            .map_err(AppError::from)?
            .ok_or_else(|| {
                AppError::new(
                    StatusCode::NOT_FOUND,
                    anyhow::anyhow!("アカウント情報が見つかりません"),
                )
            })
    }

    pub async fn delete_my_account(&self, user_id: &str) -> Result<(), AppError> {
        let repo = UserRepository::new(self.pool.clone());

        if let Some(organization_name) = repo
            .find_blocking_owner_org(user_id)
            .await
            .map_err(AppError::from)?
        {
            return Err(client_error(format!(
                "組織「{}」のオーナー権限が残っているため、アカウントを削除できません。先にオーナーを引き継いでください。",
                organization_name
            )));
        }

        if let Some(organization_name) = repo
            .find_blocking_owned_org(user_id)
            .await
            .map_err(AppError::from)?
        {
            return Err(client_error(format!(
                "組織「{}」に他のアクティブメンバーがいるため、アカウントを削除できません。先に組織オーナーを引き継いでください。",
                organization_name
            )));
        }

        repo.delete_account_data(user_id)
            .await
            .map_err(AppError::from)
    }
}
