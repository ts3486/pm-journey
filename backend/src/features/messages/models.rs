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
    #[serde(rename = "agentContext")]
    pub agent_context: Option<AgentContext>,
}

#[derive(Deserialize, ToSchema, Clone)]
pub struct AgentContext {
    #[serde(rename = "systemPrompt")]
    pub system_prompt: String,
    #[serde(rename = "tonePrompt")]
    pub tone_prompt: Option<String>,
    #[serde(rename = "scenarioPrompt")]
    pub scenario_prompt: String,
    #[serde(rename = "scenarioTitle")]
    pub scenario_title: Option<String>,
    #[serde(rename = "scenarioDescription")]
    pub scenario_description: Option<String>,
    #[serde(rename = "productContext")]
    pub product_context: Option<String>,
    #[serde(rename = "modelId")]
    pub model_id: Option<String>,
    #[serde(rename = "behavior")]
    pub behavior: Option<AgentBehavior>,
}

#[derive(Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AgentBehavior {
    pub user_led: Option<bool>,
    pub allow_proactive: Option<bool>,
    pub max_questions: Option<u32>,
    pub response_style: Option<String>,
    pub phase: Option<String>,
    pub single_response: Option<bool>,
    pub agent_response_enabled: Option<bool>,
}

#[derive(Serialize, ToSchema)]
pub struct MessageResponse {
    pub reply: Message,
    pub session: Session,
}
