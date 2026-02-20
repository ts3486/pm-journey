use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub use crate::models::{Message, MessageRole, MessageTag, MissionStatus, Session};

#[derive(Deserialize, ToSchema)]
pub struct CreateMessageRequest {
    pub role: MessageRole,
    pub content: String,
    pub tags: Option<Vec<MessageTag>>,
    #[serde(rename = "missionStatus")]
    pub mission_status: Option<Vec<MissionStatus>>,
}


#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    pub reply: Message,
    #[serde(rename = "additionalMessages")]
    pub additional_messages: Vec<Message>,
    pub session: Session,
}
