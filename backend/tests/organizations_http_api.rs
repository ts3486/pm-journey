use std::env;

use axum::{
    body::{to_bytes, Body},
    http::{Method, Request, StatusCode},
};
use backend::{api, middleware::auth::JwksKeys, state::state_with_pool};
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header};
use serde::Serialize;
use serde_json::json;
use sqlx::{migrate::Migrator, postgres::PgPoolOptions, PgPool};
use tower::util::ServiceExt;
use uuid::Uuid;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

const TEST_KID: &str = "integration-test-kid";
const TEST_AUTH0_DOMAIN: &str = "pm-journey-test.auth0.local";
const TEST_AUTH0_AUDIENCE: &str = "https://pm-journey-api.test";

const TEST_PRIVATE_KEY_PEM: &str = r#"-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCr+Hy2X/wJOWzF
1CsnPdnK06dqXTnIDeVK/c2iEvGeWlNNM0sz/K0WSpZf6v7zPKLLB9fHQkGBxLae
VohXigxVVYK+e8LsvDfiw+dYfzZrSjQgUXybtrZbe/eDLHmy1e/mc34s3J4MGIqh
+5adjXkAxSf/KN8Qy2BeWXgMBtPT4okAQZsleR8f7UTMghEAJZ2aw5YNwCueWqMI
eYKQsbsvmoCYYnP0QarCEVKvZipcJ1qFYUrzWAP4InJ4QEvPkOp87cyigonu5Yp4
zER2n+ed7mA+33f7LV7hLG7ii9wwgoQbwuM8H5mKtMv7I2zRz4/jopBH9GdtehYm
YM+1VSy3AgMBAAECggEAAk535b5N1BXYFqMs3P7gX+8MzMlpT/yXubTDwEu+v9/4
RA3PEWhvLeBcOfcd6kdC67Q0ObDyzfnEdUU12O66EZ7u/P0N9TzlBv6XqME0CqZZ
IqHVKQV/VqTIAhNjonlqGU4tQA7Jc+IUYe3M7FoMaG08hxiWPVRs+3b5vDePOcVH
X/hT0tRNXJ+Blpsos+/b2dABlARHr3zldaS4uTuMi+bTH0vnQZHH/eJiWXaTalVm
8lYO9ZW2w4DJ+9EQAszrUTCVrc9PynVFBOt0QCR1MObokMFsOOCKkP8UCmKSxAaW
xyImL5ybobJMCEcOpP+TdFCiwbsyMqlOvfDeYNhjQQKBgQDxhCLL2O/IxxIk82k9
z4/1FqvXP1OEnZbNvDl1wZ/xqcjQPJb0xE1knfMKUUGWN6z2/UUoSGWa8Jwfhz19
XD9N64A7JK9MOuiKiRd1lypg0JQZhHUvaJLsXjH/n2PF/ud3CPcnSOUU01oI0COJ
EKA/1vcD57TxC7xEjIVPGV4BIQKBgQC2SKhVzmSV2/PReMUmKk4TNKA5HtkUk6v3
gckeAV/nY6LK03yzeQto5WRnSJzlbMI+VESIH4nA67Io05UPJUlsMMPQSNJ7zeQa
926R1HoW3HfYvL+fkOy9NCfbd/vGODNtQ3RE5w54ZT7h30BGwpOonkOOBDrSvxUS
xDNdKUj61wKBgEct7V9swUbIPPW883BvIvtVwjF/DWtRUqex6LFm7m+33WJZ6Rec
Xz7fOkj5J75RDF4CyQYVSDTA4xJ7tkijDlk1piZIKo3p8q0ZuFtEwQ2li3B11F+z
j1GwdUXkQPCSrr8rWkQuvK1FmQxt43s69i+6eDSjbnV4QvVlAMkOLeFhAoGAM1u7
WhnBy1tikfVmDr/CqbSdJBrl7N9Ch4Tgxnx6qfYvqtf1fZewOEjRhiw2UInZHLif
an8AUAPYeZpLmC3YRwxiT3AFJe63w0VNuPbVw1Uwyzc7AllR6mkkhbiDjrDNBI8J
1lQHhrJ4CindsVInSk31GLFmZXSDGnt/QVNdhZcCgYBXQsjrD8BK39pKrd8esu0U
0R6ohiDlyrM6J8A273W/YwE+OJCSCmAyo6dZ1ah9PQCuD3bIC6mPQPBNvz4L+81/
cgvarTrgG44kxy3pCYCzgcRiSX0AFJlsf1fLaidFwRMBwhqCEu6Xk3OaaxzN+noi
ZwLfCjeAnDr6RYac0JZIqw==
-----END PRIVATE KEY-----"#;

