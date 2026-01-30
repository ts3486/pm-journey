use serde::Deserialize;
use utoipa::ToSchema;

pub use crate::models::{
    HistoryItem, HistoryMetadata, ProgressFlags, ScenarioDiscipline, Session, SessionStatus,
};

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionRequest {
    #[serde(rename = "scenarioId", alias = "scenario_id")]
    pub scenario_id: String,
}
