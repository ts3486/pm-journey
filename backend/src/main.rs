mod api;
mod db;
mod error;
mod middleware;
mod models;

use axum::{middleware::from_fn, Router};
use sqlx::{PgPool, migrate::Migrator};
use std::env;
use tower::make::Shared;
use middleware::telemetry::{init_tracing, tracing_middleware};
use crate::api::SharedState;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    MIGRATOR.run(pool).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    init_tracing();

    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");

    tracing::info!("Connecting to Postgres at {}", database_url);
    let pool = PgPool::connect(&database_url)
        .await
        .expect("failed to connect to Postgres");

    tracing::info!("Running database migrations...");
    run_migrations(&pool).await.expect("failed to run migrations");
    tracing::info!("Migrations completed successfully");

    let state = api::state_with_pool(pool);
    let app: Router = api::router_with_state(state).layer(from_fn(tracing_middleware));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("failed to bind");
    tracing::info!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, Shared::new(app))
        .await
        .expect("server error");
}
