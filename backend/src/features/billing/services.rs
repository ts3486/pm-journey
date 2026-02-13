use axum::http::StatusCode;
use chrono::{TimeZone, Utc};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use serde_json::Value;
use sha2::Sha256;
use sqlx::{PgPool, Row};

use crate::error::{client_error, AppError};
use crate::features::entitlements::models::{Entitlement, PlanCode};
use crate::features::entitlements::repository::EntitlementRepository;
use crate::features::entitlements::services::EntitlementService;
use crate::features::feature_flags::services::FeatureFlagService;
use crate::shared::helpers::{next_id, now_ts};

use super::models::{
    BillingPortalSessionResponse, CreateBillingPortalSessionRequest,
    CreateIndividualCheckoutRequest, IndividualCheckoutResponse, StripeWebhookResponse,
};

#[derive(Clone)]
pub struct BillingService {
    pool: PgPool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum BillingProvider {
    Mock,
    Stripe,
}

#[derive(Debug, Deserialize)]
struct StripeCheckoutSessionResponse {
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StripeBillingPortalSessionResponse {
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StripeErrorEnvelope {
    error: StripeErrorObject,
}

#[derive(Debug, Deserialize)]
struct StripeErrorObject {
    message: Option<String>,
    code: Option<String>,
    #[serde(rename = "type")]
    error_type: Option<String>,
}

#[derive(Debug, Deserialize)]
struct StripeEventEnvelope {
    id: String,
    #[serde(rename = "type")]
    event_type: String,
    data: StripeEventData,
}

#[derive(Debug, Deserialize)]
struct StripeEventData {
    object: Value,
}

type HmacSha256 = Hmac<Sha256>;

const DEFAULT_APP_BASE_URL: &str = "http://localhost:5173";
const DEFAULT_STRIPE_API_BASE_URL: &str = "https://api.stripe.com";
const STRIPE_SIGNATURE_TOLERANCE_SECONDS: i64 = 300;

fn parse_billing_provider(raw: &str) -> Option<BillingProvider> {
    match raw.trim().to_ascii_lowercase().as_str() {
        "mock" => Some(BillingProvider::Mock),
        "stripe" => Some(BillingProvider::Stripe),
        _ => None,
    }
}

fn resolve_billing_provider() -> Result<BillingProvider, AppError> {
    let raw = std::env::var("BILLING_PROVIDER").unwrap_or_else(|_| "mock".to_string());
    parse_billing_provider(&raw).ok_or_else(|| {
        client_error(format!(
            "BILLING_PROVIDER_INVALID: unsupported billing provider `{}`",
            raw
        ))
    })
}

fn append_query(url: &mut String, key: &str, value: &str) {
    if value.is_empty() {
        return;
    }
    let separator = if url.contains('?') { '&' } else { '?' };
    url.push(separator);
    url.push_str(key);
    url.push('=');
    url.push_str(value);
}

fn build_mock_checkout_url_with_base(
    base_url: &str,
    user_id: &str,
    body: &CreateIndividualCheckoutRequest,
) -> String {
    let mut url = base_url.to_string();
    append_query(&mut url, "plan", "INDIVIDUAL");
    append_query(&mut url, "userId", user_id);
    append_query(&mut url, "checkoutRef", &next_id("checkout"));

    if let Some(success_url) = body.success_url.as_deref().map(str::trim) {
        append_query(&mut url, "successUrl", success_url);
    }
    if let Some(cancel_url) = body.cancel_url.as_deref().map(str::trim) {
        append_query(&mut url, "cancelUrl", cancel_url);
    }

    url
}

fn build_mock_checkout_url(user_id: &str, body: &CreateIndividualCheckoutRequest) -> String {
    let base_url = std::env::var("BILLING_MOCK_CHECKOUT_BASE_URL")
        .unwrap_or_else(|_| "https://billing.pm-journey.local/checkout".to_string());
    build_mock_checkout_url_with_base(&base_url, user_id, body)
}

fn trim_non_empty(value: &str) -> Option<String> {
    let trimmed = value.trim();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed.to_string())
    }
}

fn option_trim_non_empty(value: Option<&str>) -> Option<String> {
    value.and_then(trim_non_empty)
}

fn env_non_empty(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .and_then(|value| trim_non_empty(&value))
}

fn required_env_non_empty(key: &str) -> Result<String, AppError> {
    env_non_empty(key).ok_or_else(|| {
        client_error(format!(
            "STRIPE_CONFIG_MISSING: {} must be set when BILLING_PROVIDER=stripe",
            key
        ))
    })
}

fn ensure_http_url(value: String, name: &str) -> Result<String, AppError> {
    if value.starts_with("http://") || value.starts_with("https://") {
        return Ok(value);
    }

    Err(client_error(format!(
        "BILLING_URL_INVALID: {} must start with http:// or https://",
        name
    )))
}

fn resolve_stripe_secret_key() -> Result<String, AppError> {
    required_env_non_empty("STRIPE_SECRET_KEY")
}

fn resolve_stripe_individual_price_id() -> Result<String, AppError> {
    required_env_non_empty("STRIPE_PRICE_ID_INDIVIDUAL")
}

fn resolve_stripe_webhook_secret() -> Result<String, AppError> {
    required_env_non_empty("STRIPE_WEBHOOK_SECRET")
}

fn resolve_stripe_api_base_url() -> Result<String, AppError> {
    ensure_http_url(
        env_non_empty("STRIPE_API_BASE_URL")
            .unwrap_or_else(|| DEFAULT_STRIPE_API_BASE_URL.to_string()),
        "STRIPE_API_BASE_URL",
    )
}

fn default_checkout_return_url(status: &str) -> String {
    let app_base_url =
        env_non_empty("APP_BASE_URL").unwrap_or_else(|| DEFAULT_APP_BASE_URL.to_string());
    format!(
        "{}/pricing?checkout={}",
        app_base_url.trim_end_matches('/'),
        status
    )
}

fn default_portal_return_url() -> String {
    let app_base_url =
        env_non_empty("APP_BASE_URL").unwrap_or_else(|| DEFAULT_APP_BASE_URL.to_string());
    format!("{}/settings/billing", app_base_url.trim_end_matches('/'))
}

fn resolve_checkout_return_urls(
    body: &CreateIndividualCheckoutRequest,
) -> Result<(String, String), AppError> {
    let success_url = option_trim_non_empty(body.success_url.as_deref())
        .or_else(|| env_non_empty("STRIPE_CHECKOUT_SUCCESS_URL"))
        .unwrap_or_else(|| default_checkout_return_url("success"));
    let cancel_url = option_trim_non_empty(body.cancel_url.as_deref())
        .or_else(|| env_non_empty("STRIPE_CHECKOUT_CANCEL_URL"))
        .unwrap_or_else(|| default_checkout_return_url("cancel"));

    Ok((
        ensure_http_url(success_url, "success_url")?,
        ensure_http_url(cancel_url, "cancel_url")?,
    ))
}

fn resolve_portal_return_url(body: &CreateBillingPortalSessionRequest) -> Result<String, AppError> {
    let return_url = option_trim_non_empty(body.return_url.as_deref())
        .or_else(|| env_non_empty("STRIPE_PORTAL_RETURN_URL"))
        .unwrap_or_else(default_portal_return_url);

    ensure_http_url(return_url, "return_url")
}

fn parse_stripe_error_message(raw_body: &str) -> String {
    serde_json::from_str::<StripeErrorEnvelope>(raw_body)
        .ok()
        .and_then(|envelope| {
            envelope
                .error
                .message
                .or(envelope.error.code)
                .or(envelope.error.error_type)
        })
        .unwrap_or_else(|| raw_body.to_string())
}

fn parse_stripe_signature_header(header: &str) -> Result<(i64, Vec<String>), AppError> {
    let mut timestamp: Option<i64> = None;
    let mut signatures: Vec<String> = Vec::new();

    for part in header.split(',') {
        let mut pieces = part.trim().splitn(2, '=');
        let key = pieces.next().unwrap_or_default().trim();
        let value = pieces.next().unwrap_or_default().trim();

        if key == "t" {
            timestamp = value.parse::<i64>().ok();
        }
        if key == "v1" {
            signatures.push(value.to_string());
        }
    }

    let timestamp = timestamp.ok_or_else(|| {
        AppError::new(
            StatusCode::UNAUTHORIZED,
            anyhow::anyhow!("STRIPE_WEBHOOK_SIGNATURE_INVALID: missing timestamp"),
        )
    })?;

    if signatures.is_empty() {
        return Err(AppError::new(
            StatusCode::UNAUTHORIZED,
            anyhow::anyhow!("STRIPE_WEBHOOK_SIGNATURE_INVALID: missing v1 signature"),
        ));
    }

    Ok((timestamp, signatures))
}

fn compute_stripe_signature(
    secret: &str,
    timestamp: i64,
    payload: &[u8],
) -> Result<String, AppError> {
    let mut signed_payload = timestamp.to_string().into_bytes();
    signed_payload.push(b'.');
    signed_payload.extend_from_slice(payload);

    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|error| {
        AppError::new(
            StatusCode::INTERNAL_SERVER_ERROR,
            anyhow::anyhow!("STRIPE_HMAC_INIT_FAILED: {}", error),
        )
    })?;
    mac.update(&signed_payload);

