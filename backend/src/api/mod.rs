use axum::{
    routing::{get, post},
    Router,
};
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use crate::features::billing::handlers::{
    __path_checkout_individual, __path_create_portal_session, __path_stripe_webhook,
    checkout_individual, create_portal_session, stripe_webhook,
};
use crate::features::billing::models::{
    BillingPortalSessionResponse, CreateBillingPortalSessionRequest,
    CreateIndividualCheckoutRequest, IndividualCheckoutResponse, StripeWebhookResponse,
};
use crate::features::comments::handlers::{
    __path_create_comment, __path_list_comments, create_comment, list_comments,
};
use crate::features::credits::handlers::{__path_get_my_credits, get_my_credits};
use crate::features::credits::models::CreditBalanceResponse;
use crate::features::entitlements::handlers::{__path_get_my_entitlements, get_my_entitlements};
use crate::features::entitlements::models::{EntitlementResponse, PlanCode};
use crate::features::evaluations::handlers::{__path_evaluate_session, evaluate_session};
use crate::features::evaluations::models::{
    EvaluationCriterion, EvaluationRequest, ScoringGuidelines,
};
use crate::features::health::handlers::{__path_health, health};
use crate::features::imports::handlers::{__path_import_sessions, import_sessions};
use crate::features::messages::handlers::{
    __path_list_messages, __path_post_message, list_messages, post_message,
};
use crate::features::messages::models::AgentContext;
use crate::features::organizations::handlers::{
    __path_accept_invitation, __path_create_invitation, __path_create_organization,
    __path_delete_member, __path_get_current_organization, __path_list_current_members,
    __path_update_current_organization, __path_update_member, accept_invitation, create_invitation,
    create_organization, delete_member, get_current_organization, list_current_members,
    update_current_organization, update_member,
};
use crate::features::organizations::models::{
    CreateInvitationRequest, CreateOrganizationRequest, CurrentOrganizationResponse,
    InvitationResponse, Organization, OrganizationMember, OrganizationMembersResponse,
    UpdateMemberRequest, UpdateOrganizationRequest,
};
use crate::features::outputs::handlers::{
    __path_create_output, __path_delete_output, __path_list_outputs, create_output, delete_output,
    list_outputs,
};
use crate::features::outputs::models::CreateOutputRequest;
use crate::features::product_config::handlers::{
    __path_get_product_config, __path_reset_product_config, __path_update_product_config,
    get_product_config, reset_product_config, update_product_config,
};
use crate::features::product_config::models::{ProductConfig, UpdateProductConfigRequest};
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
use crate::features::test_cases::models::{CreateTestCaseRequest, TestCaseResponse};
use crate::models::{
    Evaluation, FeatureMockup, HistoryItem, ManagerComment, Message, MessageRole, MessageTag,
    Mission, MissionStatus, Output, OutputKind, ProgressFlags, Scenario, ScenarioDiscipline,
    ScenarioType, Session, SessionStatus, TestCase,
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
        list_outputs,
        create_output,
        delete_output,
        create_organization,
        get_current_organization,
        update_current_organization,
        list_current_members,
        create_invitation,
        accept_invitation,
        update_member,
        delete_member,
        get_my_entitlements,
        get_my_credits,
        checkout_individual,
        create_portal_session,
        stripe_webhook,
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
        Output,
        OutputKind,
        CreateOutputRequest,
        Organization,
        OrganizationMember,
        CurrentOrganizationResponse,
        OrganizationMembersResponse,
        InvitationResponse,
        CreateOrganizationRequest,
        UpdateOrganizationRequest,
        CreateInvitationRequest,
        UpdateMemberRequest,
        TestCase,
        TestCaseResponse,
        CreateTestCaseRequest,
        crate::models::ProductInfo,
        AgentContext,
        ProductConfig,
        UpdateProductConfigRequest,
        EntitlementResponse,
        PlanCode,
        CreditBalanceResponse,
        CreateBillingPortalSessionRequest,
        BillingPortalSessionResponse,
        CreateIndividualCheckoutRequest,
        IndividualCheckoutResponse,
        StripeWebhookResponse
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
        .route("/me/entitlements", get(get_my_entitlements))
        .route("/me/credits", get(get_my_credits))
        .route("/billing/checkout/individual", post(checkout_individual))
        .route("/billing/portal/session", post(create_portal_session))
        .route("/billing/webhook/stripe", post(stripe_webhook))
        .route(
            "/sessions/:id/messages",
            get(list_messages).post(post_message),
        )
        .route("/sessions/:id/evaluate", post(evaluate_session))
        .route(
            "/sessions/:id/comments",
            get(list_comments).post(create_comment),
        )
        .route(
            "/sessions/:id/outputs",
            get(list_outputs).post(create_output),
        )
        .route(
            "/sessions/:id/outputs/:outputId",
            axum::routing::delete(delete_output),
        )
        .route("/organizations", post(create_organization))
        .route(
            "/organizations/current",
            get(get_current_organization).patch(update_current_organization),
        )
        .route("/organizations/current/members", get(list_current_members))
        .route(
            "/organizations/current/invitations",
            post(create_invitation),
        )
        .route(
            "/organizations/current/invitations/:token/accept",
            post(accept_invitation),
        )
        .route(
            "/organizations/current/members/:memberId",
            axum::routing::patch(update_member).delete(delete_member),
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
