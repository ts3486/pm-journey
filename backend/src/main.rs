mod api;
mod error;
mod middleware;
mod models;

use axum::{middleware::from_fn, Router};
use middleware::telemetry::{init_tracing, tracing_middleware};

#[tokio::main]
async fn main() {
    init_tracing();

    let app: Router = api::router().layer(from_fn(tracing_middleware));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("failed to bind");
    tracing::info!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.expect("server error");
}
