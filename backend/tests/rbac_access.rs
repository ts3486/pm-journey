use std::env;

use axum::{http::StatusCode, response::IntoResponse};
use backend::features::comments::models::CreateCommentRequest;
use backend::features::comments::services::CommentService;
use backend::features::messages::models::CreateMessageRequest;
use backend::features::messages::services::MessageService;
use backend::features::outputs::models::CreateOutputRequest;
use backend::features::outputs::services::OutputService;
use backend::features::sessions::services::SessionService;
use backend::models::{MessageRole, OutputKind};
use sqlx::{migrate::Migrator, postgres::PgPoolOptions, PgPool};
use uuid::Uuid;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

#[tokio::test]
async fn cross_org_isolation_blocks_access_to_shared_resources() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping RBAC integration test: DATABASE_URL is not configured");
        return;
    };

    let owner_a = user_id("owner-a");
    let outsider_b = user_id("outsider-b");
    insert_user(&pool, &owner_a).await;
    insert_user(&pool, &outsider_b).await;

    let org_a = id("org-a");
    let org_b = id("org-b");
    insert_org(&pool, &org_a, &owner_a).await;
    insert_org(&pool, &org_b, &outsider_b).await;
    insert_member(&pool, &org_a, &owner_a, "owner", &owner_a).await;
    insert_member(&pool, &org_b, &outsider_b, "owner", &outsider_b).await;

    let session_id = id("session");
    insert_session(&pool, &session_id, &owner_a, Some(&org_a)).await;
    insert_message(&pool, &session_id).await;
    insert_comment(&pool, &session_id, &owner_a).await;
    insert_output(&pool, &session_id, &owner_a).await;

    let session_service = SessionService::new(pool.clone());
    let message_service = MessageService::new(pool.clone());
    let comment_service = CommentService::new(pool.clone());
    let output_service = OutputService::new(pool.clone());

    assert_status(
        session_service
            .get_session(&session_id, &outsider_b)
            .await
            .unwrap_err(),
        StatusCode::NOT_FOUND,
    );
    assert_status(
        message_service
            .list_messages(&session_id, &outsider_b)
            .await
            .unwrap_err(),
        StatusCode::NOT_FOUND,
    );
    assert_status(
        comment_service
            .list_comments(&session_id, &outsider_b)
            .await
            .unwrap_err(),
        StatusCode::NOT_FOUND,
    );
    assert_status(
        output_service
            .list_outputs(&session_id, &outsider_b)
            .await
            .unwrap_err(),
        StatusCode::NOT_FOUND,
    );
}

#[tokio::test]
async fn role_matrix_enforces_permissions_for_messages_comments_and_outputs() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping RBAC integration test: DATABASE_URL is not configured");
        return;
    };

    let learner = user_id("learner");
    let admin = user_id("admin");
    let manager = user_id("manager");
    let member = user_id("member");
    for user_id in [&learner, &admin, &manager, &member] {
        insert_user(&pool, user_id).await;
    }

    let org_id = id("org");
    insert_org(&pool, &org_id, &learner).await;
    insert_member(&pool, &org_id, &learner, "owner", &learner).await;
    insert_member(&pool, &org_id, &admin, "admin", &learner).await;
    insert_member(&pool, &org_id, &manager, "manager", &learner).await;
    insert_member(&pool, &org_id, &member, "member", &learner).await;

    let session_id = id("session");
    insert_session(&pool, &session_id, &learner, Some(&org_id)).await;
    insert_message(&pool, &session_id).await;

    let session_service = SessionService::new(pool.clone());
    let message_service = MessageService::new(pool.clone());
    let comment_service = CommentService::new(pool.clone());
    let output_service = OutputService::new(pool.clone());

    assert!(session_service
        .get_session(&session_id, &admin)
        .await
        .is_ok());
    assert!(session_service
        .get_session(&session_id, &manager)
        .await
        .is_ok());
    assert_status(
        session_service
            .get_session(&session_id, &member)
            .await
            .unwrap_err(),
        StatusCode::FORBIDDEN,
    );

    assert!(message_service
        .list_messages(&session_id, &admin)
        .await
        .is_ok());
    assert!(message_service
        .post_message(
            &session_id,
            &learner,
            CreateMessageRequest {
                role: MessageRole::Agent,
                content: "owner update".to_string(),
                tags: None,
                mission_status: None,
                agent_context: None,
            },
        )
        .await
        .is_ok());
    let admin_post_error = message_service
        .post_message(
            &session_id,
            &admin,
            CreateMessageRequest {
                role: MessageRole::Agent,
                content: "admin update".to_string(),
                tags: None,
                mission_status: None,
                agent_context: None,
            },
        )
        .await
        .err()
        .expect("admin message post should be forbidden");
    assert_status(admin_post_error, StatusCode::FORBIDDEN);
    assert_status(
        message_service
            .list_messages(&session_id, &member)
            .await
            .unwrap_err(),
        StatusCode::FORBIDDEN,
    );

    let admin_comment = comment_service
        .create_comment(
            &session_id,
            &admin,
            CreateCommentRequest {
                author_name: Some("Admin".to_string()),
                content: "admin note".to_string(),
            },
        )
        .await
        .expect("admin should be able to comment");
    assert_eq!(admin_comment.author_role.as_deref(), Some("owner"));

    let manager_comment = comment_service
        .create_comment(
            &session_id,
            &manager,
            CreateCommentRequest {
                author_name: Some("Manager".to_string()),
                content: "manager note".to_string(),
            },
        )
        .await
        .expect("manager should be able to comment");
    assert_eq!(manager_comment.author_role.as_deref(), Some("manager"));

    assert_status(
        comment_service
            .create_comment(
                &session_id,
                &member,
                CreateCommentRequest {
                    author_name: Some("Member".to_string()),
                    content: "member note".to_string(),
                },
            )
            .await
            .unwrap_err(),
        StatusCode::FORBIDDEN,
    );

    assert!(output_service
        .create_output(
            &session_id,
            &admin,
            CreateOutputRequest {
                kind: OutputKind::Text,
                value: "Admin output".to_string(),
                note: Some("shared output".to_string()),
            },
        )
        .await
        .is_ok());
    assert!(output_service
        .list_outputs(&session_id, &manager)
        .await
        .is_ok());
    assert_status(
        output_service
            .create_output(
                &session_id,
                &member,
                CreateOutputRequest {
                    kind: OutputKind::Text,
                    value: "Member output".to_string(),
                    note: None,
                },
            )
            .await
            .unwrap_err(),
        StatusCode::FORBIDDEN,
    );
    assert_status(
        output_service
            .list_outputs(&session_id, &member)
            .await
            .unwrap_err(),
        StatusCode::FORBIDDEN,
    );
}

