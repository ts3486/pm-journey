use anyhow::{anyhow, Context, Result};
use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::{decode, decode_header, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::{error::AppError, state::SharedState};

/// JWKS keys cache - maps key ID (kid) to RSA decoding key
#[derive(Clone)]
pub struct JwksKeys {
    keys: HashMap<String, DecodingKey>,
}

/// Structure for a single JWK (JSON Web Key)
#[derive(Debug, Deserialize)]
struct Jwk {
    kty: String,
    kid: String,
    n: String,
    e: String,
}

/// JWKS response from Auth0
#[derive(Debug, Deserialize)]
struct JwksResponse {
    keys: Vec<Jwk>,
}

/// Fetch JWKS from Auth0 and build a key cache
pub async fn fetch_jwks(domain: &str) -> Result<JwksKeys> {
    let url = format!("https://{}/.well-known/jwks.json", domain);

    tracing::info!("Fetching JWKS from {}", url);

    let response = reqwest::get(&url).await.context("Failed to fetch JWKS")?;

    let jwks: JwksResponse = response
        .json()
        .await
        .context("Failed to parse JWKS response")?;

    let mut keys = HashMap::new();

    for jwk in jwks.keys {
        if jwk.kty != "RSA" {
            tracing::warn!("Skipping non-RSA key: {}", jwk.kid);
            continue;
        }

        let decoding_key = DecodingKey::from_rsa_components(&jwk.n, &jwk.e).context(format!(
            "Failed to create decoding key for kid: {}",
            jwk.kid
        ))?;

        keys.insert(jwk.kid.clone(), decoding_key);
        tracing::debug!("Loaded JWKS key: {}", jwk.kid);
    }

    tracing::info!("Successfully loaded {} JWKS keys", keys.len());

    Ok(JwksKeys { keys })
}

impl JwksKeys {
    #[allow(dead_code)]
    pub fn from_keys(keys: HashMap<String, DecodingKey>) -> Self {
        Self { keys }
    }

    #[allow(dead_code)]
    pub fn from_single(kid: &str, decoding_key: DecodingKey) -> Self {
        let mut keys = HashMap::new();
        keys.insert(kid.to_string(), decoding_key);
        Self { keys }
    }

    /// Get a decoding key by kid
    pub fn get(&self, kid: &str) -> Option<&DecodingKey> {
        self.keys.get(kid)
    }
}

/// Authenticated user extracted from JWT
#[derive(Clone, Debug)]
#[allow(dead_code)]
pub struct AuthUser {
    pub user_id: String,
    pub email: Option<String>,
    pub name: Option<String>,
}

/// JWT Claims structure
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: Option<String>,
    name: Option<String>,
    picture: Option<String>,
    iss: String,
    aud: serde_json::Value,
    exp: usize,
}

#[async_trait]
impl FromRequestParts<SharedState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &SharedState,
    ) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| {
                AppError::new(
                    StatusCode::UNAUTHORIZED,
                    anyhow!("Missing Authorization header"),
                )
            })?;

        // Extract Bearer token
        let token = auth_header.strip_prefix("Bearer ").ok_or_else(|| {
            AppError::new(
                StatusCode::UNAUTHORIZED,
                anyhow!("Invalid Authorization header format"),
            )
        })?;

        // Decode JWT header to get kid
        let header = decode_header(token).map_err(|e| {
            AppError::new(
                StatusCode::UNAUTHORIZED,
                anyhow!("Invalid JWT header: {}", e),
            )
        })?;

        let kid = header.kid.ok_or_else(|| {
            AppError::new(
                StatusCode::UNAUTHORIZED,
                anyhow!("Missing kid in JWT header"),
            )
        })?;

        // Get the decoding key from JWKS
        let jwks = state.jwks();
        let decoding_key = jwks.get(&kid).ok_or_else(|| {
            AppError::new(StatusCode::UNAUTHORIZED, anyhow!("Unknown kid: {}", kid))
        })?;

        // Get Auth0 config from environment
        let auth0_domain = std::env::var("AUTH0_DOMAIN").map_err(|_| {
            AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow!("AUTH0_DOMAIN not configured"),
            )
        })?;
        let auth0_audience = std::env::var("AUTH0_AUDIENCE").map_err(|_| {
            AppError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                anyhow!("AUTH0_AUDIENCE not configured"),
            )
        })?;

        // Set up validation
        let mut validation = Validation::new(Algorithm::RS256);
        validation.set_issuer(&[format!("https://{}/", auth0_domain)]);
        validation.set_audience(&[auth0_audience]);

        // Decode and validate JWT
        let token_data = decode::<Claims>(token, decoding_key, &validation).map_err(|e| {
            tracing::warn!("JWT validation failed: {}", e);
            AppError::new(
                StatusCode::UNAUTHORIZED,
                anyhow!("Invalid or expired token: {}", e),
            )
        })?;

        let claims = token_data.claims;

        // Ensure the user exists (or is refreshed) in our local users table.
        state
            .services()
            .users()
            .upsert_user(
                &claims.sub,
                claims.email.as_deref(),
                claims.name.as_deref(),
                claims.picture.as_deref(),
            )
            .await
            .map_err(|e| {
                AppError::new(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    anyhow!("Failed to upsert user: {:?}", e),
                )
            })?;

        Ok(AuthUser {
            user_id: claims.sub,
            email: claims.email,
            name: claims.name,
        })
    }
}
