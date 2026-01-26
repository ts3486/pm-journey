use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;
use std::fmt::Display;

#[derive(Debug)]
pub struct AppError {
    status: StatusCode,
    error: anyhow::Error,
}

impl AppError {
    pub fn new(status: StatusCode, error: anyhow::Error) -> Self {
        Self { status, error }
    }
}

impl<E> From<E> for AppError
where
    E: Into<anyhow::Error>,
{
    fn from(value: E) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, value.into())
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let body = Json(ErrorBody {
            error: self.error.to_string(),
        });
        (self.status, body).into_response()
    }
}

pub fn anyhow_error<T: Display>(message: T) -> AppError {
    AppError::new(
        StatusCode::INTERNAL_SERVER_ERROR,
        anyhow::anyhow!(message.to_string()),
    )
}

pub fn client_error<T: Display>(message: T) -> AppError {
    AppError::new(
        StatusCode::UNPROCESSABLE_ENTITY,
        anyhow::anyhow!(message.to_string()),
    )
}
