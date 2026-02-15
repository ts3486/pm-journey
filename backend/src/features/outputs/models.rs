use serde::Deserialize;
use utoipa::ToSchema;

pub use crate::models::{Output, OutputKind};

#[derive(Debug, Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateOutputRequest {
    pub kind: OutputKind,
    pub value: String,
    pub note: Option<String>,
}
