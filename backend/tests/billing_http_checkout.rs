use std::env;
use std::sync::{Mutex, OnceLock};

use axum::{
    body::{to_bytes, Body},
    http::{Method, Request, StatusCode},
};
use backend::{api, middleware::auth::JwksKeys, state::state_with_pool};
use chrono::{Duration, Utc};
use hmac::{Hmac, Mac};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header};
use serde::Serialize;
use serde_json::json;
use sha2::Sha256;
use sqlx::{migrate::Migrator, postgres::PgPoolOptions, PgPool, Row};
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

type HmacSha256 = Hmac<Sha256>;

fn env_lock() -> &'static Mutex<()> {
    static LOCK: OnceLock<Mutex<()>> = OnceLock::new();
    LOCK.get_or_init(|| Mutex::new(()))
}

#[tokio::test]
async fn team_checkout_endpoint_behaviors() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
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

    let owner_user = user_id("billing-team-owner");
    let manager_user = user_id("billing-team-manager");
    let member_user = user_id("billing-team-member");
    let org_id = id("org");
    insert_user(&pool, &owner_user).await;
    insert_user(&pool, &manager_user).await;
    insert_user(&pool, &member_user).await;
    insert_organization(&pool, &org_id, &owner_user).await;
    insert_org_member(&pool, &org_id, &manager_user, "manager").await;
    insert_org_member(&pool, &org_id, &member_user, "member").await;
    let manager_token = jwt_for_user(&manager_user);
    let member_token = jwt_for_user(&member_user);
    let app = test_app(pool.clone());

    unsafe {
        env::remove_var("FF_BILLING_ENABLED");
        env::remove_var("BILLING_PROVIDER");
        env::remove_var("BILLING_MOCK_CHECKOUT_BASE_URL");
    }

    let disabled_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4
            })),
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

    let team_forbidden_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &member_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4
            })),
        ))
        .await
        .expect("team checkout forbidden");
    assert_eq!(team_forbidden_response.status(), StatusCode::FORBIDDEN);
    let team_forbidden_body = to_bytes(team_forbidden_response.into_body(), usize::MAX)
        .await
        .expect("team forbidden body");
    let team_forbidden_json: serde_json::Value =
        serde_json::from_slice(&team_forbidden_body).expect("team forbidden json");
    assert!(team_forbidden_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("FORBIDDEN_ROLE")));

    let team_invalid_seats_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 0
            })),
        ))
        .await
        .expect("team checkout invalid seats");
    assert_eq!(
        team_invalid_seats_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let team_invalid_seats_body = to_bytes(team_invalid_seats_response.into_body(), usize::MAX)
        .await
        .expect("team invalid seats body");
    let team_invalid_seats_json: serde_json::Value =
        serde_json::from_slice(&team_invalid_seats_body).expect("team invalid seats json");
    assert!(team_invalid_seats_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_QUANTITY_INVALID")));

    let team_too_many_seats_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 11
            })),
        ))
        .await
        .expect("team checkout too many seats");
    assert_eq!(
        team_too_many_seats_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let team_too_many_seats_body = to_bytes(team_too_many_seats_response.into_body(), usize::MAX)
        .await
        .expect("team too many seats body");
    let team_too_many_seats_json: serde_json::Value =
        serde_json::from_slice(&team_too_many_seats_body).expect("team too many seats json");
    assert!(team_too_many_seats_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_QUANTITY_INVALID")));

    let team_checkout_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4,
                "successUrl": "https://app.example/success",
                "cancelUrl": "https://app.example/cancel"
            })),
        ))
        .await
        .expect("team checkout request");
    assert_eq!(team_checkout_response.status(), StatusCode::OK);
    let team_checkout_body = to_bytes(team_checkout_response.into_body(), usize::MAX)
        .await
        .expect("team checkout body");
    let team_checkout_json: serde_json::Value =
        serde_json::from_slice(&team_checkout_body).expect("team checkout json");
    assert_eq!(team_checkout_json.get("mode"), Some(&json!("mock")));
    assert_eq!(
        team_checkout_json.get("alreadyEntitled"),
        Some(&json!(false))
    );
    let team_checkout_url = team_checkout_json
        .get("checkoutUrl")
        .and_then(|v| v.as_str())
        .expect("team checkout url should be present");
    assert!(team_checkout_url.contains("plan=TEAM"));
    assert!(team_checkout_url.contains(&format!("organizationId={org_id}")));
    assert!(team_checkout_url.contains("seatQuantity=4"));
    assert!(team_checkout_url.contains(&format!("userId={manager_user}")));

    unsafe {
        env::set_var("BILLING_PROVIDER", "invalid-provider");
    }
    let invalid_provider_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4
            })),
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
        env::remove_var("STRIPE_PRICE_ID_TEAM");
    }
    let stripe_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4
            })),
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

    insert_active_team_subscription(&pool, &org_id, 4).await;

    let team_already_entitled_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/team",
            &manager_token,
            Some(json!({
                "organizationId": org_id.clone(),
                "seatQuantity": 4
            })),
        ))
        .await
        .expect("team already entitled request");
    assert_eq!(team_already_entitled_response.status(), StatusCode::OK);
    let team_already_entitled_body =
        to_bytes(team_already_entitled_response.into_body(), usize::MAX)
            .await
            .expect("team already entitled body");
    let team_already_entitled_json: serde_json::Value =
        serde_json::from_slice(&team_already_entitled_body).expect("team already entitled json");
    assert_eq!(team_already_entitled_json.get("mode"), Some(&json!("none")));
    assert_eq!(
        team_already_entitled_json.get("alreadyEntitled"),
        Some(&json!(true))
    );
    assert_eq!(
        team_already_entitled_json.get("checkoutUrl"),
        Some(&serde_json::Value::Null)
    );

    unsafe {
        env::set_var("BILLING_PROVIDER", "mock");
    }
    let portal_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/portal/session",
            &manager_token,
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
        env::remove_var("STRIPE_PRICE_ID_TEAM");
    }
}

