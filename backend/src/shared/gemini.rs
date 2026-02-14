use crate::error::{anyhow_error, AppError};
use crate::features::entitlements::models::PlanCode;
use crate::shared::helpers::normalize_model_id;

#[derive(Debug, Clone)]
pub struct GeminiCredentials {
    pub api_key: String,
    pub model_id: String,
}

fn first_non_empty_env(keys: &[&str]) -> Option<String> {
    keys.iter().find_map(|key| {
        std::env::var(key)
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
    })
}

pub fn resolve_chat_credentials(
    plan_code: &PlanCode,
    requested_model: Option<&str>,
) -> Result<GeminiCredentials, AppError> {
    let api_key = match plan_code {
        PlanCode::Team => first_non_empty_env(&[
            "GEMINI_API_KEY_TEAM",
            "GEMINI_API_KEY",
            "NEXT_PUBLIC_GEMINI_API_KEY",
        ]),
        PlanCode::Free => first_non_empty_env(&[
            "GEMINI_API_KEY_FREE_TIER",
            "GEMINI_API_KEY",
            "NEXT_PUBLIC_GEMINI_API_KEY",
        ]),
    }
    .ok_or_else(|| anyhow_error("GEMINI_API_KEY is not set"))?;

    let default_model = match plan_code {
        PlanCode::Team => {
            first_non_empty_env(&["GEMINI_DEFAULT_MODEL_TEAM", "GEMINI_DEFAULT_MODEL"])
        }
        PlanCode::Free => {
            first_non_empty_env(&["GEMINI_DEFAULT_MODEL_FREE_TIER", "GEMINI_DEFAULT_MODEL"])
        }
    }
    .unwrap_or_else(|| "gemini-3-flash-preview".to_string());

    let model_id = normalize_model_id(requested_model.unwrap_or(default_model.as_str()));

    Ok(GeminiCredentials { api_key, model_id })
}

pub fn resolve_eval_credentials(
    plan_code: &PlanCode,
    requested_model: Option<&str>,
) -> Result<GeminiCredentials, AppError> {
    let api_key = match plan_code {
        PlanCode::Team => first_non_empty_env(&[
            "GEMINI_API_KEY_TEAM",
            "GEMINI_API_KEY",
            "NEXT_PUBLIC_GEMINI_API_KEY",
        ]),
        PlanCode::Free => first_non_empty_env(&[
            "GEMINI_API_KEY_FREE_TIER",
            "GEMINI_API_KEY",
            "NEXT_PUBLIC_GEMINI_API_KEY",
        ]),
    }
    .ok_or_else(|| anyhow_error("GEMINI_API_KEY is not set"))?;

    let default_model = match plan_code {
        PlanCode::Team => first_non_empty_env(&["GEMINI_EVAL_MODEL_TEAM", "GEMINI_EVAL_MODEL"]),
        PlanCode::Free => {
            first_non_empty_env(&["GEMINI_EVAL_MODEL_FREE_TIER", "GEMINI_EVAL_MODEL"])
        }
    }
    .unwrap_or_else(|| "gemini-3-flash-preview".to_string());

    let model_id = normalize_model_id(requested_model.unwrap_or(default_model.as_str()));

    Ok(GeminiCredentials { api_key, model_id })
}
