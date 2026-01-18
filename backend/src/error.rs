use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt::Display;

#[derive(Debug)]
pub struct AppError(pub anyhow::Error);

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(value: E) -> Self {
        Self(value.into())
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = Json(ErrorBody {
            error: self.0.to_string(),
        });
        (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
    }
}

pub fn anyhow_error<T: Display>(message: T) -> AppError {
    AppError(anyhow::anyhow!(message.to_string()))
}
