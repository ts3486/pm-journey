use crate::models::{MissionStatus, ProgressFlags, ScenarioDiscipline, Session, SessionStatus};
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use sqlx::{postgres::PgRow, PgPool, Postgres, Row, Transaction};

#[derive(Clone)]
pub struct SessionRepository {
    pool: PgPool,
}

impl SessionRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn create(&self, session: &Session, user_id: &str) -> Result<Session> {
        let mut tx = self.pool.begin().await?;
        self.create_in_tx(&mut tx, session, user_id).await?;
        tx.commit().await?;

        self.get_for_user(&session.id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Failed to retrieve created session"))
    }

    pub async fn create_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        session: &Session,
        user_id: &str,
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

        let started_at: DateTime<Utc> = session
            .started_at
            .parse()
            .context("Failed to parse started_at timestamp")?;
        let ended_at: Option<DateTime<Utc>> = session
            .ended_at
            .as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse ended_at timestamp")?;
        let last_activity_at: DateTime<Utc> = session
            .last_activity_at
            .parse()
            .context("Failed to parse last_activity_at timestamp")?;

        sqlx::query(
            r#"
            INSERT INTO sessions (
                id, scenario_id, scenario_discipline, status,
                started_at, ended_at, last_activity_at, user_name,
                evaluation_requested, progress_flags, mission_status, user_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
        )
        .bind(&session.id)
        .bind(&session.scenario_id)
        .bind(discipline)
        .bind(status)
        .bind(started_at)
        .bind(ended_at)
        .bind(last_activity_at)
        .bind(&session.user_name)
        .bind(session.evaluation_requested)
        .bind(&progress_flags)
        .bind(&mission_status)
        .bind(user_id)
        .execute(&mut **tx)
        .await
        .context("Failed to insert session")?;

        Ok(())
    }

    #[allow(dead_code)]
    pub async fn update(&self, session: &Session, user_id: &str) -> Result<Session> {
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

        let started_at: DateTime<Utc> = session
            .started_at
            .parse()
            .context("Failed to parse started_at timestamp")?;
        let ended_at: Option<DateTime<Utc>> = session
            .ended_at
            .as_ref()
            .map(|s| s.parse())
            .transpose()
            .context("Failed to parse ended_at timestamp")?;
        let last_activity_at: DateTime<Utc> = session
            .last_activity_at
            .parse()
            .context("Failed to parse last_activity_at timestamp")?;

        sqlx::query(
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
            WHERE id = $1 AND user_id = $12
            "#,
        )
        .bind(&session.id)
        .bind(&session.scenario_id)
        .bind(discipline)
        .bind(status)
        .bind(started_at)
        .bind(ended_at)
        .bind(last_activity_at)
        .bind(&session.user_name)
        .bind(session.evaluation_requested)
        .bind(progress_flags)
        .bind(mission_status)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .context("Failed to update session")?;

        self.get_for_user(&session.id, user_id)
            .await?
            .ok_or_else(|| anyhow::anyhow!("Session not found after update"))
    }

    #[allow(dead_code)]
    pub async fn update_last_activity(&self, id: &str, user_id: &str) -> Result<()> {
        sqlx::query("UPDATE sessions SET last_activity_at = NOW() WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
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

    pub async fn update_mission_status_in_tx(
        &self,
        tx: &mut Transaction<'_, Postgres>,
        id: &str,
        mission_status: &Option<Vec<MissionStatus>>,
    ) -> Result<()> {
        let mission_status_value = serde_json::to_value(mission_status)?;
        sqlx::query("UPDATE sessions SET mission_status = $2 WHERE id = $1")
            .bind(id)
            .bind(mission_status_value)
        .execute(&mut **tx)
        .await
        .context("Failed to update mission_status")?;

        Ok(())
    }

    fn map_row(r: PgRow) -> Session {
        let status = match r.get::<String, _>("status").as_str() {
            "active" => SessionStatus::Active,
            "completed" => SessionStatus::Completed,
            "evaluated" => SessionStatus::Evaluated,
            _ => SessionStatus::Active,
        };

        let scenario_discipline = r
            .try_get::<Option<String>, _>("scenario_discipline")
            .unwrap_or(None)
            .map(|d| match d.as_str() {
                "BASIC" => ScenarioDiscipline::Basic,
                "CHALLENGE" => ScenarioDiscipline::Challenge,
                _ => ScenarioDiscipline::Basic,
            });

        let progress_flags: ProgressFlags = r
            .try_get::<serde_json::Value, _>("progress_flags")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok())
            .unwrap_or(ProgressFlags {
                requirements: false,
                priorities: false,
                risks: false,
                acceptance: false,
            });

        let mission_status: Option<Vec<MissionStatus>> = r
            .try_get::<serde_json::Value, _>("mission_status")
            .ok()
            .and_then(|v| serde_json::from_value(v).ok());

        Session {
            id: r.get("id"),
            scenario_id: r.get("scenario_id"),
            scenario_discipline,
            status,
            started_at: r
                .try_get::<Option<String>, _>("started_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            ended_at: r.try_get::<Option<String>, _>("ended_at").unwrap_or(None),
            last_activity_at: r
                .try_get::<Option<String>, _>("last_activity_at")
                .unwrap_or(None)
                .unwrap_or_default(),
            user_name: r.try_get::<Option<String>, _>("user_name").unwrap_or(None),
            progress_flags,
            evaluation_requested: r.get("evaluation_requested"),
            mission_status,
        }
    }

    pub async fn get_for_user(&self, id: &str, user_id: &str) -> Result<Option<Session>> {
        let row = sqlx::query(
            r#"
            SELECT
                id, scenario_id, scenario_discipline, status,
                to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as started_at,
                to_char(ended_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ended_at,
                to_char(last_activity_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_activity_at,
                user_name, evaluation_requested, progress_flags, mission_status
            FROM sessions
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .context("Failed to fetch session")?;

        Ok(row.map(Self::map_row))
    }

    pub async fn list_for_user(&self, user_id: &str) -> Result<Vec<Session>> {
        let rows = sqlx::query(
            r#"
            SELECT
                id, scenario_id, scenario_discipline, status,
                to_char(started_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as started_at,
                to_char(ended_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as ended_at,
                to_char(last_activity_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as last_activity_at,
                user_name, evaluation_requested, progress_flags, mission_status
            FROM sessions
            WHERE user_id = $1
            ORDER BY last_activity_at DESC
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .context("Failed to list sessions")?;

        Ok(rows.into_iter().map(Self::map_row).collect())
    }

    pub async fn delete_for_user(&self, id: &str, user_id: &str) -> Result<bool> {
        let result = sqlx::query("DELETE FROM sessions WHERE id = $1 AND user_id = $2")
            .bind(id)
            .bind(user_id)
            .execute(&self.pool)
            .await
            .context("Failed to delete session")?;

        Ok(result.rows_affected() > 0)
    }
}