    Ok(hex::encode(mac.finalize().into_bytes()))
}

fn verify_stripe_webhook_signature(
    payload: &[u8],
    header: &str,
    secret: &str,
) -> Result<(), AppError> {
    let (timestamp, signatures) = parse_stripe_signature_header(header)?;

    let now = Utc::now().timestamp();
    if (now - timestamp).abs() > STRIPE_SIGNATURE_TOLERANCE_SECONDS {
        return Err(AppError::new(
            StatusCode::UNAUTHORIZED,
            anyhow::anyhow!("STRIPE_WEBHOOK_SIGNATURE_INVALID: timestamp outside tolerance"),
        ));
    }

    let expected_signature = compute_stripe_signature(secret, timestamp, payload)?;
    let valid = signatures
        .iter()
        .any(|candidate| candidate.eq_ignore_ascii_case(&expected_signature));

    if !valid {
        return Err(AppError::new(
            StatusCode::UNAUTHORIZED,
            anyhow::anyhow!("STRIPE_WEBHOOK_SIGNATURE_INVALID: no matching signature"),
        ));
    }

    Ok(())
}

fn parse_plan_code(raw: Option<&str>) -> PlanCode {
    raw.and_then(PlanCode::from_str)
        .unwrap_or(PlanCode::Individual)
}

