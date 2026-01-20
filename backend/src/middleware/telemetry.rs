use std::time::Instant;

use axum::{body::Body, http::Request, middleware::Next, response::Response};
use tracing::{error, info, warn};

pub async fn tracing_middleware(req: Request<Body>, next: Next) -> Response {
    let start = Instant::now();
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let response = next.run(req).await;
    let status = response.status();
    let elapsed = start.elapsed();

    match status {
        s if s.is_server_error() => {
            error!(%method, %path, %status, elapsed_ms = elapsed.as_millis(), "request failed")
        }
        s if s.is_client_error() => {
            warn!(%method, %path, %status, elapsed_ms = elapsed.as_millis(), "request returned client error")
        }
        _ => info!(%method, %path, %status, elapsed_ms = elapsed.as_millis(), "request handled"),
    }

    response
}

pub fn init_tracing() {
    let _ = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .try_init();
}
