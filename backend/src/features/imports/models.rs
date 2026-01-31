use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

pub use crate::models::{Evaluation, Message, Session};

#[derive(Deserialize, ToSchema)]
pub struct SessionSnapshot {
    pub session: Session,
    pub messages: Vec<Message>,
    pub evaluation: Option<Evaluation>,
}

#[derive(Deserialize, ToSchema)]
pub struct ImportRequest {
    pub sessions: Vec<SessionSnapshot>,
}

#[derive(Serialize, ToSchema)]
pub struct ImportResult {
    pub imported: usize,
    pub failed: Vec<String>,
}