#[tokio::test]
async fn team_webhook_syncs_org_subscription_and_entitlement() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping team webhook test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping team webhook test: database unavailable ({error})");
            return;
        }
    };
    configure_auth_env();

    let owner_user = user_id("billing-webhook-owner");
    let org_id = id("billing-webhook-org");
    insert_user(&pool, &owner_user).await;
    insert_organization(&pool, &org_id, &owner_user).await;

    let customer_id = format!("cus_{}", Uuid::new_v4().simple());
    let provider_subscription_id = format!("sub_{}", Uuid::new_v4().simple());
    let webhook_secret = format!("whsec_{}", Uuid::new_v4().simple());
    let app = test_app(pool.clone());

    unsafe {
        env::set_var("FF_BILLING_ENABLED", "true");
        env::set_var("BILLING_PROVIDER", "stripe");
        env::set_var("STRIPE_WEBHOOK_SECRET", &webhook_secret);
    }

    let checkout_event = json!({
        "id": id("evt-checkout-completed"),
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "subscription",
                "subscription": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "5",
                    "user_id": owner_user.clone()
                }
            }
        }
    });
    let checkout_response = post_signed_stripe_webhook(&app, &webhook_secret, checkout_event).await;
    let checkout_status = checkout_response.status();
    if checkout_status != StatusCode::OK {
        let checkout_body = to_bytes(checkout_response.into_body(), usize::MAX)
            .await
            .expect("read checkout webhook error body");
        panic!(
            "checkout webhook should succeed, status={}, body={}",
            checkout_status,
            String::from_utf8_lossy(&checkout_body)
        );
    }

    let created_subscription_row = sqlx::query(
        r#"
        SELECT id, organization_id, user_id, plan_code, seat_quantity, status
        FROM subscriptions
        WHERE provider = 'stripe' AND provider_subscription_id = $1
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(&provider_subscription_id)
    .fetch_one(&pool)
    .await
    .expect("subscription created from checkout event");
    let subscription_row_id = created_subscription_row
        .try_get::<String, _>("id")
        .expect("subscription id");
    assert_eq!(
        created_subscription_row
            .try_get::<Option<String>, _>("organization_id")
            .expect("organization_id"),
        Some(org_id.clone())
    );
    assert_eq!(
        created_subscription_row
            .try_get::<Option<String>, _>("user_id")
            .expect("user_id"),
        None
    );
    assert_eq!(
        created_subscription_row
            .try_get::<String, _>("plan_code")
            .expect("plan_code"),
        "TEAM"
    );
    assert_eq!(
        created_subscription_row
            .try_get::<Option<i32>, _>("seat_quantity")
            .expect("seat_quantity"),
        Some(5)
    );
    assert_eq!(
        created_subscription_row
            .try_get::<String, _>("status")
            .expect("status"),
        "active"
    );

    let customer_mapping_row = sqlx::query(
        r#"
        SELECT organization_id
        FROM billing_customers
        WHERE provider = 'stripe' AND provider_customer_id = $1
        LIMIT 1
        "#,
    )
    .bind(&customer_id)
    .fetch_one(&pool)
    .await
    .expect("organization billing customer mapping should be created");
    assert_eq!(
        customer_mapping_row
            .try_get::<Option<String>, _>("organization_id")
            .expect("organization_id"),
        Some(org_id.clone())
    );

    let active_org_entitlement = sqlx::query(
        r#"
        SELECT id, status
        FROM entitlements
        WHERE scope_type = 'organization'
          AND scope_id = $1
          AND source_subscription_id = $2
          AND plan_code = 'TEAM'
          AND status = 'active'
        LIMIT 1
        "#,
    )
    .bind(&org_id)
    .bind(&subscription_row_id)
    .fetch_optional(&pool)
    .await
    .expect("query active org entitlement");
    assert!(
        active_org_entitlement.is_some(),
        "team entitlement should be active after checkout.session.completed"
    );

    let subscription_updated_event = json!({
        "id": id("evt-sub-updated"),
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "status": "active",
                "current_period_start": Utc::now().timestamp(),
                "current_period_end": (Utc::now() + Duration::days(30)).timestamp(),
                "cancel_at_period_end": false,
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "7"
                },
                "items": {
                    "data": [
                        { "quantity": 7 }
                    ]
                }
            }
        }
    });
    let updated_response =
        post_signed_stripe_webhook(&app, &webhook_secret, subscription_updated_event).await;
    assert_eq!(updated_response.status(), StatusCode::OK);

    let updated_subscription_row = sqlx::query(
        r#"
        SELECT seat_quantity, status
        FROM subscriptions
        WHERE id = $1
        LIMIT 1
        "#,
    )
    .bind(&subscription_row_id)
    .fetch_one(&pool)
    .await
    .expect("subscription should be updated");
    assert_eq!(
        updated_subscription_row
            .try_get::<Option<i32>, _>("seat_quantity")
            .expect("seat_quantity"),
        Some(7)
    );
    assert_eq!(
        updated_subscription_row
            .try_get::<String, _>("status")
            .expect("status"),
        "active"
    );

    let subscription_deleted_event = json!({
        "id": id("evt-sub-deleted"),
        "type": "customer.subscription.deleted",
        "data": {
            "object": {
                "id": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "status": "canceled",
                "current_period_start": Utc::now().timestamp(),
                "current_period_end": (Utc::now() + Duration::days(30)).timestamp(),
                "cancel_at_period_end": true,
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "7"
                },
                "items": {
                    "data": [
                        { "quantity": 7 }
                    ]
                }
            }
        }
    });
    let deleted_response =
        post_signed_stripe_webhook(&app, &webhook_secret, subscription_deleted_event).await;
    assert_eq!(deleted_response.status(), StatusCode::OK);

    let active_entitlement_after_delete = sqlx::query(
        r#"
        SELECT 1
        FROM entitlements
        WHERE scope_type = 'organization'
          AND scope_id = $1
          AND source_subscription_id = $2
          AND plan_code = 'TEAM'
          AND status = 'active'
        LIMIT 1
        "#,
    )
    .bind(&org_id)
    .bind(&subscription_row_id)
    .fetch_optional(&pool)
    .await
    .expect("query active entitlement after delete");
    assert!(
        active_entitlement_after_delete.is_none(),
        "organization entitlement should no longer be active after cancellation"
    );

    let revoked_entitlement_after_delete = sqlx::query(
        r#"
        SELECT 1
        FROM entitlements
        WHERE scope_type = 'organization'
          AND scope_id = $1
          AND source_subscription_id = $2
          AND plan_code = 'TEAM'
          AND status = 'revoked'
        LIMIT 1
        "#,
    )
    .bind(&org_id)
    .bind(&subscription_row_id)
    .fetch_optional(&pool)
    .await
    .expect("query revoked entitlement after delete");
    assert!(
        revoked_entitlement_after_delete.is_some(),
        "organization entitlement should be revoked after cancellation"
    );

    unsafe {
        env::remove_var("FF_BILLING_ENABLED");
        env::remove_var("BILLING_PROVIDER");
        env::remove_var("STRIPE_WEBHOOK_SECRET");
    }
}

