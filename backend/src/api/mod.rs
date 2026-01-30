use axum::{routing::{get, post}, Router};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::features::comments::handlers::{create_comment, list_comments};
use crate::features::evaluations::handlers::evaluate_session;
use crate::features::health::handlers::health;
use crate::features::imports::handlers::import_sessions;
use crate::features::messages::handlers::{list_messages, post_message};
use crate::features::scenarios::handlers::{create_scenario, get_scenario, list_scenarios};
use crate::features::sessions::handlers::{create_session, delete_session, get_session, list_sessions};
use crate::features::test_cases::handlers::{create_test_case, delete_test_case, list_test_cases};
use crate::features::evaluations::models::{EvaluationCriterion, EvaluationRequest, ScoringGuidelines};
use crate::features::messages::models::AgentContext;
use crate::features::test_cases::models::{CreateTestCaseRequest, TestCaseResponse};
use crate::models::{
    Evaluation, FeatureMockup, HistoryItem, ManagerComment, Message, MessageRole, MessageTag,
    Mission, MissionStatus, ProgressFlags, Scenario, ScenarioDiscipline, ScenarioType, Session,
    SessionStatus, TestCase,
};
use crate::state::SharedState;

#[allow(dead_code)]
pub const OPENAPI_SPEC_PATH: &str = "../specs/001-pm-simulation-web/contracts/openapi.yaml";

#[derive(OpenApi)]
#[openapi(
    paths(
        list_scenarios,
        get_scenario,
        create_scenario,
        health,
        create_session,
        list_sessions,
        get_session,
        delete_session,
        post_message,
        list_messages,
        evaluate_session,
        list_comments,
        create_comment,
        import_sessions,
        list_test_cases,
        create_test_case,
        delete_test_case
    ),
    components(schemas(
        Scenario,
        ScenarioType,
        FeatureMockup,
        Session,
        SessionStatus,
        ProgressFlags,
        Message,
        MessageRole,
        MessageTag,
        Evaluation,
        EvaluationRequest,
        EvaluationCriterion,
        ScoringGuidelines,
        HistoryItem,
        ScenarioDiscipline,
        MissionStatus,
        Mission,
        ManagerComment,
        TestCase,
        TestCaseResponse,
        CreateTestCaseRequest,
        crate::models::ProductInfo,
        AgentContext
    ))
)]
struct ApiDoc;

pub fn router_with_state(state: SharedState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/scenarios", get(list_scenarios))
        .route("/scenarios", post(create_scenario))
        .route("/scenarios/:id", get(get_scenario))
        .route("/sessions", post(create_session).get(list_sessions))
        .route("/sessions/:id", get(get_session).delete(delete_session))
        .route("/sessions/:id/messages", get(list_messages).post(post_message))
        .route("/sessions/:id/evaluate", post(evaluate_session))
        .route(
            "/sessions/:id/comments",
            get(list_comments).post(create_comment),
        )
        .route(
            "/sessions/:id/test-cases",
            get(list_test_cases).post(create_test_case),
        )
        .route("/test-cases/:id", axum::routing::delete(delete_test_case))
        .route("/import", post(import_sessions))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(state)
}
