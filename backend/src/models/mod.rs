use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Scenario {
    pub id: String,
    pub title: String,
    pub description: String,
    pub product: ProductInfo,
    pub mode: String,
    pub kickoff_prompt: String,
    pub evaluation_criteria: Vec<EvaluationCategory>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct ProductInfo {
    pub name: String,
    pub summary: String,
    pub audience: String,
    pub problems: Vec<String>,
    pub goals: Vec<String>,
    pub differentiators: Vec<String>,
    pub scope: Vec<String>,
    pub constraints: Vec<String>,
    pub timeline: String,
    pub success_criteria: Vec<String>,
    pub unique_edge: Option<String>,
    pub tech_stack: Option<Vec<String>>,
    pub core_features: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Active,
    Completed,
    Evaluated,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct ProgressFlags {
    pub requirements: bool,
    pub priorities: bool,
    pub risks: bool,
    pub acceptance: bool,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Session {
    pub id: String,
    pub scenario_id: String,
    pub status: SessionStatus,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub last_activity_at: String,
    pub user_name: Option<String>,
    pub progress_flags: ProgressFlags,
    pub evaluation_requested: bool,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageRole {
    User,
    Agent,
    System,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageTag {
    Decision,
    Assumption,
    Risk,
    NextAction,
    Summary,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: MessageRole,
    pub content: String,
    pub created_at: String,
    pub tags: Option<Vec<MessageTag>>,
    pub queued_offline: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct EvaluationCategory {
    pub name: String,
    pub weight: f32,
    pub score: Option<f32>,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Evaluation {
    pub session_id: String,
    pub overall_score: Option<f32>,
    pub passing: Option<bool>,
    pub categories: Vec<EvaluationCategory>,
    pub summary: Option<String>,
    pub improvement_advice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct HistoryItem {
    pub session_id: String,
    pub metadata: HistoryMetadata,
    pub actions: Vec<Message>,
    pub evaluation: Option<Evaluation>,
    pub storage_location: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct HistoryMetadata {
    pub duration: Option<f32>,
    pub message_count: Option<u64>,
}