#[tokio::test]
async fn team_webhook_seat_changes_enforce_invites_and_reactivation() {
    let _env_guard = env_lock()
        .lock()
        .unwrap_or_else(|poisoned| poisoned.into_inner());
    let pool = match test_pool().await {
        Ok(Some(pool)) => pool,
        Ok(None) => {
            eprintln!("Skipping team webhook seat change test: DATABASE_URL is not configured");
            return;
        }
        Err(error) => {
            eprintln!("Skipping team webhook seat change test: database unavailable ({error})");
            return;
        }
    };
    configure_auth_env();

    let owner_user = user_id("billing-seat-owner");
    let manager_user = user_id("billing-seat-manager");
    let reactivated_user = user_id("billing-seat-reactivate");
    let second_reactivate_user = user_id("billing-seat-reactivate-2");
    let org_id = id("billing-seat-org");
    insert_user(&pool, &owner_user).await;
    insert_user(&pool, &manager_user).await;
    insert_user(&pool, &reactivated_user).await;
    insert_user(&pool, &second_reactivate_user).await;
    insert_organization(&pool, &org_id, &owner_user).await;
    insert_org_member(&pool, &org_id, &manager_user, "manager").await;
    insert_org_member_with_status(&pool, &org_id, &reactivated_user, "member", "deactivated").await;
    insert_org_member_with_status(
        &pool,
        &org_id,
        &second_reactivate_user,
        "member",
        "deactivated",
    )
    .await;

    let manager_member_token = jwt_for_user(&manager_user);
    let app = test_app(pool.clone());
    let customer_id = format!("cus_{}", Uuid::new_v4().simple());
    let provider_subscription_id = format!("sub_{}", Uuid::new_v4().simple());
    let webhook_secret = format!("whsec_{}", Uuid::new_v4().simple());

    unsafe {
        env::set_var("FF_BILLING_ENABLED", "true");
        env::set_var("BILLING_PROVIDER", "stripe");
        env::set_var("STRIPE_WEBHOOK_SECRET", &webhook_secret);
    }

    let checkout_event = json!({
        "id": id("evt-seat-checkout"),
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "mode": "subscription",
                "subscription": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "4",
                    "user_id": manager_user.clone()
                }
            }
        }
    });
    let checkout_response = post_signed_stripe_webhook(&app, &webhook_secret, checkout_event).await;
    assert_eq!(checkout_response.status(), StatusCode::OK);

    let first_member_id = find_org_member_id(&pool, &org_id, &reactivated_user).await;
    let second_member_id = find_org_member_id(&pool, &org_id, &second_reactivate_user).await;

    let first_reactivation_response = app
        .clone()
        .oneshot(build_request(
            Method::PATCH,
            &format!("/organizations/current/members/{first_member_id}"),
            &manager_member_token,
            Some(json!({ "status": "active" })),
        ))
        .await
        .expect("first reactivation request");
    assert_eq!(first_reactivation_response.status(), StatusCode::OK);

    let first_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &manager_member_token,
            Some(json!({
                "email": format!("{}@example.com", id("invite-seat-one")),
                "role": "member"
            })),
        ))
        .await
        .expect("first invite request");
    assert_eq!(first_invite_response.status(), StatusCode::CREATED);

    let reduced_seat_event = json!({
        "id": id("evt-seat-down"),
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "status": "active",
                "current_period_start": Utc::now().timestamp(),
                "current_period_end": (Utc::now() + Duration::days(30)).timestamp(),
                "cancel_at_period_end": false,
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "3"
                },
                "items": {
                    "data": [
                        { "quantity": 3 }
                    ]
                }
            }
        }
    });
    let reduced_seat_response =
        post_signed_stripe_webhook(&app, &webhook_secret, reduced_seat_event).await;
    assert_eq!(reduced_seat_response.status(), StatusCode::OK);

    let reduced_subscription_row = sqlx::query(
        r#"
        SELECT seat_quantity
        FROM subscriptions
        WHERE provider_subscription_id = $1
        LIMIT 1
        "#,
    )
    .bind(&provider_subscription_id)
    .fetch_one(&pool)
    .await
    .expect("query reduced seat quantity");
    assert_eq!(
        reduced_subscription_row
            .try_get::<Option<i32>, _>("seat_quantity")
            .expect("seat_quantity"),
        Some(3)
    );

    let blocked_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &manager_member_token,
            Some(json!({
                "email": format!("{}@example.com", id("invite-seat-two")),
                "role": "member"
            })),
        ))
        .await
        .expect("blocked invite request");
    assert_eq!(
        blocked_invite_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let blocked_invite_body = to_bytes(blocked_invite_response.into_body(), usize::MAX)
        .await
        .expect("blocked invite body");
    let blocked_invite_json: serde_json::Value =
        serde_json::from_slice(&blocked_invite_body).expect("blocked invite json");
    assert!(blocked_invite_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_LIMIT_REACHED")));

    let blocked_reactivation_response = app
        .clone()
        .oneshot(build_request(
            Method::PATCH,
            &format!("/organizations/current/members/{second_member_id}"),
            &manager_member_token,
            Some(json!({ "status": "active" })),
        ))
        .await
        .expect("blocked reactivation request");
    assert_eq!(
        blocked_reactivation_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );
    let blocked_reactivation_body = to_bytes(blocked_reactivation_response.into_body(), usize::MAX)
        .await
        .expect("blocked reactivation body");
    let blocked_reactivation_json: serde_json::Value =
        serde_json::from_slice(&blocked_reactivation_body).expect("blocked reactivation json");
    assert!(blocked_reactivation_json
        .get("error")
        .and_then(|v| v.as_str())
        .is_some_and(|text| text.contains("SEAT_LIMIT_REACHED")));

    let increased_seat_event = json!({
        "id": id("evt-seat-up"),
        "type": "customer.subscription.updated",
        "data": {
            "object": {
                "id": provider_subscription_id.clone(),
                "customer": customer_id.clone(),
                "status": "active",
                "current_period_start": Utc::now().timestamp(),
                "current_period_end": (Utc::now() + Duration::days(30)).timestamp(),
                "cancel_at_period_end": false,
                "metadata": {
                    "plan_code": "TEAM",
                    "organization_id": org_id.clone(),
                    "seat_quantity": "5"
                },
                "items": {
                    "data": [
                        { "quantity": 5 }
                    ]
                }
            }
        }
    });
    let increased_seat_response =
        post_signed_stripe_webhook(&app, &webhook_secret, increased_seat_event).await;
    assert_eq!(increased_seat_response.status(), StatusCode::OK);

    let increased_subscription_row = sqlx::query(
        r#"
        SELECT seat_quantity
        FROM subscriptions
        WHERE provider_subscription_id = $1
        LIMIT 1
        "#,
    )
    .bind(&provider_subscription_id)
    .fetch_one(&pool)
    .await
    .expect("query increased seat quantity");
    assert_eq!(
        increased_subscription_row
            .try_get::<Option<i32>, _>("seat_quantity")
            .expect("seat_quantity"),
        Some(5)
    );

    let second_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &manager_member_token,
            Some(json!({
                "email": format!("{}@example.com", id("invite-seat-three")),
                "role": "member"
            })),
        ))
        .await
        .expect("second invite request");
    assert_eq!(second_invite_response.status(), StatusCode::CREATED);

    let successful_reactivation_response = app
        .clone()
        .oneshot(build_request(
            Method::PATCH,
            &format!("/organizations/current/members/{second_member_id}"),
            &manager_member_token,
            Some(json!({ "status": "active" })),
        ))
        .await
        .expect("successful reactivation request");
    assert_eq!(successful_reactivation_response.status(), StatusCode::OK);

    unsafe {
        env::remove_var("FF_BILLING_ENABLED");
        env::remove_var("BILLING_PROVIDER");
        env::remove_var("STRIPE_WEBHOOK_SECRET");
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

fn stripe_signature_header(secret: &str, payload: &[u8]) -> String {
    let timestamp = Utc::now().timestamp();
    let mut signed_payload = timestamp.to_string().into_bytes();
    signed_payload.push(b'.');
    signed_payload.extend_from_slice(payload);

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("valid webhook secret");
    mac.update(&signed_payload);
    let signature = hex::encode(mac.finalize().into_bytes());
    format!("t={},v1={}", timestamp, signature)
}

async fn post_signed_stripe_webhook(
    app: &axum::Router,
    webhook_secret: &str,
    payload: serde_json::Value,
) -> axum::response::Response {
    let payload_bytes = serde_json::to_vec(&payload).expect("serialize webhook payload");
    let signature = stripe_signature_header(webhook_secret, &payload_bytes);
    let request = Request::builder()
        .method(Method::POST)
        .uri("/billing/webhook/stripe")
        .header("Content-Type", "application/json")
        .header("stripe-signature", signature)
        .body(Body::from(payload_bytes))
        .expect("build webhook request");

    app.clone()
        .oneshot(request)
        .await
        .expect("webhook request should succeed")
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

async fn insert_org_member(pool: &PgPool, org_id: &str, user_id: &str, role: &str) {
    sqlx::query(
        r#"
        INSERT INTO organization_members (
            id, organization_id, user_id, role, status, invited_by_user_id, joined_at
        )
        VALUES ($1, $2, $3, $4, 'active', NULL, NOW())
        "#,
    )
    .bind(id("org-member"))
    .bind(org_id)
    .bind(user_id)
    .bind(role)
    .execute(pool)
    .await
    .expect("insert organization member");
}

async fn insert_org_member_with_status(
    pool: &PgPool,
    org_id: &str,
    user_id: &str,
    role: &str,
    status: &str,
) {
    sqlx::query(
        r#"
        INSERT INTO organization_members (
            id, organization_id, user_id, role, status, invited_by_user_id, joined_at
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            NULL,
            CASE WHEN $5 = 'active' THEN NOW() ELSE NULL END
        )
        "#,
    )
    .bind(id("org-member-status"))
    .bind(org_id)
    .bind(user_id)
    .bind(role)
    .bind(status)
    .execute(pool)
    .await
    .expect("insert organization member with status");
}

async fn find_org_member_id(pool: &PgPool, org_id: &str, user_id: &str) -> String {
    let row = sqlx::query(
        r#"
        SELECT id
        FROM organization_members
        WHERE organization_id = $1 AND user_id = $2
        LIMIT 1
        "#,
    )
    .bind(org_id)
    .bind(user_id)
    .fetch_one(pool)
    .await
    .expect("find organization member id");

    row.try_get::<String, _>("id").expect("member id")
}

async fn insert_active_team_subscription(pool: &PgPool, org_id: &str, seat_quantity: i32) {
    sqlx::query(
        r#"
        INSERT INTO subscriptions (
            id,
            organization_id,
            user_id,
            provider,
            provider_subscription_id,
            status,
            plan_code,
            seat_quantity,
            current_period_start,
            current_period_end,
            cancel_at_period_end
        )
        VALUES (
            $1,
            $2,
            NULL,
            'stripe',
            $3,
            'active',
            'TEAM',
            $4,
            NOW(),
            NOW() + INTERVAL '30 days',
            FALSE
        )
        "#,
    )
    .bind(id("subscription"))
    .bind(org_id)
    .bind(id("stripe-sub"))
    .bind(seat_quantity)
    .execute(pool)
    .await
    .expect("insert active team subscription");
}