fn normalize_subscription_status(raw: Option<&str>) -> &'static str {
    match raw.unwrap_or_default() {
        "active" => "active",
        "trialing" => "trialing",
        "past_due" => "past_due",
        "incomplete" => "incomplete",
        "canceled" | "unpaid" | "incomplete_expired" => "canceled",
        _ => "incomplete",
    }
}

fn is_subscription_entitled_status(status: &str) -> bool {
    matches!(status, "active" | "trialing")
}

fn parse_unix_timestamp_to_utc(value: Option<i64>) -> Option<chrono::DateTime<Utc>> {
    value.and_then(|unix_seconds| Utc.timestamp_opt(unix_seconds, 0).single())
}

impl BillingService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn find_user_email(&self, user_id: &str) -> Result<Option<String>, AppError> {
        let row = sqlx::query("SELECT email FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|error| anyhow::anyhow!("Failed to load user email: {}", error))?;

        Ok(row
            .and_then(|record| record.try_get::<Option<String>, _>("email").ok())
            .flatten()
            .and_then(|email| trim_non_empty(&email)))
    }

    async fn find_user_id_by_stripe_customer(
        &self,
        provider_customer_id: &str,
    ) -> Result<Option<String>, AppError> {
        let row = sqlx::query(
            r#"
            SELECT user_id
            FROM billing_customers
            WHERE provider = 'stripe' AND provider_customer_id = $1
            LIMIT 1
            "#,
        )
        .bind(provider_customer_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to find user by Stripe customer: {}", error))?;

        Ok(row
            .and_then(|record| record.try_get::<Option<String>, _>("user_id").ok())
            .flatten())
    }

    async fn find_stripe_customer_for_user(
        &self,
        user_id: &str,
    ) -> Result<Option<String>, AppError> {
        let row = sqlx::query(
            r#"
            SELECT provider_customer_id
            FROM billing_customers
            WHERE user_id = $1 AND provider = 'stripe'
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to find Stripe customer for user: {}", error))?;

        Ok(row
            .and_then(|record| {
                record
                    .try_get::<Option<String>, _>("provider_customer_id")
                    .ok()
                    .flatten()
            })
            .and_then(|value| trim_non_empty(&value)))
    }

    async fn upsert_billing_customer(
        &self,
        user_id: &str,
        provider_customer_id: &str,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            INSERT INTO billing_customers (id, user_id, provider, provider_customer_id)
            VALUES ($1, $2, 'stripe', $3)
            ON CONFLICT (user_id)
            DO UPDATE SET
                provider = EXCLUDED.provider,
                provider_customer_id = EXCLUDED.provider_customer_id,
                updated_at = NOW()
            "#,
        )
        .bind(next_id("billing-customer"))
        .bind(user_id)
        .bind(provider_customer_id)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to upsert billing customer: {}", error))?;

        Ok(())
    }

    async fn upsert_subscription(
        &self,
        user_id: &str,
        provider_subscription_id: &str,
        status: &str,
        plan_code: &PlanCode,
        current_period_start: Option<chrono::DateTime<Utc>>,
        current_period_end: Option<chrono::DateTime<Utc>>,
        cancel_at_period_end: bool,
    ) -> Result<(), AppError> {
        let existing = sqlx::query(
            r#"
            SELECT id
            FROM subscriptions
            WHERE provider = 'stripe' AND provider_subscription_id = $1
            ORDER BY updated_at DESC
            LIMIT 1
            "#,
        )
        .bind(provider_subscription_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to find subscription: {}", error))?;

        if let Some(row) = existing {
            let subscription_id = row
                .try_get::<String, _>("id")
                .map_err(|error| anyhow::anyhow!("Failed to read subscription id: {}", error))?;

            sqlx::query(
                r#"
                UPDATE subscriptions
                SET
                    user_id = $2,
                    status = $3,
                    plan_code = $4,
                    seat_quantity = NULL,
                    current_period_start = $5,
                    current_period_end = $6,
                    cancel_at_period_end = $7,
                    updated_at = NOW()
                WHERE id = $1
                "#,
            )
            .bind(subscription_id)
            .bind(user_id)
            .bind(status)
            .bind(plan_code.as_str())
            .bind(current_period_start)
            .bind(current_period_end)
            .bind(cancel_at_period_end)
            .execute(&self.pool)
            .await
            .map_err(|error| anyhow::anyhow!("Failed to update subscription: {}", error))?;

            return Ok(());
        }

        sqlx::query(
            r#"
            INSERT INTO subscriptions (
                id,
                user_id,
                organization_id,
                provider,
                provider_subscription_id,
                status,
                plan_code,
                seat_quantity,
                current_period_start,
                current_period_end,
                cancel_at_period_end
            )
            VALUES ($1, $2, NULL, 'stripe', $3, $4, $5, NULL, $6, $7, $8)
            "#,
        )
        .bind(next_id("subscription"))
        .bind(user_id)
        .bind(provider_subscription_id)
        .bind(status)
        .bind(plan_code.as_str())
        .bind(current_period_start)
        .bind(current_period_end)
        .bind(cancel_at_period_end)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to insert subscription: {}", error))?;

        Ok(())
    }

    async fn sync_user_entitlement_from_subscription(
        &self,
        user_id: &str,
        provider_subscription_id: &str,
        plan_code: &PlanCode,
        status: &str,
    ) -> Result<(), AppError> {
        if is_subscription_entitled_status(status) {
            sqlx::query(
                r#"
                UPDATE entitlements
                SET status = 'canceled', valid_until = COALESCE(valid_until, NOW())
                WHERE scope_type = 'user'
                  AND scope_id = $1
                  AND source_subscription_id = $2
                  AND status = 'active'
                  AND plan_code <> $3
                "#,
            )
            .bind(user_id)
            .bind(provider_subscription_id)
            .bind(plan_code.as_str())
            .execute(&self.pool)
            .await
            .map_err(|error| anyhow::anyhow!("Failed to update old entitlements: {}", error))?;

            let existing = sqlx::query(
                r#"
                SELECT id
                FROM entitlements
                WHERE scope_type = 'user'
                  AND scope_id = $1
                  AND source_subscription_id = $2
                  AND status = 'active'
                  AND plan_code = $3
                  AND valid_from <= NOW()
                  AND (valid_until IS NULL OR valid_until > NOW())
                LIMIT 1
                "#,
            )
            .bind(user_id)
            .bind(provider_subscription_id)
            .bind(plan_code.as_str())
            .fetch_optional(&self.pool)
            .await
            .map_err(|error| anyhow::anyhow!("Failed to check existing entitlement: {}", error))?;

            if existing.is_none() {
                let entitlement_repo = EntitlementRepository::new(self.pool.clone());
                let entitlement = Entitlement {
                    id: next_id("entitlement"),
                    scope_type: "user".to_string(),
                    scope_id: user_id.to_string(),
                    plan_code: plan_code.clone(),
                    status: "active".to_string(),
                    valid_from: now_ts(),
                    valid_until: None,
                    source_subscription_id: Some(provider_subscription_id.to_string()),
                };
                entitlement_repo
                    .create(&entitlement)
                    .await
                    .map_err(|error| anyhow::anyhow!("Failed to create entitlement: {}", error))?;
            }

            return Ok(());
        }

        sqlx::query(
            r#"
            UPDATE entitlements
            SET status = 'canceled', valid_until = COALESCE(valid_until, NOW())
            WHERE scope_type = 'user'
              AND scope_id = $1
              AND source_subscription_id = $2
              AND status = 'active'
            "#,
        )
        .bind(user_id)
        .bind(provider_subscription_id)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to deactivate entitlements: {}", error))?;

        Ok(())
    }

    async fn create_stripe_checkout_url(
        &self,
        user_id: &str,
        body: &CreateIndividualCheckoutRequest,
    ) -> Result<String, AppError> {
        let secret_key = resolve_stripe_secret_key()?;
        let api_base_url = resolve_stripe_api_base_url()?;
        let individual_price_id = resolve_stripe_individual_price_id()?;
        let (success_url, cancel_url) = resolve_checkout_return_urls(body)?;
        let user_email = self.find_user_email(user_id).await?;

        let mut form = vec![
            ("mode".to_string(), "subscription".to_string()),
            (
                "line_items[0][price]".to_string(),
                individual_price_id.clone(),
            ),
            ("line_items[0][quantity]".to_string(), "1".to_string()),
            ("success_url".to_string(), success_url),
            ("cancel_url".to_string(), cancel_url),
            ("client_reference_id".to_string(), user_id.to_string()),
            ("metadata[user_id]".to_string(), user_id.to_string()),
            (
                "metadata[plan_code]".to_string(),
                PlanCode::Individual.as_str().to_string(),
            ),
            (
                "subscription_data[metadata][user_id]".to_string(),
                user_id.to_string(),
            ),
            (
                "subscription_data[metadata][plan_code]".to_string(),
                PlanCode::Individual.as_str().to_string(),
            ),
        ];
        if let Some(email) = user_email {
            form.push(("customer_email".to_string(), email));
        }

        let idempotency_key = next_id("stripe-checkout");
        let endpoint = format!(
            "{}/v1/checkout/sessions",
            api_base_url.trim_end_matches('/')
        );

        let response = reqwest::Client::new()
            .post(endpoint)
            .bearer_auth(secret_key)
            .header("Idempotency-Key", idempotency_key)
            .form(&form)
            .send()
            .await
            .map_err(|error| {
                AppError::new(
                    StatusCode::BAD_GATEWAY,
                    anyhow::anyhow!("STRIPE_REQUEST_FAILED: {}", error),
                )
            })?;

        let status = response.status();
        let response_body = response.text().await.map_err(|error| {
            AppError::new(
                StatusCode::BAD_GATEWAY,
                anyhow::anyhow!("STRIPE_RESPONSE_READ_FAILED: {}", error),
            )
        })?;

        if !status.is_success() {
            let stripe_message = parse_stripe_error_message(&response_body);
            let app_status = if status.is_client_error() {
                StatusCode::UNPROCESSABLE_ENTITY
            } else {
                StatusCode::BAD_GATEWAY
            };

            return Err(AppError::new(
                app_status,
                anyhow::anyhow!("STRIPE_CHECKOUT_FAILED: {}", stripe_message),
            ));
        }

        let checkout_response = serde_json::from_str::<StripeCheckoutSessionResponse>(
            &response_body,
        )
        .map_err(|error| {
            AppError::new(
                StatusCode::BAD_GATEWAY,
                anyhow::anyhow!("STRIPE_RESPONSE_PARSE_FAILED: {}", error),
            )
        })?;

        let checkout_url = checkout_response
            .url
            .and_then(|url| trim_non_empty(&url))
            .ok_or_else(|| {
                AppError::new(
                    StatusCode::BAD_GATEWAY,
                    anyhow::anyhow!(
                        "STRIPE_CHECKOUT_FAILED: stripe response did not include checkout URL"
                    ),
                )
            })?;

        Ok(checkout_url)
    }

    async fn create_stripe_portal_url(
        &self,
        user_id: &str,
        body: &CreateBillingPortalSessionRequest,
    ) -> Result<String, AppError> {
        let secret_key = resolve_stripe_secret_key()?;
        let api_base_url = resolve_stripe_api_base_url()?;
        let return_url = resolve_portal_return_url(body)?;
        let customer_id = self
            .find_stripe_customer_for_user(user_id)
            .await?
            .ok_or_else(|| {
                client_error("BILLING_PORTAL_UNAVAILABLE: no Stripe customer found for this user")
            })?;

        let endpoint = format!(
            "{}/v1/billing_portal/sessions",
            api_base_url.trim_end_matches('/')
        );
        let response = reqwest::Client::new()
            .post(endpoint)
            .bearer_auth(secret_key)
            .form(&[("customer", customer_id), ("return_url", return_url)])
            .send()
            .await
            .map_err(|error| {
                AppError::new(
                    StatusCode::BAD_GATEWAY,
                    anyhow::anyhow!("STRIPE_REQUEST_FAILED: {}", error),
                )
            })?;

        let status = response.status();
        let response_body = response.text().await.map_err(|error| {
            AppError::new(
                StatusCode::BAD_GATEWAY,
                anyhow::anyhow!("STRIPE_RESPONSE_READ_FAILED: {}", error),
            )
        })?;

        if !status.is_success() {
            return Err(AppError::new(
                if status.is_client_error() {
                    StatusCode::UNPROCESSABLE_ENTITY
                } else {
                    StatusCode::BAD_GATEWAY
                },
                anyhow::anyhow!(
                    "STRIPE_PORTAL_SESSION_FAILED: {}",
                    parse_stripe_error_message(&response_body)
                ),
            ));
        }

        let session_response = serde_json::from_str::<StripeBillingPortalSessionResponse>(
            &response_body,
        )
        .map_err(|error| {
            AppError::new(
                StatusCode::BAD_GATEWAY,
                anyhow::anyhow!("STRIPE_RESPONSE_PARSE_FAILED: {}", error),
            )
        })?;

        session_response
            .url
            .and_then(|url| trim_non_empty(&url))
            .ok_or_else(|| {
                AppError::new(
                    StatusCode::BAD_GATEWAY,
                    anyhow::anyhow!(
                        "STRIPE_PORTAL_SESSION_FAILED: stripe response did not include URL"
                    ),
                )
            })
    }

    async fn record_stripe_event(
        &self,
        event: &StripeEventEnvelope,
        payload: &Value,
    ) -> Result<bool, AppError> {
        let result = sqlx::query(
            r#"
            INSERT INTO stripe_events (event_id, event_type, payload, status)
            VALUES ($1, $2, $3, 'received')
            ON CONFLICT (event_id) DO NOTHING
            "#,
        )
        .bind(&event.id)
        .bind(&event.event_type)
        .bind(payload)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to persist Stripe event: {}", error))?;

        Ok(result.rows_affected() > 0)
    }

    async fn mark_stripe_event_processed(&self, event_id: &str) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE stripe_events
            SET status = 'processed', processed_at = NOW(), last_error = NULL
            WHERE event_id = $1
            "#,
        )
        .bind(event_id)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to mark Stripe event processed: {}", error))?;

        Ok(())
    }

