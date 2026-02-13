use std::env;

use axum::{
    body::{to_bytes, Body},
    http::{Method, Request, StatusCode},
};
use backend::{api, middleware::auth::JwksKeys, state::state_with_pool};
use chrono::{Duration, Utc};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header};
use serde::Serialize;
use serde_json::{json, Value};
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
async fn http_cross_org_isolation_for_protected_routes() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping HTTP RBAC integration test: DATABASE_URL is not configured");
        return;
    };
    configure_auth_env();

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

    let outsider_token = jwt_for_user(&outsider_b);
    let app = test_app(pool);

    let paths = vec![
        format!("/sessions/{session_id}"),
        format!("/sessions/{session_id}/messages"),
        format!("/sessions/{session_id}/comments"),
        format!("/sessions/{session_id}/outputs"),
    ];

    for path in paths {
        let response = app
            .clone()
            .oneshot(build_request(Method::GET, &path, &outsider_token, None))
            .await
            .expect("request should succeed");
        assert_eq!(
            response.status(),
            StatusCode::NOT_FOUND,
            "expected 404 for path {path}"
        );
    }
}

#[tokio::test]
async fn http_role_matrix_for_sessions_messages_comments_outputs() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping HTTP RBAC integration test: DATABASE_URL is not configured");
        return;
    };
    configure_auth_env();

    let learner = user_id("learner");
    let admin = user_id("admin");
    let manager = user_id("manager");
    let member = user_id("member");
    for user in [&learner, &admin, &manager, &member] {
        insert_user(&pool, user).await;
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

    let owner_token = jwt_for_user(&learner);
    let admin_token = jwt_for_user(&admin);
    let manager_token = jwt_for_user(&manager);
    let member_token = jwt_for_user(&member);
    let app = test_app(pool);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}"),
            &admin_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::OK);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}"),
            &manager_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::OK);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}"),
            &member_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/messages"),
            &owner_token,
            Some(json!({"role":"agent","content":"owner update"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::OK);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/messages"),
            &admin_token,
            Some(json!({"role":"agent","content":"admin update"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/messages"),
            &member_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let admin_comment_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/comments"),
            &admin_token,
            Some(json!({"authorName":"Admin","content":"admin note"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(admin_comment_response.status(), StatusCode::OK);
    let admin_comment_body = to_bytes(admin_comment_response.into_body(), usize::MAX)
        .await
        .expect("comment response body");
    let admin_comment_json: serde_json::Value =
        serde_json::from_slice(&admin_comment_body).expect("valid comment json");
    assert_eq!(admin_comment_json.get("authorRole"), Some(&json!("owner")));

    let manager_comment_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/comments"),
            &manager_token,
            Some(json!({"authorName":"Manager","content":"manager note"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(manager_comment_response.status(), StatusCode::OK);
    let manager_comment_body = to_bytes(manager_comment_response.into_body(), usize::MAX)
        .await
        .expect("comment response body");
    let manager_comment_json: serde_json::Value =
        serde_json::from_slice(&manager_comment_body).expect("valid comment json");
    assert_eq!(
        manager_comment_json.get("authorRole"),
        Some(&json!("manager"))
    );

    let response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/comments"),
            &member_token,
            Some(json!({"authorName":"Member","content":"member note"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/outputs"),
            &admin_token,
            Some(json!({"kind":"text","value":"admin output","note":"shared"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::CREATED);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/outputs"),
            &manager_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::OK);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/outputs"),
            &member_token,
            Some(json!({"kind":"text","value":"member output"})),
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);

    let response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/outputs"),
            &member_token,
            None,
        ))
        .await
        .expect("request should succeed");
    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn http_all_registered_api_endpoints_surface() {
    let Some(pool) = test_pool().await else {
        eprintln!("Skipping HTTP endpoint surface test: DATABASE_URL is not configured");
        return;
    };
    configure_auth_env();

    let owner = user_id("surface-owner");
    let invitee = user_id("surface-invitee");
    insert_user(&pool, &owner).await;
    insert_user(&pool, &invitee).await;

    let owner_token = jwt_for_user(&owner);
    let invitee_token = jwt_for_user(&invitee);
    let app = test_app(pool);

    let health_response = app
        .clone()
        .oneshot(build_request_without_auth(Method::GET, "/health", None))
        .await
        .expect("health request should succeed");
    assert_eq!(health_response.status(), StatusCode::OK);

    let scenarios_response = app
        .clone()
        .oneshot(build_request(Method::GET, "/scenarios", &owner_token, None))
        .await
        .expect("list scenarios request should succeed");
    assert_eq!(scenarios_response.status(), StatusCode::OK);
    let scenarios_body = to_bytes(scenarios_response.into_body(), usize::MAX)
        .await
        .expect("list scenarios body");
    let scenarios_json: Value =
        serde_json::from_slice(&scenarios_body).expect("list scenarios json");
    let scenario_id = scenarios_json
        .as_array()
        .and_then(|scenarios| scenarios.first())
        .and_then(|scenario| scenario.get("id"))
        .and_then(Value::as_str)
        .expect("default scenario id")
        .to_string();

    let create_scenario_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/scenarios",
            &owner_token,
            Some(json!({})),
        ))
        .await
        .expect("create scenario request should succeed");
    assert_eq!(
        create_scenario_response.status(),
        StatusCode::UNPROCESSABLE_ENTITY
    );

    let get_scenario_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/scenarios/{scenario_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("get scenario request should succeed");
    assert_eq!(get_scenario_response.status(), StatusCode::OK);

    let create_session_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/sessions",
            &owner_token,
            Some(json!({ "scenarioId": scenario_id })),
        ))
        .await
        .expect("create session request should succeed");
    assert_eq!(create_session_response.status(), StatusCode::OK);
    let create_session_body = to_bytes(create_session_response.into_body(), usize::MAX)
        .await
        .expect("create session body");
    let create_session_json: Value =
        serde_json::from_slice(&create_session_body).expect("create session json");
    let session_id = create_session_json
        .get("id")
        .and_then(Value::as_str)
        .expect("session id")
        .to_string();

    let list_sessions_response = app
        .clone()
        .oneshot(build_request(Method::GET, "/sessions", &owner_token, None))
        .await
        .expect("list sessions request should succeed");
    assert_eq!(list_sessions_response.status(), StatusCode::OK);

    let get_session_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("get session request should succeed");
    assert_eq!(get_session_response.status(), StatusCode::OK);

    let entitlements_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/me/entitlements",
            &owner_token,
            None,
        ))
        .await
        .expect("entitlements request should succeed");
    assert_eq!(entitlements_response.status(), StatusCode::OK);

    let credits_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/me/credits",
            &owner_token,
            None,
        ))
        .await
        .expect("credits request should succeed");
    assert_eq!(credits_response.status(), StatusCode::OK);

    let checkout_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/checkout/individual",
            &owner_token,
            Some(json!({})),
        ))
        .await
        .expect("checkout request should succeed");
    assert_eq!(checkout_response.status(), StatusCode::SERVICE_UNAVAILABLE);

    let portal_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/billing/portal/session",
            &owner_token,
            Some(json!({})),
        ))
        .await
        .expect("portal request should succeed");
    assert_eq!(portal_response.status(), StatusCode::SERVICE_UNAVAILABLE);

    let webhook_response = app
        .clone()
        .oneshot(build_request_without_auth(
            Method::POST,
            "/billing/webhook/stripe",
            Some(json!({})),
        ))
        .await
        .expect("webhook request should succeed");
    assert_eq!(webhook_response.status(), StatusCode::SERVICE_UNAVAILABLE);

    let evaluate_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/evaluate"),
            &owner_token,
            Some(json!({})),
        ))
        .await
        .expect("evaluate request should succeed");
    assert_eq!(evaluate_response.status(), StatusCode::UNPROCESSABLE_ENTITY);

    let list_messages_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/messages"),
            &owner_token,
            None,
        ))
        .await
        .expect("list messages request should succeed");
    assert_eq!(list_messages_response.status(), StatusCode::OK);

    let post_message_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/messages"),
            &owner_token,
            Some(json!({"role":"agent","content":"status update"})),
        ))
        .await
        .expect("post message request should succeed");
    assert_eq!(post_message_response.status(), StatusCode::OK);

    let list_comments_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/comments"),
            &owner_token,
            None,
        ))
        .await
        .expect("list comments request should succeed");
    assert_eq!(list_comments_response.status(), StatusCode::OK);

    let create_comment_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/comments"),
            &owner_token,
            Some(json!({"authorName":"Owner","content":"manager comment"})),
        ))
        .await
        .expect("create comment request should succeed");
    assert_eq!(create_comment_response.status(), StatusCode::OK);

    let list_outputs_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/outputs"),
            &owner_token,
            None,
        ))
        .await
        .expect("list outputs request should succeed");
    assert_eq!(list_outputs_response.status(), StatusCode::OK);

    let create_output_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/outputs"),
            &owner_token,
            Some(json!({"kind":"text","value":"ship checklist"})),
        ))
        .await
        .expect("create output request should succeed");
    assert_eq!(create_output_response.status(), StatusCode::CREATED);
    let create_output_body = to_bytes(create_output_response.into_body(), usize::MAX)
        .await
        .expect("create output body");
    let create_output_json: Value =
        serde_json::from_slice(&create_output_body).expect("create output json");
    let output_id = create_output_json
        .get("id")
        .and_then(Value::as_str)
        .expect("output id")
        .to_string();

    let delete_output_response = app
        .clone()
        .oneshot(build_request(
            Method::DELETE,
            &format!("/sessions/{session_id}/outputs/{output_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("delete output request should succeed");
    assert_eq!(delete_output_response.status(), StatusCode::NO_CONTENT);

    let list_test_cases_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            &format!("/sessions/{session_id}/test-cases"),
            &owner_token,
            None,
        ))
        .await
        .expect("list test cases request should succeed");
    assert_eq!(list_test_cases_response.status(), StatusCode::OK);

    let create_test_case_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/sessions/{session_id}/test-cases"),
            &owner_token,
            Some(json!({
                "name":"ログイン成功",
                "preconditions":"有効ユーザーが存在する",
                "steps":"ログイン画面を開いて資格情報を入力",
                "expectedResult":"ダッシュボードに遷移する"
            })),
        ))
        .await
        .expect("create test case request should succeed");
    assert_eq!(create_test_case_response.status(), StatusCode::CREATED);
    let create_test_case_body = to_bytes(create_test_case_response.into_body(), usize::MAX)
        .await
        .expect("create test case body");
    let create_test_case_json: Value =
        serde_json::from_slice(&create_test_case_body).expect("create test case json");
    let test_case_id = create_test_case_json
        .get("id")
        .and_then(Value::as_str)
        .expect("test case id")
        .to_string();

    let delete_test_case_response = app
        .clone()
        .oneshot(build_request(
            Method::DELETE,
            &format!("/test-cases/{test_case_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("delete test case request should succeed");
    assert_eq!(delete_test_case_response.status(), StatusCode::NO_CONTENT);

    let import_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/import",
            &owner_token,
            Some(json!({ "sessions": [] })),
        ))
        .await
        .expect("import request should succeed");
    assert_eq!(import_response.status(), StatusCode::OK);

    let get_product_config_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/product-config",
            &owner_token,
            None,
        ))
        .await
        .expect("get product config request should succeed");
    assert_eq!(get_product_config_response.status(), StatusCode::OK);

    let update_product_config_response = app
        .clone()
        .oneshot(build_request(
            Method::PUT,
            "/product-config",
            &owner_token,
            Some(json!({
                "name":"PM Journey Product",
                "summary":"Updated summary",
                "audience":"PMs",
                "problems":["Problem A"],
                "goals":["Goal A"],
                "differentiators":["Diff A"],
                "scope":["Scope A"],
                "constraints":["Constraint A"],
                "timeline":"Q1",
                "successCriteria":["Metric A"],
                "uniqueEdge":"Edge",
                "techStack":["Rust","React"],
                "coreFeatures":["Feature A"],
                "productPrompt":"Prompt"
            })),
        ))
        .await
        .expect("update product config request should succeed");
    assert_eq!(update_product_config_response.status(), StatusCode::OK);

    let reset_product_config_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/product-config/reset",
            &owner_token,
            None,
        ))
        .await
        .expect("reset product config request should succeed");
    assert_eq!(reset_product_config_response.status(), StatusCode::OK);

    let create_org_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations",
            &owner_token,
            Some(json!({ "name": "Surface Team" })),
        ))
        .await
        .expect("create org request should succeed");
    assert_eq!(create_org_response.status(), StatusCode::CREATED);

    let get_current_org_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current",
            &owner_token,
            None,
        ))
        .await
        .expect("current org request should succeed");
    assert_eq!(get_current_org_response.status(), StatusCode::OK);

    let update_org_response = app
        .clone()
        .oneshot(build_request(
            Method::PATCH,
            "/organizations/current",
            &owner_token,
            Some(json!({ "name": "Surface Team Updated" })),
        ))
        .await
        .expect("update org request should succeed");
    assert_eq!(update_org_response.status(), StatusCode::OK);

    let list_members_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/members",
            &owner_token,
            None,
        ))
        .await
        .expect("list members request should succeed");
    assert_eq!(list_members_response.status(), StatusCode::OK);

    let create_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            "/organizations/current/invitations",
            &owner_token,
            Some(json!({
                "email": format!("{invitee}@example.com"),
                "role": "member"
            })),
        ))
        .await
        .expect("create invitation request should succeed");
    assert_eq!(create_invite_response.status(), StatusCode::CREATED);
    let create_invite_body = to_bytes(create_invite_response.into_body(), usize::MAX)
        .await
        .expect("create invitation body");
    let create_invite_json: Value =
        serde_json::from_slice(&create_invite_body).expect("create invitation json");
    let invite_token = create_invite_json
        .get("inviteToken")
        .and_then(Value::as_str)
        .expect("invite token")
        .to_string();

    let accept_invite_response = app
        .clone()
        .oneshot(build_request(
            Method::POST,
            &format!("/organizations/current/invitations/{invite_token}/accept"),
            &invitee_token,
            None,
        ))
        .await
        .expect("accept invitation request should succeed");
    assert_eq!(accept_invite_response.status(), StatusCode::OK);

    let members_after_accept_response = app
        .clone()
        .oneshot(build_request(
            Method::GET,
            "/organizations/current/members",
            &owner_token,
            None,
        ))
        .await
        .expect("list members after accept request should succeed");
    assert_eq!(members_after_accept_response.status(), StatusCode::OK);
    let members_after_accept_body = to_bytes(members_after_accept_response.into_body(), usize::MAX)
        .await
        .expect("list members after accept body");
    let members_after_accept_json: Value =
        serde_json::from_slice(&members_after_accept_body).expect("list members after accept json");
    let invitee_member_id = members_after_accept_json
        .get("members")
        .and_then(Value::as_array)
        .and_then(|members| {
            members
                .iter()
                .find(|member| member.get("userId").and_then(Value::as_str) == Some(&invitee))
        })
        .and_then(|member| member.get("id"))
        .and_then(Value::as_str)
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
        .expect("update member request should succeed");
    assert_eq!(update_member_response.status(), StatusCode::OK);

    let delete_member_response = app
        .clone()
        .oneshot(build_request(
            Method::DELETE,
            &format!("/organizations/current/members/{invitee_member_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("delete member request should succeed");
    assert_eq!(delete_member_response.status(), StatusCode::NO_CONTENT);

    let delete_session_response = app
        .clone()
        .oneshot(build_request(
            Method::DELETE,
            &format!("/sessions/{session_id}"),
            &owner_token,
            None,
        ))
        .await
        .expect("delete session request should succeed");
    assert_eq!(delete_session_response.status(), StatusCode::OK);
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

fn build_request_without_auth(
    method: Method,
    path: &str,
    body: Option<serde_json::Value>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(path);

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
    format!("http-it-{prefix}-{}", Uuid::new_v4())
}

fn user_id(prefix: &str) -> String {
    format!("auth0|http-it-{prefix}-{}", Uuid::new_v4())
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
