mod api;
mod error;
mod features;
mod middleware;
mod models;
mod shared;
mod state;

use axum::{middleware::from_fn, Router};
use sqlx::{migrate::Migrator, PgPool};
use std::env;
use std::time::Duration;
use tower::make::Shared;
use tower_http::cors::{Any, CorsLayer};

use middleware::telemetry::{init_tracing, tracing_middleware};
use state::state_with_pool;

static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    MIGRATOR.run(pool).await?;
    Ok(())
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    init_tracing();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let connect_timeout = Duration::from_secs(10);
    let migrations_timeout = Duration::from_secs(30);

    tracing::info!("Connecting to Postgres at {}", database_url);
    let pool = tokio::time::timeout(connect_timeout, PgPool::connect(&database_url))
        .await
        .expect("timed out connecting to Postgres")
        .expect("failed to connect to Postgres");

    tracing::info!("Running database migrations...");
    tokio::time::timeout(migrations_timeout, run_migrations(&pool))
        .await
        .expect("timed out running migrations")
        .expect("failed to run migrations");
    tracing::info!("Migrations completed successfully");

    let state = state_with_pool(pool);
    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:3000".parse().unwrap(),
            "http://127.0.0.1:3000".parse().unwrap(),
            "https://pm-journey-frontend.fly.dev".parse().unwrap(),
        ])
        .allow_methods(Any)
        .allow_headers(Any);

    let app: Router = api::router_with_state(state)
        .layer(from_fn(tracing_middleware))
        .layer(cors);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001")
        .await
        .expect("failed to bind");
    tracing::info!("listening on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, Shared::new(app))
        .await
        .expect("server error");
}
