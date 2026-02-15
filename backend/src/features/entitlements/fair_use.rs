use sqlx::{PgPool, Row};

use crate::error::{anyhow_error, too_many_requests_error, AppError};
use crate::shared::admin_override::is_admin_override_user;

use super::models::PlanCode;

#[derive(Clone, Copy)]
struct DailyFairUseLimit {
    agent_replies_per_day: i64,
    evaluations_per_day: i64,
}

fn env_i64(key: &str, default: i64) -> i64 {
    std::env::var(key)
        .ok()
        .and_then(|value| value.parse::<i64>().ok())
        .filter(|value| *value > 0)
        .unwrap_or(default)
}

fn resolve_daily_limit(plan_code: &PlanCode) -> DailyFairUseLimit {
    match plan_code {
        PlanCode::Free => DailyFairUseLimit {
            agent_replies_per_day: env_i64("FAIR_USE_FREE_AGENT_REPLIES_PER_DAY", 20),
            evaluations_per_day: env_i64("FAIR_USE_FREE_EVALUATIONS_PER_DAY", 3),
        },
        PlanCode::Team => DailyFairUseLimit {
            // Simplified v1 behavior: flat team fair-use limits (no seat-scaling math).
            agent_replies_per_day: env_i64("FAIR_USE_TEAM_AGENT_REPLIES_PER_DAY", 800),
            evaluations_per_day: env_i64("FAIR_USE_TEAM_EVALUATIONS_PER_DAY", 160),
        },
    }
}

async fn count_agent_replies_today(
    pool: &PgPool,
    scope_type: &str,
    scope_id: &str,
) -> Result<i64, AppError> {
    let sql = match scope_type {
        "organization" => {
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM messages m
            INNER JOIN sessions s ON s.id = m.session_id
            WHERE m.role = 'agent'
              AND m.created_at >= DATE_TRUNC('day', NOW())
              AND s.organization_id = $1
            "#
        }
        _ => {
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM messages m
            INNER JOIN sessions s ON s.id = m.session_id
            WHERE m.role = 'agent'
              AND m.created_at >= DATE_TRUNC('day', NOW())
              AND s.user_id = $1
            "#
        }
    };

    let row = sqlx::query(sql)
        .bind(scope_id)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow_error(format!("Failed to count agent replies: {}", e)))?;

    Ok(row.try_get::<i64, _>("count").unwrap_or(0))
}

async fn count_evaluations_today(
    pool: &PgPool,
    scope_type: &str,
    scope_id: &str,
) -> Result<i64, AppError> {
    let sql = match scope_type {
        "organization" => {
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM evaluations e
            INNER JOIN sessions s ON s.id = e.session_id
            WHERE e.created_at >= DATE_TRUNC('day', NOW())
              AND s.organization_id = $1
            "#
        }
        _ => {
            r#"
            SELECT COUNT(*)::BIGINT AS count
            FROM evaluations e
            INNER JOIN sessions s ON s.id = e.session_id
            WHERE e.created_at >= DATE_TRUNC('day', NOW())
              AND s.user_id = $1
            "#
        }
    };

    let row = sqlx::query(sql)
        .bind(scope_id)
        .fetch_one(pool)
        .await
        .map_err(|e| anyhow_error(format!("Failed to count evaluations: {}", e)))?;

    Ok(row.try_get::<i64, _>("count").unwrap_or(0))
}

fn resolve_scope<'a>(
    plan_code: &PlanCode,
    user_id: &'a str,
    organization_id: Option<&'a str>,
) -> (&'a str, &'a str) {
    if matches!(plan_code, PlanCode::Team) {
        if let Some(org_id) = organization_id {
            return ("organization", org_id);
        }
    }
    ("user", user_id)
}

pub async fn enforce_chat_daily_limit(
    pool: &PgPool,
    plan_code: &PlanCode,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(), AppError> {
    if is_admin_override_user(user_id) {
        return Ok(());
    }

    let limit = resolve_daily_limit(plan_code);

    let (scope_type, scope_id) = resolve_scope(plan_code, user_id, organization_id);
    let used = count_agent_replies_today(pool, scope_type, scope_id).await?;

    if used >= limit.agent_replies_per_day {
        return Err(too_many_requests_error(format!(
            "FAIR_USE_LIMIT_REACHED: chat daily limit reached for {}. Used: {}, Limit: {}",
            scope_type, used, limit.agent_replies_per_day
        )));
    }

    Ok(())
}

pub async fn enforce_evaluation_daily_limit(
    pool: &PgPool,
    plan_code: &PlanCode,
    user_id: &str,
    organization_id: Option<&str>,
) -> Result<(), AppError> {
    if is_admin_override_user(user_id) {
        return Ok(());
    }

    let limit = resolve_daily_limit(plan_code);

    let (scope_type, scope_id) = resolve_scope(plan_code, user_id, organization_id);
    let used = count_evaluations_today(pool, scope_type, scope_id).await?;

    if used >= limit.evaluations_per_day {
        return Err(too_many_requests_error(format!(
            "FAIR_USE_LIMIT_REACHED: evaluation daily limit reached for {}. Used: {}, Limit: {}",
            scope_type, used, limit.evaluations_per_day
        )));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{resolve_daily_limit, resolve_scope};
    use crate::features::entitlements::models::PlanCode;

    #[test]
    fn free_plan_has_fair_use_limits() {
        let limit = resolve_daily_limit(&PlanCode::Free);
        assert!(limit.agent_replies_per_day > 0);
        assert!(limit.evaluations_per_day > 0);
    }

    #[test]
    fn free_plan_fair_use_uses_env_override() {
        unsafe {
            std::env::set_var("FAIR_USE_FREE_AGENT_REPLIES_PER_DAY", "11");
            std::env::set_var("FAIR_USE_FREE_EVALUATIONS_PER_DAY", "4");
        }

        let limit = resolve_daily_limit(&PlanCode::Free);
        assert_eq!(limit.agent_replies_per_day, 11);
        assert_eq!(limit.evaluations_per_day, 4);

        unsafe {
            std::env::remove_var("FAIR_USE_FREE_AGENT_REPLIES_PER_DAY");
            std::env::remove_var("FAIR_USE_FREE_EVALUATIONS_PER_DAY");
        }
    }

    #[test]
    fn team_plan_uses_org_scope_when_org_id_present() {
        let (scope_type, scope_id) = resolve_scope(&PlanCode::Team, "user-1", Some("org-1"));
        assert_eq!(scope_type, "organization");
        assert_eq!(scope_id, "org-1");
    }

    #[test]
    fn team_plan_without_org_scope_falls_back_to_user_scope() {
        let (scope_type, scope_id) = resolve_scope(&PlanCode::Team, "user-1", None);
        assert_eq!(scope_type, "user");
        assert_eq!(scope_id, "user-1");
    }
}