    async fn mark_stripe_event_failed(
        &self,
        event_id: &str,
        message: &str,
    ) -> Result<(), AppError> {
        sqlx::query(
            r#"
            UPDATE stripe_events
            SET status = 'failed', processed_at = NOW(), last_error = $2
            WHERE event_id = $1
            "#,
        )
        .bind(event_id)
        .bind(message)
        .execute(&self.pool)
        .await
        .map_err(|error| anyhow::anyhow!("Failed to mark Stripe event failed: {}", error))?;

        Ok(())
    }

    async fn handle_checkout_session_completed(&self, object: &Value) -> Result<(), AppError> {
        let mode = object.get("mode").and_then(|value| value.as_str());
        if mode != Some("subscription") {
            return Ok(());
        }

        let subscription_id = object
            .get("subscription")
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .ok_or_else(|| {
                client_error("STRIPE_WEBHOOK_PAYLOAD_INVALID: missing subscription id")
            })?;
        let customer_id = object
            .get("customer")
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .ok_or_else(|| client_error("STRIPE_WEBHOOK_PAYLOAD_INVALID: missing customer id"))?;

        let user_id = object
            .get("client_reference_id")
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .or_else(|| {
                object
                    .get("metadata")
                    .and_then(|value| value.get("user_id"))
                    .and_then(|value| value.as_str())
                    .and_then(trim_non_empty)
            })
            .or(self.find_user_id_by_stripe_customer(&customer_id).await?)
            .ok_or_else(|| {
                client_error(
                    "STRIPE_WEBHOOK_PAYLOAD_INVALID: missing user reference for checkout session",
                )
            })?;

        let plan_code = parse_plan_code(
            object
                .get("metadata")
                .and_then(|value| value.get("plan_code"))
                .and_then(|value| value.as_str()),
        );

        let status = "active";
        self.upsert_billing_customer(&user_id, &customer_id).await?;
        self.upsert_subscription(
            &user_id,
            &subscription_id,
            status,
            &plan_code,
            None,
            None,
            false,
        )
        .await?;
        self.sync_user_entitlement_from_subscription(
            &user_id,
            &subscription_id,
            &plan_code,
            status,
        )
        .await?;

        Ok(())
    }

