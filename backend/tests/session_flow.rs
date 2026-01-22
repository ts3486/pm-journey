use axum::body::Body;
use axum::http::Request;
use axum::Router;
use backend::api;
use tower::util::ServiceExt;

#[tokio::test]
async fn session_lifecycle_smoke() {
    let app: Router = api::router();

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/sessions")
                .header("content-type", "application/json")
                .body(Body::from(r#"{ "scenario_id": "olivia-attendance" }"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), 200);
}
