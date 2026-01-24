use sqlx::{PgPool, Postgres, Transaction};
use crate::models::{Session, SessionStatus, ScenarioDiscipline, ProgressFlags, MissionStatus};
use anyhow::{Result, Context};
use chrono::{DateTime, Utc};

#[derive(Clone)]
pub struct SessionRepository {
    pool: PgPool,
}

impl SessionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, session: &Session) -> Result<Session> {
        self.create_in_tx(&mut self.pool.begin().await?, session).await?;
        self.get(&session.id).await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created session"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        session: &Session,
    ) -> Result<()> {
        let status = match session.status {
            SessionStatus::Active => "active",
            SessionStatus::Completed => "completed",
            SessionStatus::Evaluated => "evaluated",
        };

        let discipline = session.scenario_discipline.as_ref().map(|d| match d {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        });

        let progress_flags = serde_json::to_value(&session.progress_flags)?;
        let mission_status = serde_json::to_value(&session.mission_status)?;

        let started_at: DateTime<Utc> = session.started_at.parse()
            .context("Failed to parse started_at timestamp")?;
        let ended_at: Option<DateTime<Utc>> = session.ended_at.as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse ended_at timestamp")?;
        let last_activity_at: DateTime<Utc> = session.last_activity_at.parse()
            .context("Failed to parse last_activity_at timestamp")?;

        sqlx::query!(
            r#"
            INSERT INTO sessions (
                id, scenario_id, scenario_discipline, status,
                started_at, ended_at, last_activity_at, user_name,
                evaluation_requested, progress_flags, mission_status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            "#,
            session.id,
            session.scenario_id,
            discipline,
            status,
            started_at,
            ended_at,
            last_activity_at,
            session.user_name,
            session.evaluation_requested,
            progress_flags,
            mission_status,
        )
        .execute(&mut **tx)
        .await
        .context("Failed to insert session")?;

        Ok(())
    }

    pub async fn update(&self, session: &Session) -> Result<Session> {
        let status = match session.status {
            SessionStatus::Active => "active",
            SessionStatus::Completed => "completed",
            SessionStatus::Evaluated => "evaluated",
        };

        let discipline = session.scenario_discipline.as_ref().map(|d| match d {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        });

        let progress_flags = serde_json::to_value(&session.progress_flags)?;
        let mission_status = serde_json::to_value(&session.mission_status)?;

        let started_at: DateTime<Utc> = session.started_at.parse()
            .context("Failed to parse started_at timestamp")?;
        let ended_at: Option<DateTime<Utc>> = session.ended_at.as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse ended_at timestamp")?;
        let last_activity_at: DateTime<Utc> = session.last_activity_at.parse()
            .context("Failed to parse last_activity_at timestamp")?;

        sqlx::query!(
            r#"
            UPDATE sessions
            SET scenario_id = $2,
                scenario_discipline = $3,
                status = $4,
                started_at = $5,
                ended_at = $6,
                last_activity_at = $7,
                user_name = $8,
                evaluation_requested = $9,
                progress_flags = $10,
                mission_status = $11
            WHERE id = $1
            "#,
            session.id,
            session.scenario_id,
            discipline,
            status,
            started_at,
            ended_at,
            last_activity_at,
            session.user_name,
            session.evaluation_requested,
            progress_flags,
            mission_status,
        )
        .execute(&self.pool)
        .await
        .context("Failed to update session")?;

        self.get(&session.id).await?
            .ok_or_else(|| anyhow::anyhow!("Session not found after update"))
    }

    pub async fn update_last_activity(&self, id: &str) -> Result<()> {
        sqlx::query!(
            "UPDATE sessions SET last_activity_at = NOW() WHERE id = $1",
            id
        )
        .execute(&self.pool)
        .await
        .context("Failed to update last_activity_at")?;

        Ok(())
    }

    pub async fn update_last_activity_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        id: &str,
    ) -> Result<()> {
        sqlx::query!(
            "UPDATE sessions SET last_activity_at = NOW() WHERE id = $1",
            id
        )
        .execute(&mut **tx)
        .await
        .context("Failed to update last_activity_at")?;

        Ok(())
    }

    pub async fn get(&self, id: &str) -> Result<Option<Session>> {
        let row = sqlx::query!(
            r#"
            SELECT
                id, scenario_id, scenario_discipline, status,
                to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as started_at,
                to_char(ended_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ended_at,
                to_char(last_activity_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_activity_at,
                user_name, evaluation_requested, progress_flags, mission_status
            FROM sessions
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch session")?;

        Ok(row.map(|r| {
            let status = match r.status.as_str() {
                "active" => SessionStatus::Active,
                "completed" => SessionStatus::Completed,
                "evaluated" => SessionStatus::Evaluated,
                _ => SessionStatus::Active,
            };

            let scenario_discipline = r.scenario_discipline.map(|d| match d.as_str() {
                "BASIC" => ScenarioDiscipline::Basic,
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            });

            let progress_flags: ProgressFlags = serde_json::from_value(r.progress_flags)
                .unwrap_or(ProgressFlags {
                    requirements: false,
                    priorities: false,
                    risks: false,
                    acceptance: false,
                });

            let mission_status: Option<Vec<MissionStatus>> = serde_json::from_value(r.mission_status)
                .ok();

            Session {
                id: r.id,
                scenario_id: r.scenario_id,
                scenario_discipline,
                status,
                started_at: r.started_at.unwrap_or_default(),
                ended_at: r.ended_at,
                last_activity_at: r.last_activity_at.unwrap_or_default(),
                user_name: r.user_name,
                progress_flags,
                evaluation_requested: r.evaluation_requested,
                mission_status,
            }
        }))
    }

    pub async fn list(&self) -> Result<Vec<Session>> {
        let rows = sqlx::query!(
            r#"
            SELECT
                id, scenario_id, scenario_discipline, status,
                to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as started_at,
                to_char(ended_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ended_at,
                to_char(last_activity_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_activity_at,
                user_name, evaluation_requested, progress_flags, mission_status
            FROM sessions
            ORDER BY last_activity_at DESC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .context("Failed to list sessions")?;

        Ok(rows.into_iter().map(|r| {
            let status = match r.status.as_str() {
                "active" => SessionStatus::Active,
                "completed" => SessionStatus::Completed,
                "evaluated" => SessionStatus::Evaluated,
                _ => SessionStatus::Active,
            };

            let scenario_discipline = r.scenario_discipline.map(|d| match d.as_str() {
                "BASIC" => ScenarioDiscipline::Basic,
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            });

            let progress_flags: ProgressFlags = serde_json::from_value(r.progress_flags)
                .unwrap_or(ProgressFlags {
                    requirements: false,
                    priorities: false,
                    risks: false,
                    acceptance: false,
                });

            let mission_status: Option<Vec<MissionStatus>> = serde_json::from_value(r.mission_status)
                .ok();

            Session {
                id: r.id,
                scenario_id: r.scenario_id,
                scenario_discipline,
                status,
                started_at: r.started_at.unwrap_or_default(),
                ended_at: r.ended_at,
                last_activity_at: r.last_activity_at.unwrap_or_default(),
                user_name: r.user_name,
                progress_flags,
                evaluation_requested: r.evaluation_requested,
                mission_status,
            }
        }).collect())
    }

    pub async fn delete(&self, id: &str) -> Result<()> {
        sqlx::query!("DELETE FROM sessions WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .context("Failed to delete session")?;

        Ok(())
    }
}