    async fn handle_customer_subscription_event(&self, object: &Value) -> Result<(), AppError> {
        let subscription_id = object
            .get("id")
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .ok_or_else(|| {
                client_error("STRIPE_WEBHOOK_PAYLOAD_INVALID: missing subscription id")
            })?;
        let customer_id = object
            .get("customer")
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .ok_or_else(|| client_error("STRIPE_WEBHOOK_PAYLOAD_INVALID: missing customer id"))?;

        let user_id = object
            .get("metadata")
            .and_then(|value| value.get("user_id"))
            .and_then(|value| value.as_str())
            .and_then(trim_non_empty)
            .or(self.find_user_id_by_stripe_customer(&customer_id).await?)
            .ok_or_else(|| {
                client_error("STRIPE_WEBHOOK_PAYLOAD_INVALID: no user mapping for subscription")
            })?;

        let plan_code = parse_plan_code(
            object
                .get("metadata")
                .and_then(|value| value.get("plan_code"))
                .and_then(|value| value.as_str()),
        );
        let status =
            normalize_subscription_status(object.get("status").and_then(|value| value.as_str()));
        let current_period_start = parse_unix_timestamp_to_utc(
            object
                .get("current_period_start")
                .and_then(|value| value.as_i64()),
        );
        let current_period_end = parse_unix_timestamp_to_utc(
            object
                .get("current_period_end")
                .and_then(|value| value.as_i64()),
        );
        let cancel_at_period_end = object
            .get("cancel_at_period_end")
            .and_then(|value| value.as_bool())
            .unwrap_or(false);

        self.upsert_billing_customer(&user_id, &customer_id).await?;
        self.upsert_subscription(
            &user_id,
            &subscription_id,
            status,
            &plan_code,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
        )
        .await?;
        self.sync_user_entitlement_from_subscription(
            &user_id,
            &subscription_id,
            &plan_code,
            status,
        )
        .await?;

        Ok(())
    }

