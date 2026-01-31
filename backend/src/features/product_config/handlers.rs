use axum::{extract::State, Json};

use crate::error::AppError;
use crate::state::SharedState;

use super::models::{ProductConfig, UpdateProductConfigRequest};

/// Get the current product configuration
#[utoipa::path(
    get,
    path = "/product-config",
    responses(
        (status = 200, description = "Product configuration", body = ProductConfig)
    ),
    tag = "Product Config"
)]
pub async fn get_product_config(
    State(state): State<SharedState>,
) -> Result<Json<ProductConfig>, AppError> {
    let config = state.services().product_config().get_product_config().await?;
    Ok(Json(config))
}

/// Update the product configuration
#[utoipa::path(
    put,
    path = "/product-config",
    request_body = UpdateProductConfigRequest,
    responses(
        (status = 200, description = "Updated product configuration", body = ProductConfig),
        (status = 422, description = "Validation error")
    ),
    tag = "Product Config"
)]
pub async fn update_product_config(
    State(state): State<SharedState>,
    Json(request): Json<UpdateProductConfigRequest>,
) -> Result<Json<ProductConfig>, AppError> {
    let config = state
        .services()
        .product_config()
        .update_product_config(&request)
        .await?;
    Ok(Json(config))
}

/// Reset to default product configuration
#[utoipa::path(
    post,
    path = "/product-config/reset",
    responses(
        (status = 200, description = "Default product configuration", body = ProductConfig)
    ),
    tag = "Product Config"
)]
pub async fn reset_product_config(
    State(state): State<SharedState>,
) -> Result<Json<ProductConfig>, AppError> {
    let config = state.services().product_config().reset_product_config().await?;
    Ok(Json(config))
}
