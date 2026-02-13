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
async fn individual_checkout_endpoint_behaviors() {
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping billing checkout HTTP test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping billing checkout HTTP test: database unavailable ({error})");
            return;
        }
    };
    configure_auth_env();

    let free_user = user_id("billing-free");
    let paid_user = user_id("billing-paid");
    insert_user(&pool, &free_user).await;
    insert_user(&pool, &paid_user).await;
    insert_individual_entitlement(&pool, &paid_user).await;

    let free_token = jwt_for_user(&free_user);
    let paid_token = jwt_for_user(&paid_user);
    let app = test_app(pool);

    unsafe {
        env::remove_var("FF_BILLING_ENABLED");
        env::remove_var("BILLING_PROVIDER");
        env::remove_var("BILLING_MOCK_CHECKOUT_BASE_URL");
    }

    let disabled_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &free_token,
            Some(json!({})),
        ))
        .await
        .expect("disabled billing request");
    assert_eq!(disabled_response.status(), StatusCode::SERVICE_UNAVAILABLE);
    let disabled_body = to_bytes(disabled_response.into_body(), usize::MAX)
        .await
        .expect("disabled response body");
    let disabled_json: serde_json::Value =
        serde_json::from_slice(&disabled_body).expect("disabled response json");
    assert!(disabled_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("BILLING_DISABLED")));

    unsafe {
        env::set_var("FF_BILLING_ENABLED", "true");
        env::set_var("BILLING_PROVIDER", "mock");
        env::set_var(
            "BILLING_MOCK_CHECKOUT_BASE_URL",
            "https://mock-billing.example/checkout",
        );
    }

    let free_checkout_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &free_token,
            Some(json!({
                "successUrl": "https://app.example/success",
                "cancelUrl": "https://app.example/cancel"
            })),
        ))
        .await
        .expect("free checkout request");
    assert_eq!(free_checkout_response.status(), StatusCode::OK);
    let free_checkout_body = to_bytes(free_checkout_response.into_body(), usize::MAX)
        .await
        .expect("free checkout body");
    let free_checkout_json: serde_json::Value =
        serde_json::from_slice(&free_checkout_body).expect("free checkout json");
    assert_eq!(free_checkout_json.get("mode"), Some(&json!("mock")));
    assert_eq!(
        free_checkout_json.get("alreadyEntitled"),
        Some(&json!(false))
    );
    let checkout_url = free_checkout_json
        .get("checkoutUrl")
        .and_then(|v| v.as_str())
        .expect("checkout url should be present");
    assert!(checkout_url.starts_with("https://mock-billing.example/checkout?"));
    assert!(checkout_url.contains("plan=INDIVIDUAL"));
    assert!(checkout_url.contains(&format!("userId={}", free_user)));
    assert!(checkout_url.contains("successUrl=https://app.example/success"));
    assert!(checkout_url.contains("cancelUrl=https://app.example/cancel"));

    let paid_checkout_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &paid_token,
            Some(json!({})),
        ))
        .await
        .expect("paid checkout request");
    assert_eq!(paid_checkout_response.status(), StatusCode::OK);
    let paid_checkout_body = to_bytes(paid_checkout_response.into_body(), usize::MAX)
        .await
        .expect("paid checkout body");
    let paid_checkout_json: serde_json::Value =
        serde_json::from_slice(&paid_checkout_body).expect("paid checkout json");
    assert_eq!(paid_checkout_json.get("mode"), Some(&json!("none")));
    assert_eq!(
        paid_checkout_json.get("alreadyEntitled"),
        Some(&json!(true))
    );
    assert_eq!(
        paid_checkout_json.get("checkoutUrl"),
        Some(&serde_json::Value::Null)
    );

    unsafe {
        env::set_var("BILLING_PROVIDER", "invalid-provider");
    }
    let invalid_provider_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &free_token,
            Some(json!({})),
        ))
        .await
        .expect("invalid provider request");
    assert_eq!(
        invalid_provider_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let invalid_provider_body = to_bytes(invalid_provider_response.into_body(), usize::MAX)
        .await
        .expect("invalid provider body");
    let invalid_provider_json: serde_json::Value =
        serde_json::from_slice(&invalid_provider_body).expect("invalid provider json");
    assert!(invalid_provider_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("BILLING_PROVIDER_INVALID")));

    unsafe {
        env::set_var("BILLING_PROVIDER", "stripe");
        env::remove_var("STRIPE_SECRET_KEY");
        env::remove_var("STRIPE_PRICE_ID_INDIVIDUAL");
    }
    let stripe_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &free_token,
            Some(json!({})),
        ))
        .await
        .expect("stripe provider request");
    assert_eq!(stripe_response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let stripe_body = to_bytes(stripe_response.into_body(), usize::MAX)
        .await
        .expect("stripe provider body");
    let stripe_json: serde_json::Value =
        serde_json::from_slice(&stripe_body).expect("stripe provider json");
    assert!(stripe_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("STRIPE_CONFIG_MISSING")));

    unsafe {
        env::set_var("BILLING_PROVIDER", "mock");
    }
    let portal_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/portal/session",
            &free_token,
            Some(json!({})),
        ))
        .await
        .expect("portal session request");
    assert_eq!(portal_response.status(), StatusCode::UNPROCESSABLE_ENTITY);
    let portal_body = to_bytes(portal_response.into_body(), usize::MAX)
        .await
        .expect("portal session body");
    let portal_json: serde_json::Value =
        serde_json::from_slice(&portal_body).expect("portal session json");
    assert!(portal_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("BILLING_PORTAL_UNAVAILABLE")));

    unsafe {
        env::remove_var("FF_BILLING_ENABLED");
        env::remove_var("BILLING_PROVIDER");
        env::remove_var("BILLING_MOCK_CHECKOUT_BASE_URL");
        env::remove_var("STRIPE_SECRET_KEY");
        env::remove_var("STRIPE_PRICE_ID_INDIVIDUAL");
    }
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
        email: format!("{user_id}@example.com"),
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
    format!("auth0|billing-http-it-{prefix}-{}", Uuid::new_v4())
}

fn id(prefix: &str) -> String {
    format!("billing-http-it-{prefix}-{}", Uuid::new_v4())
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

async fn insert_individual_entitlement(pool: &PgPool, user_id: &str) {
    sqlx::query(
        r#"
        INSERT INTO entitlements (
            id, scope_type, scope_id, plan_code, status, valid_from, valid_until, source_subscription_id
        )
        VALUES ($1, 'user', $2, 'INDIVIDUAL', 'active', NOW(), NULL, NULL)
        "#,
    )
    .bind(id("entitlement"))
    .bind(user_id)
    .execute(pool)
    .await
    .expect("insert entitlement");
}