    async fn process_stripe_event(&self, event: &StripeEventEnvelope) -> Result<(), AppError> {
        match event.event_type.as_str() {
            "checkout.session.completed" => {
                self.handle_checkout_session_completed(&event.data.object)
                    .await?
            }
            "customer.subscription.created"
            | "customer.subscription.updated"
            | "customer.subscription.deleted" => {
                self.handle_customer_subscription_event(&event.data.object)
                    .await?
            }
            _ => {
                // Ignore unrelated webhook events.
            }
        }

        Ok(())
    }

    pub async fn create_individual_checkout(
        &self,
        user_id: &str,
        body: CreateIndividualCheckoutRequest,
    ) -> Result<IndividualCheckoutResponse, AppError> {
        if !FeatureFlagService::new().is_billing_enabled() {
            return Err(AppError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                anyhow::anyhow!("BILLING_DISABLED: billing feature is disabled"),
            ));
        }

        let entitlement_service = EntitlementService::new(self.pool.clone());
        let effective_plan = entitlement_service.resolve_effective_plan(user_id).await?;
        if matches!(
            effective_plan.plan_code,
            PlanCode::Individual | PlanCode::Team
        ) {
            return Ok(IndividualCheckoutResponse {
                mode: "none".to_string(),
                checkout_url: None,
                already_entitled: true,
                message: Some(
                    "ALREADY_ENTITLED: plan already grants individual access".to_string(),
                ),
            });
        }

