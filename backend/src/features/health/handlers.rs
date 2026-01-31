use axum::Json;

#[utoipa::path(
    get,
    path = "/health",
    responses((status = 200, description = "Health check"))
)]
pub async fn health() -> Json<&'static str> {
    Json("ok")
}
