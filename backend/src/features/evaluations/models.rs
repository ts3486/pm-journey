use serde::Deserialize;
use utoipa::ToSchema;

pub use crate::models::Evaluation;
pub use crate::models::ScoringGuidelines;

#[derive(Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationCriterion {
    pub id: Option<String>,
    pub name: String,
    pub weight: f32,
    pub description: String,
    pub scoring_guidelines: ScoringGuidelines,
}

#[derive(Deserialize, ToSchema)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationRequest {
    pub criteria: Option<Vec<EvaluationCriterion>>,
    pub passing_score: Option<f32>,
    pub scenario_title: Option<String>,
    pub scenario_description: Option<String>,
    pub product_context: Option<String>,
    pub scenario_prompt: Option<String>,
    #[allow(dead_code)]
    pub scenario_type: Option<String>,
    pub test_cases_context: Option<String>,
    pub requirement_definition_context: Option<String>,
    pub incident_response_context: Option<String>,
    pub business_execution_context: Option<String>,
}
