use axum::{routing::{get, post}, Router};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::features::comments::handlers::{
    __path_create_comment, __path_list_comments, create_comment, list_comments,
};
use crate::features::evaluations::handlers::{__path_evaluate_session, evaluate_session};
use crate::features::health::handlers::{__path_health, health};
use crate::features::imports::handlers::{__path_import_sessions, import_sessions};
use crate::features::product_config::handlers::{
    __path_get_product_config, __path_reset_product_config, __path_update_product_config,
    get_product_config, reset_product_config, update_product_config,
};
use crate::features::product_config::models::{ProductConfig, UpdateProductConfigRequest};
use crate::features::messages::handlers::{
    __path_list_messages, __path_post_message, list_messages, post_message,
};
use crate::features::scenarios::handlers::{
    __path_create_scenario, __path_get_scenario, __path_list_scenarios, create_scenario,
    get_scenario, list_scenarios,
};
use crate::features::sessions::handlers::{
    __path_create_session, __path_delete_session, __path_get_session, __path_list_sessions,
    create_session, delete_session, get_session, list_sessions,
};
use crate::features::test_cases::handlers::{
    __path_create_test_case, __path_delete_test_case, __path_list_test_cases, create_test_case,
    delete_test_case, list_test_cases,
};
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
        delete_test_case,
        get_product_config,
        update_product_config,
        reset_product_config
    ),
    components(schemas(
        Scenario,
        ScenarioType,
        crate::features::health::handlers::HealthResponse,
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
        AgentContext,
        ProductConfig,
        UpdateProductConfigRequest
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
        .route(
            "/product-config",
            get(get_product_config).put(update_product_config),
        )
        .route("/product-config/reset", post(reset_product_config))
        .merge(SwaggerUi::new("/docs").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .with_state(state)
}
