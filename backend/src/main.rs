mod api;
mod error;
mod middleware;
mod models;

use axum::{middleware::from_fn, Router};
use sqlx::PgPool;
use std::env;
use tower::make::Shared;
use middleware::telemetry::{init_tracing, tracing_middleware};
use crate::api::SharedState;

#[tokio::main]
async fn main() {
    init_tracing();

    let database_url = env::var("DATABASE_URL").ok();
    let state: SharedState = if let Some(url) = database_url {
        tracing::info!("Connecting to Postgres at {}", url);
        let pool = PgPool::connect(&url)
            .await
            .expect("failed to connect to Postgres");
        api::init_db(&pool).await.expect("failed to init db");
        let state = api::state_with_pool(pool.clone());
        api::load_from_db(&state).await;
        state
    } else {
        tracing::info!("Starting without database; using local disk store");
        api::default_state()
    };

    let app: Router = api::router_with_state(state.clone()).layer(from_fn(tracing_middleware));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("failed to bind");
    tracing::info!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, Shared::new(app))
        .await
        .expect("server error");
}