const TEST_PUBLIC_KEY_PEM: &str = r#"-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAq/h8tl/8CTlsxdQrJz3Z
ytOnal05yA3lSv3NohLxnlpTTTNLM/ytFkqWX+r+8zyiywfXx0JBgcS2nlaIV4oM
VVWCvnvC7Lw34sPnWH82a0o0IFF8m7a2W3v3gyx5stXv5nN+LNyeDBiKofuWnY15
AMUn/yjfEMtgXll4DAbT0+KJAEGbJXkfH+1EzIIRACWdmsOWDcArnlqjCHmCkLG7
L5qAmGJz9EGqwhFSr2YqXCdahWFK81gD+CJyeEBLz5DqfO3MooKJ7uWKeMxEdp/n
ne5gPt93+y1e4Sxu4ovcMIKEG8LjPB+ZirTL+yNs0c+P46KQR/RnbXoWJmDPtVUs
twIDAQAB
-----END PUBLIC KEY-----"#;

#[derive(Serialize)]
struct TestClaims {
    sub: String,
    email: String,
    name: String,
    picture: String,
    iss: String,
    aud: String,
    exp: usize,
}

#[tokio::test]
async fn organization_endpoints_create_invite_accept_update_and_delete_member() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping organizations HTTP test: DATABASE_URL is not configured");
        return;
    };
    configure_auth_env();

    let owner = user_id("owner");
    let invitee = user_id("invitee");
    insert_user(&pool, &owner).await;
    insert_user(&pool, &invitee).await;

    let owner_token = jwt_for_user(&owner);
    let invitee_token = jwt_for_user(&invitee);
    let app = test_app(pool.clone());

    let create_org_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations",
            &owner_token,
            Some(json!({ "name": "Team Alpha" })),
        ))
        .await
        .expect("create organization request");
    assert_eq!(create_org_response.status(), StatusCode::CREATED);

    let current_org_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current",
            &owner_token,
            None,
        ))
        .await
        .expect("current organization request");
    assert_eq!(current_org_response.status(), StatusCode::OK);
    let current_org_body = to_bytes(current_org_response.into_body(), usize::MAX)
        .await
        .expect("current org body");
    let current_org_json: serde_json::Value =
        serde_json::from_slice(&current_org_body).expect("current org json");
    assert_eq!(current_org_json.get("activeMemberCount"), Some(&json!(1)));
    assert_eq!(
        current_org_json.get("pendingInvitationCount"),
        Some(&json!(0))
    );

    let list_members_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/members",
            &owner_token,
            None,
        ))
        .await
        .expect("members request");
    assert_eq!(list_members_response.status(), StatusCode::OK);

    let invitee_email = user_email(&invitee);
    let create_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &owner_token,
            Some(json!({ "email": invitee_email, "role": "member" })),
        ))
        .await
        .expect("create invitation request");
    assert_eq!(create_invite_response.status(), StatusCode::CREATED);
    let invite_body = to_bytes(create_invite_response.into_body(), usize::MAX)
        .await
        .expect("invite body");
    let invite_json: serde_json::Value = serde_json::from_slice(&invite_body).expect("invite json");
    let invite_token = invite_json
        .get("inviteToken")
        .and_then(|v| v.as_str())
        .expect("invite token")
        .to_string();
    assert!(invite_json
        .get("inviteLink")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("/team/onboarding?invite=")));
    assert!(invite_json
        .get("emailDelivery")
        .and_then(|v| v.get("status"))
        .and_then(|v| v.as_str())
        .is_some());

    let accept_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/organizations/current/invitations/{invite_token}/accept"),
            &invitee_token,
            None,
        ))
        .await
        .expect("accept invitation request");
    assert_eq!(accept_response.status(), StatusCode::OK);

    insert_session(
        &pool,
        &id("session-progress-active"),
        &invitee,
        current_org_json
            .get("organization")
            .and_then(|v| v.get("id"))
            .and_then(|v| v.as_str())
            .expect("organization id"),
        "active",
        json!({
            "requirements": true,
            "priorities": false,
            "risks": false,
            "acceptance": false
        }),
    )
    .await;
    insert_session(
        &pool,
        &id("session-progress-completed"),
        &invitee,
        current_org_json
            .get("organization")
            .and_then(|v| v.get("id"))
            .and_then(|v| v.as_str())
            .expect("organization id"),
        "completed",
        json!({
            "requirements": true,
            "priorities": true,
            "risks": true,
            "acceptance": false
        }),
    )
    .await;

    let progress_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/progress",
            &owner_token,
            None,
        ))
        .await
        .expect("progress request");
    assert_eq!(progress_response.status(), StatusCode::OK);
    let progress_body = to_bytes(progress_response.into_body(), usize::MAX)
        .await
        .expect("progress body");
    let progress_json: serde_json::Value =
        serde_json::from_slice(&progress_body).expect("progress json");
    let invitee_progress = progress_json
        .get("members")
        .and_then(|v| v.as_array())
        .and_then(|members| {
            members.iter().find(|member| {
                member.get("userId").and_then(|v| v.as_str()) == Some(invitee.as_str())
            })
        })
        .expect("invitee progress row");
    assert_eq!(invitee_progress.get("totalSessions"), Some(&json!(2)));
    assert_eq!(invitee_progress.get("completedSessions"), Some(&json!(1)));

    let progress_for_member_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/progress",
            &invitee_token,
            None,
        ))
        .await
        .expect("member progress request");
    assert_eq!(progress_for_member_response.status(), StatusCode::FORBIDDEN);

    let owner_members_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/members",
            &owner_token,
            None,
        ))
        .await
        .expect("owner members request");
    assert_eq!(owner_members_response.status(), StatusCode::OK);
    let owner_members_body = to_bytes(owner_members_response.into_body(), usize::MAX)
        .await
        .expect("members body");
    let owner_members_json: serde_json::Value =
        serde_json::from_slice(&owner_members_body).expect("members json");
    let invitee_member_id = owner_members_json
        .get("members")
        .and_then(|v| v.as_array())
        .and_then(|members| {
            members
                .iter()
                .find(|member| {
                    member.get("userId").and_then(|v| v.as_str()) == Some(invitee.as_str())
                })
                .and_then(|member| member.get("id"))
                .and_then(|v| v.as_str())
        })
        .expect("invitee member id")
        .to_string();

    let update_member_response = app
        .clone()
        .oneshot(build_request(
            Method::PATCH,
            &format!("/organizations/current/members/{invitee_member_id}"),
            &owner_token,
            Some(json!({ "role": "manager" })),
        ))
        .await
        .expect("update member request");
    assert_eq!(update_member_response.status(), StatusCode::OK);
    let update_member_body = to_bytes(update_member_response.into_body(), usize::MAX)
        .await
        .expect("update member body");
    let update_member_json: serde_json::Value =
        serde_json::from_slice(&update_member_body).expect("update member json");
    assert_eq!(update_member_json.get("role"), Some(&json!("manager")));

    let delete_member_response = app
        .clone()
        .oneshot(build_request(
            Method::DELETE,
            &format!("/organizations/current/members/{invitee_member_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("delete member request");
    assert_eq!(delete_member_response.status(), StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn seat_limit_is_enforced_for_invites_and_invitation_acceptance() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping organizations HTTP test: DATABASE_URL is not configured");
        return;
    };
    configure_auth_env();

    let owner = user_id("owner");
    let invitee_one = user_id("invitee-one");
    let invitee_two = user_id("invitee-two");
    insert_user(&pool, &owner).await;
    insert_user(&pool, &invitee_one).await;
    insert_user(&pool, &invitee_two).await;

    let owner_token = jwt_for_user(&owner);
    let invitee_one_token = jwt_for_user(&invitee_one);
    let invitee_two_token = jwt_for_user(&invitee_two);
    let app = test_app(pool.clone());

    let create_org_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations",
            &owner_token,
            Some(json!({ "name": "Seat Limited Team" })),
        ))
        .await
        .expect("create organization request");
    assert_eq!(create_org_response.status(), StatusCode::CREATED);
    let create_org_body = to_bytes(create_org_response.into_body(), usize::MAX)
        .await
        .expect("create org body");
    let create_org_json: serde_json::Value =
        serde_json::from_slice(&create_org_body).expect("create org json");
    let org_id = create_org_json
        .get("id")
        .and_then(|v| v.as_str())
        .expect("org id")
        .to_string();

    insert_team_subscription(&pool, &org_id, 2).await;

    let first_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &owner_token,
            Some(json!({ "email": user_email(&invitee_one), "role": "member" })),
        ))
        .await
        .expect("first invite request");
    assert_eq!(first_invite_response.status(), StatusCode::CREATED);
    let first_invite_body = to_bytes(first_invite_response.into_body(), usize::MAX)
        .await
        .expect("first invite body");
    let first_invite_json: serde_json::Value =
        serde_json::from_slice(&first_invite_body).expect("first invite json");
    let first_invite_token = first_invite_json
        .get("inviteToken")
        .and_then(|v| v.as_str())
        .expect("first invite token")
        .to_string();

    let second_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &owner_token,
            Some(json!({ "email": user_email(&invitee_two), "role": "member" })),
        ))
        .await
        .expect("second invite request");
    assert_eq!(
        second_invite_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let second_invite_body = to_bytes(second_invite_response.into_body(), usize::MAX)
        .await
        .expect("second invite body");
    let second_invite_json: serde_json::Value =
        serde_json::from_slice(&second_invite_body).expect("second invite json");
    assert!(second_invite_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_LIMIT_REACHED")));

    let accept_first_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/organizations/current/invitations/{first_invite_token}/accept"),
            &invitee_one_token,
            None,
        ))
        .await
        .expect("accept first invite request");
    assert_eq!(accept_first_invite_response.status(), StatusCode::OK);

    let manual_invite_token = id("manual-token");
    insert_pending_invitation(
        &pool,
        &org_id,
        &manual_invite_token,
        &owner,
        &user_email(&invitee_two),
    )
    .await;

    let accept_manual_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/organizations/current/invitations/{manual_invite_token}/accept"),
            &invitee_two_token,
            None,
        ))
        .await
        .expect("accept manual invite request");
    assert_eq!(
        accept_manual_invite_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let accept_manual_invite_body = to_bytes(accept_manual_invite_response.into_body(), usize::MAX)
        .await
        .expect("accept manual invite body");
    let accept_manual_invite_json: serde_json::Value =
        serde_json::from_slice(&accept_manual_invite_body).expect("accept manual invite json");
    assert!(accept_manual_invite_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_LIMIT_REACHED")));
}

#[allow(unused_unsafe)]
fn configure_auth_env() {
    unsafe {
        env::set_var("AUTH0_DOMAIN", TEST_AUTH0_DOMAIN);
        env::set_var("AUTH0_AUDIENCE", TEST_AUTH0_AUDIENCE);
    }
}

fn test_app(pool: PgPool) -> axum::Router {
    let public_key =
        DecodingKey::from_rsa_pem(TEST_PUBLIC_KEY_PEM.as_bytes()).expect("valid public key");
    let jwks = JwksKeys::from_single(TEST_KID, public_key);
    let state = state_with_pool(pool, jwks);
    api::router_with_state(state)
}

fn jwt_for_user(user_id: &str) -> String {
    let mut header = Header::new(Algorithm::RS256);
    header.kid = Some(TEST_KID.to_string());

    let claims = TestClaims {
        sub: user_id.to_string(),
        email: user_email(user_id),
        name: "Integration User".to_string(),
        picture: "https://example.com/picture.png".to_string(),
        iss: format!("https://{}/", TEST_AUTH0_DOMAIN),
        aud: TEST_AUTH0_AUDIENCE.to_string(),
        exp: (Utc::now() + Duration::hours(1)).timestamp() as usize,
    };

    let signing_key =
        EncodingKey::from_rsa_pem(TEST_PRIVATE_KEY_PEM.as_bytes()).expect("valid private key");
    jsonwebtoken::encode(&header, &claims, &signing_key).expect("sign jwt")
}

fn user_email(user_id: &str) -> String {
    format!("{user_id}@example.com")
}

fn build_request(
    method: Method,
    path: &str,
    token: &str,
    body: Option<serde_json::Value>,
) -> Request<Body> {
    let mut builder = Request::builder()
        .method(method)
        .uri(path)
        .header("Authorization", format!("Bearer {token}"));

    if body.is_some() {
        builder = builder.header("Content-Type", "application/json");
    }

    let body = body
        .map(|v| Body::from(serde_json::to_vec(&v).expect("json body")))
        .unwrap_or_else(Body::empty);

    builder.body(body).expect("build request")
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

fn id(prefix: &str) -> String {
    format!("org-http-it-{prefix}-{}", Uuid::new_v4())
}

fn user_id(prefix: &str) -> String {
    format!("auth0|org-http-it-{prefix}-{}", Uuid::new_v4())
}

async fn insert_user(pool: &PgPool, user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(user_id)
    .bind(user_email(user_id))
    .bind(format!("User {user_id}"))
    .execute(pool)
    .await
    .expect("insert user");
}

async fn insert_team_subscription(pool: &PgPool, org_id: &str, seats: i32) {
    sqlx::query(
        r#"
        INSERT INTO subscriptions (
            id, organization_id, provider, status, plan_code, seat_quantity,
            current_period_start, current_period_end, cancel_at_period_end
        )
        VALUES ($1, $2, 'manual', 'active', 'TEAM', $3, NOW(), NOW() + INTERVAL '30 days', FALSE)
        "#,
    )
    .bind(id("subscription"))
    .bind(org_id)
    .bind(seats)
    .execute(pool)
    .await
    .expect("insert team subscription");
}

async fn insert_pending_invitation(
    pool: &PgPool,
    org_id: &str,
    token: &str,
    creator_user_id: &str,
    email: &str,
) {
    sqlx::query(
        r#"
        INSERT INTO organization_invitations (
            id, organization_id, email, role, invite_token_hash, expires_at, status, created_by_user_id, created_at
        )
        VALUES ($1, $2, $3, 'member', $4, NOW() + INTERVAL '7 days', 'pending', $5, NOW())
        "#,
    )
    .bind(id("invitation"))
    .bind(org_id)
    .bind(email)
    .bind(token)
    .bind(creator_user_id)
    .execute(pool)
    .await
    .expect("insert pending invitation");
}

async fn insert_session(
    pool: &PgPool,
    session_id: &str,
    user_id: &str,
    organization_id: &str,
    status: &str,
    progress_flags: serde_json::Value,
) {
    sqlx::query(
        r#"
        INSERT INTO sessions (
            id, scenario_id, scenario_discipline, status,
            started_at, ended_at, last_activity_at, user_name,
            evaluation_requested, progress_flags, mission_status, user_id, organization_id
        )
        VALUES (
            $1, 'scenario_placeholder', 'BASIC', $2,
            NOW(), NULL, NOW(), NULL,
            FALSE, $3, '[]'::jsonb, $4, $5
        )
        "#,
    )
    .bind(session_id)
    .bind(status)
    .bind(progress_flags)
    .bind(user_id)
    .bind(organization_id)
    .execute(pool)
    .await
    .expect("insert session");
}
