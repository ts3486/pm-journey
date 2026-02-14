use std::env;
use std::sync::{Mutex, OnceLock};

use backend::features::entitlements::models::PlanCode;
use backend::features::entitlements::services::EntitlementService;
use sqlx::{migrate::Migrator, postgres::PgPoolOptions, PgPool, Row};
use uuid::Uuid;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

fn env_lock() -> &'static Mutex<()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
}

#[tokio::test]
async fn active_org_team_entitlement_resolves_team_with_org_scope() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping effective plan test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping effective plan test: database unavailable ({error})");
            return;
        }
    };

    unsafe {
        env::set_var("FF_TEAM_FEATURES_ENABLED", "true");
    }

    let user_id = user_id("team-member");
    let org_id = id("team-org");
    insert_user(&pool, &user_id).await;
    insert_organization(&pool, &org_id, &user_id).await;
    let org_entitlement_id = insert_org_team_entitlement(&pool, &org_id).await;

    let service = EntitlementService::new(pool.clone());
    let effective = service
        .resolve_effective_plan(&user_id)
        .await
        .expect("resolve effective plan");

    assert_eq!(effective.plan_code, PlanCode::Team);
    assert_eq!(effective.organization_id, Some(org_id));
    assert_eq!(effective.source_entitlement_id, org_entitlement_id);

    unsafe {
        env::remove_var("FF_TEAM_FEATURES_ENABLED");
    }
}

#[tokio::test]
async fn org_team_entitlement_downgrades_to_free_when_team_features_disabled() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping effective plan test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping effective plan test: database unavailable ({error})");
            return;
        }
    };

    unsafe {
        env::remove_var("FF_TEAM_FEATURES_ENABLED");
    }

    let user_id = user_id("team-disabled-member");
    let org_id = id("team-disabled-org");
    insert_user(&pool, &user_id).await;
    insert_organization(&pool, &org_id, &user_id).await;
    let org_entitlement_id = insert_org_team_entitlement(&pool, &org_id).await;

    let service = EntitlementService::new(pool.clone());
    let effective = service
        .resolve_effective_plan(&user_id)
        .await
        .expect("resolve effective plan");

    assert_eq!(effective.plan_code, PlanCode::Free);
    assert_eq!(effective.organization_id, None);
    assert_eq!(effective.source_entitlement_id, org_entitlement_id);
}

#[tokio::test]
async fn direct_user_entitlement_has_priority_over_org_team_entitlement() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping effective plan test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping effective plan test: database unavailable ({error})");
            return;
        }
    };

    unsafe {
        env::set_var("FF_TEAM_FEATURES_ENABLED", "true");
    }

    let user_id = user_id("direct-user-entitlement");
    let org_id = id("direct-user-org");
    insert_user(&pool, &user_id).await;
    insert_organization(&pool, &org_id, &user_id).await;
    insert_org_team_entitlement(&pool, &org_id).await;
    let user_entitlement_id = insert_user_free_entitlement(&pool, &user_id).await;

    let service = EntitlementService::new(pool.clone());
    let effective = service
        .resolve_effective_plan(&user_id)
        .await
        .expect("resolve effective plan");

    assert_eq!(effective.plan_code, PlanCode::Free);
    assert_eq!(effective.organization_id, None);
    assert_eq!(effective.source_entitlement_id, user_entitlement_id);

    unsafe {
        env::remove_var("FF_TEAM_FEATURES_ENABLED");
    }
}

#[tokio::test]
async fn no_org_entitlement_falls_back_to_free_user_plan() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping effective plan test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping effective plan test: database unavailable ({error})");
            return;
        }
    };

    unsafe {
        env::set_var("FF_TEAM_FEATURES_ENABLED", "true");
    }

    let user_id = user_id("free-fallback-member");
    let org_id = id("free-fallback-org");
    insert_user(&pool, &user_id).await;
    insert_organization(&pool, &org_id, &user_id).await;

    let service = EntitlementService::new(pool.clone());
    let effective = service
        .resolve_effective_plan(&user_id)
        .await
        .expect("resolve effective plan");

    assert_eq!(effective.plan_code, PlanCode::Free);
    assert_eq!(effective.organization_id, None);

    let row = sqlx::query(
        r#"
        SELECT COUNT(*)::BIGINT AS count
        FROM entitlements
        WHERE scope_type = 'user'
          AND scope_id = $1
          AND plan_code = 'FREE'
          AND status = 'active'
        "#,
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .expect("query free fallback entitlement");
    let free_count = row.try_get::<i64, _>("count").expect("count");
    assert_eq!(free_count, 1);

    unsafe {
        env::remove_var("FF_TEAM_FEATURES_ENABLED");
    }
}

async fn test_pool() -> Result<Option<PgPool>, String> {
    dotenvy::dotenv().ok();
    let database_url = match env::var("DATABASE_URL") {
        Ok(value) => value,
        Err(_) => return Ok(None),
    };

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|error| format!("failed to connect to database: {error}"))?;
    if let Err(error) = MIGRATOR.run(&pool).await {
        let error_text = error.to_string();
        if !error_text.contains("previously applied but has been modified") {
            return Err(format!("failed to run migrations: {error_text}"));
        }
    }

    Ok(Some(pool))
}

fn user_id(prefix: &str) -> String {
    format!("auth0|ent-plan-it-{prefix}-{}", Uuid::new_v4())
}

fn id(prefix: &str) -> String {
    format!("ent-plan-it-{prefix}-{}", Uuid::new_v4())
}

async fn insert_user(pool: &PgPool, user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(user_id)
    .bind(format!("{user_id}@example.com"))
    .bind(format!("User {user_id}"))
    .execute(pool)
    .await
    .expect("insert user");
}

async fn insert_organization(pool: &PgPool, org_id: &str, owner_user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO organizations (id, name, created_by_user_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(org_id)
    .bind(format!("Test Org {org_id}"))
    .bind(owner_user_id)
    .execute(pool)
    .await
    .expect("insert organization");

    sqlx::query(
        r#"
        INSERT INTO organization_members (
            id, organization_id, user_id, role, status, invited_by_user_id, joined_at
        )
        VALUES ($1, $2, $3, 'owner', 'active', NULL, NOW())
        "#,
    )
    .bind(id("org-member-owner"))
    .bind(org_id)
    .bind(owner_user_id)
    .execute(pool)
    .await
    .expect("insert owner organization member");
}

async fn insert_org_team_entitlement(pool: &PgPool, org_id: &str) -> String {
    let entitlement_id = id("entitlement-org-team");

    sqlx::query(
        r#"
        INSERT INTO entitlements (
            id, scope_type, scope_id, plan_code, status, valid_from, valid_until, source_subscription_id
        )
        VALUES ($1, 'organization', $2, 'TEAM', 'active', NOW(), NULL, NULL)
        "#,
    )
    .bind(&entitlement_id)
    .bind(org_id)
    .execute(pool)
    .await
    .expect("insert org team entitlement");

    entitlement_id
}

async fn insert_user_free_entitlement(pool: &PgPool, user_id: &str) -> String {
    let entitlement_id = id("entitlement-user-free");

    sqlx::query(
        r#"
        INSERT INTO entitlements (
            id, scope_type, scope_id, plan_code, status, valid_from, valid_until, source_subscription_id
        )
        VALUES ($1, 'user', $2, 'FREE', 'active', NOW(), NULL, NULL)
        "#,
    )
    .bind(&entitlement_id)
    .bind(user_id)
    .execute(pool)
    .await
    .expect("insert user free entitlement");

    entitlement_id
}