async fn test_pool() -> Option<PgPool> {
    dotenvy::dotenv().ok();
    let database_url = env::var("DATABASE_URL").ok()?;

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .ok()?;
    MIGRATOR.run(&pool).await.ok()?;
    Some(pool)
}

fn assert_status(error: backend::error::AppError, expected: StatusCode) {
    let actual = error.into_response().status();
    assert_eq!(actual, expected);
}

fn id(prefix: &str) -> String {
    format!("it-{prefix}-{}", Uuid::new_v4())
}

fn user_id(prefix: &str) -> String {
    format!("auth0|it-{prefix}-{}", Uuid::new_v4())
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

async fn insert_org(pool: &PgPool, org_id: &str, created_by_user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO organizations (id, name, created_by_user_id)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(org_id)
    .bind(format!("Org {org_id}"))
    .bind(created_by_user_id)
    .execute(pool)
    .await
    .expect("insert organization");
}

async fn insert_member(
    pool: &PgPool,
    org_id: &str,
    user_id: &str,
    role: &str,
    invited_by_user_id: &str,
) {
    sqlx::query(
        r#"
        INSERT INTO organization_members (
            id, organization_id, user_id, role, status, invited_by_user_id, joined_at
        )
        VALUES ($1, $2, $3, $4, 'active', $5, NOW())
        "#,
    )
    .bind(id("member"))
    .bind(org_id)
    .bind(user_id)
    .bind(role)
    .bind(invited_by_user_id)
    .execute(pool)
    .await
    .expect("insert organization member");
}

async fn insert_session(pool: &PgPool, session_id: &str, user_id: &str, org_id: Option<&str>) {
    sqlx::query(
        r#"
        INSERT INTO sessions (
            id, scenario_id, scenario_discipline, status, started_at, last_activity_at, user_id, organization_id
        )
        VALUES ($1, 'basic-intro-alignment', 'BASIC', 'active', NOW(), NOW(), $2, $3)
        "#,
    )
    .bind(session_id)
    .bind(user_id)
    .bind(org_id)
    .execute(pool)
    .await
    .expect("insert session");
}

async fn insert_message(pool: &PgPool, session_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO messages (id, session_id, role, content, created_at)
        VALUES ($1, $2, 'user', 'initial message', NOW())
        "#,
    )
    .bind(id("message"))
    .bind(session_id)
    .execute(pool)
    .await
    .expect("insert message");
}

async fn insert_comment(pool: &PgPool, session_id: &str, author_user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO comments (
            id, session_id, author_name, author_user_id, author_role, content, created_at
        )
        VALUES ($1, $2, 'Owner', $3, 'self', 'initial comment', NOW())
        "#,
    )
    .bind(id("comment"))
    .bind(session_id)
    .bind(author_user_id)
    .execute(pool)
    .await
    .expect("insert comment");
}

async fn insert_output(pool: &PgPool, session_id: &str, created_by_user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO outputs (
            id, session_id, kind, value, note, created_by_user_id, created_at
        )
        VALUES ($1, $2, 'text', 'initial output', NULL, $3, NOW())
        "#,
    )
    .bind(id("output"))
    .bind(session_id)
    .bind(created_by_user_id)
    .execute(pool)
    .await
    .expect("insert output");
}
