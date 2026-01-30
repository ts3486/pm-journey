use serde::Deserialize;
use utoipa::ToSchema;

pub use crate::models::ManagerComment;

#[derive(Deserialize, ToSchema)]
pub struct CreateCommentRequest {
    #[serde(rename = "authorName")]
    pub author_name: Option<String>,
    pub content: String,
}
