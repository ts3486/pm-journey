use sqlx::PgPool;

use crate::error::AppError;
use crate::features::evaluations::repository::EvaluationRepository;
use crate::features::messages::repository::MessageRepository;
use crate::features::sessions::repository::SessionRepository;

use super::models::{ImportResult, SessionSnapshot};

#[derive(Clone)]
pub struct ImportService {
    pool: PgPool,
}

impl ImportService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn import_sessions(
        &self,
        snapshots: Vec<SessionSnapshot>,
        user_id: &str,
    ) -> Result<ImportResult, AppError> {
        let mut imported = 0;
        let mut failed = Vec::new();

        for snapshot in snapshots {
            match import_snapshot(&self.pool, &snapshot, user_id).await {
                Ok(_) => imported += 1,
                Err(e) => failed.push(format!("{}: {}", snapshot.session.id, e)),
            }
        }

        Ok(ImportResult { imported, failed })
    }
}

async fn import_snapshot(
    pool: &PgPool,
    snapshot: &SessionSnapshot,
    user_id: &str,
) -> anyhow::Result<()> {
    let mut tx = pool.begin().await?;

    // Insert session
    let session_repo = SessionRepository::new(pool.clone());
    session_repo
        .create_in_tx(&mut tx, &snapshot.session, user_id)
        .await?;

    // Insert messages
    let message_repo = MessageRepository::new(pool.clone());
    for msg in &snapshot.messages {
        message_repo.create_in_tx(&mut tx, msg).await?;
    }

    // Insert evaluation if exists
    if let Some(eval) = &snapshot.evaluation {
        let eval_repo = EvaluationRepository::new(pool.clone());
        eval_repo.create_in_tx(&mut tx, eval).await?;
    }

    tx.commit().await?;
    Ok(())
}