        match resolve_billing_provider()? {
            BillingProvider::Mock => Ok(IndividualCheckoutResponse {
                mode: "mock".to_string(),
                checkout_url: Some(build_mock_checkout_url(user_id, &body)),
                already_entitled: false,
                message: Some("CHECKOUT_SESSION_CREATED: mock checkout url issued".to_string()),
            }),
            BillingProvider::Stripe => {
                let checkout_url = self.create_stripe_checkout_url(user_id, &body).await?;
                Ok(IndividualCheckoutResponse {
                    mode: "stripe".to_string(),
                    checkout_url: Some(checkout_url),
                    already_entitled: false,
                    message: Some(
                        "CHECKOUT_SESSION_CREATED: stripe checkout session created".to_string(),
                    ),
                })
            }
        }
    }

    pub async fn create_billing_portal_session(
        &self,
        user_id: &str,
        body: CreateBillingPortalSessionRequest,
    ) -> Result<BillingPortalSessionResponse, AppError> {
        if !FeatureFlagService::new().is_billing_enabled() {
            return Err(AppError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                anyhow::anyhow!("BILLING_DISABLED: billing feature is disabled"),
            ));
        }

        match resolve_billing_provider()? {
            BillingProvider::Mock => Err(client_error(
                "BILLING_PORTAL_UNAVAILABLE: billing portal requires BILLING_PROVIDER=stripe",
            )),
            BillingProvider::Stripe => {
                let url = self.create_stripe_portal_url(user_id, &body).await?;
                Ok(BillingPortalSessionResponse { url })
            }
        }
    }

    pub async fn handle_stripe_webhook(
        &self,
        signature_header: Option<&str>,
        payload: &[u8],
    ) -> Result<StripeWebhookResponse, AppError> {
        if !FeatureFlagService::new().is_billing_enabled() {
            return Err(AppError::new(
                StatusCode::SERVICE_UNAVAILABLE,
                anyhow::anyhow!("BILLING_DISABLED: billing feature is disabled"),
            ));
        }
        if !matches!(resolve_billing_provider()?, BillingProvider::Stripe) {
            return Err(client_error(
                "BILLING_PROVIDER_UNSUPPORTED: stripe webhook requires BILLING_PROVIDER=stripe",
            ));
        }

        let stripe_webhook_secret = resolve_stripe_webhook_secret()?;
        let signature_header = signature_header.ok_or_else(|| {
            AppError::new(
                StatusCode::UNAUTHORIZED,
                anyhow::anyhow!("STRIPE_WEBHOOK_SIGNATURE_MISSING"),
            )
        })?;
        verify_stripe_webhook_signature(payload, signature_header, &stripe_webhook_secret)?;

        let payload_json = serde_json::from_slice::<Value>(payload)
            .map_err(|error| client_error(format!("STRIPE_WEBHOOK_PAYLOAD_INVALID: {}", error)))?;
        let event = serde_json::from_value::<StripeEventEnvelope>(payload_json.clone())
            .map_err(|error| client_error(format!("STRIPE_WEBHOOK_PAYLOAD_INVALID: {}", error)))?;

        let inserted = self.record_stripe_event(&event, &payload_json).await?;
        if !inserted {
            return Ok(StripeWebhookResponse {
                received: true,
                duplicate: true,
                event_type: Some(event.event_type),
            });
        }

        if let Err(process_error) = self.process_stripe_event(&event).await {
            let error_message = format!("{:?}", process_error);
            let _ = self
                .mark_stripe_event_failed(&event.id, &error_message)
                .await;
            return Err(AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow::anyhow!("STRIPE_WEBHOOK_PROCESSING_FAILED: {}", error_message),
            ));
        }

        self.mark_stripe_event_processed(&event.id).await?;

        Ok(StripeWebhookResponse {
            received: true,
            duplicate: false,
            event_type: Some(event.event_type),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::{
        build_mock_checkout_url_with_base, compute_stripe_signature, parse_billing_provider,
        resolve_checkout_return_urls, verify_stripe_webhook_signature, BillingProvider,
    };
    use crate::features::billing::models::CreateIndividualCheckoutRequest;

    #[test]
    fn parse_provider_accepts_mock_and_stripe() {
        assert_eq!(parse_billing_provider("mock"), Some(BillingProvider::Mock));
        assert_eq!(
            parse_billing_provider("stripe"),
            Some(BillingProvider::Stripe)
        );
        assert_eq!(
            parse_billing_provider("STRIPE"),
            Some(BillingProvider::Stripe)
        );
    }

    #[test]
    fn parse_provider_rejects_unknown_values() {
        assert_eq!(parse_billing_provider(""), None);
        assert_eq!(parse_billing_provider("manual"), None);
        assert_eq!(parse_billing_provider("unknown"), None);
    }

    #[test]
    fn mock_checkout_url_contains_expected_query_params() {
        let request = CreateIndividualCheckoutRequest {
            success_url: Some("https://app.example/success".to_string()),
            cancel_url: Some("https://app.example/cancel".to_string()),
        };
        let url = build_mock_checkout_url_with_base(
            "https://billing.example/checkout",
            "auth0|demo-user",
            &request,
        );

        assert!(url.starts_with("https://billing.example/checkout?"));
        assert!(url.contains("plan=INDIVIDUAL"));
        assert!(url.contains("userId=auth0|demo-user"));
        assert!(url.contains("checkoutRef=checkout-"));
        assert!(url.contains("successUrl=https://app.example/success"));
        assert!(url.contains("cancelUrl=https://app.example/cancel"));
    }

    #[test]
    fn checkout_return_urls_use_defaults() {
        unsafe {
            std::env::remove_var("APP_BASE_URL");
            std::env::remove_var("STRIPE_CHECKOUT_SUCCESS_URL");
            std::env::remove_var("STRIPE_CHECKOUT_CANCEL_URL");
        }

        let request = CreateIndividualCheckoutRequest {
            success_url: None,
            cancel_url: None,
        };
        let (success_url, cancel_url) =
            resolve_checkout_return_urls(&request).expect("default checkout urls");

        assert_eq!(
            success_url,
            "http://localhost:5173/pricing?checkout=success"
        );
        assert_eq!(cancel_url, "http://localhost:5173/pricing?checkout=cancel");
    }

    #[test]
    fn checkout_return_urls_reject_non_http_scheme() {
        let request = CreateIndividualCheckoutRequest {
            success_url: Some("file:///tmp/success".to_string()),
            cancel_url: Some("https://app.example/cancel".to_string()),
        };

        assert!(resolve_checkout_return_urls(&request).is_err());
    }

    #[test]
    fn webhook_signature_verification_accepts_valid_signature() {
        let payload = br#"{"id":"evt_test"}"#;
        let secret = "whsec_test_secret";
        let timestamp = chrono::Utc::now().timestamp();
        let signature = compute_stripe_signature(secret, timestamp, payload).expect("signature");
        let header = format!("t={},v1={}", timestamp, signature);

        assert!(verify_stripe_webhook_signature(payload, &header, secret).is_ok());
    }

    #[test]
    fn webhook_signature_verification_rejects_invalid_signature() {
        let payload = br#"{"id":"evt_test"}"#;
        let secret = "whsec_test_secret";
        let timestamp = chrono::Utc::now().timestamp();
        let header = format!("t={},v1=invalid", timestamp);

        assert!(verify_stripe_webhook_signature(payload, &header, secret).is_err());
    }
}
