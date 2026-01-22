use axum::body::Body;
use axum::http::Request;
use backend::api;
use tower::util::ServiceExt;

#[tokio::test]
async fn history_list_exists() {
    let app = api::router();
    let response = app
        .oneshot(
            Request::builder()
                .uri("/sessions")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
}
