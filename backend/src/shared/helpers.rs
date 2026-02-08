use chrono::Utc;
use uuid::Uuid;

pub fn next_id(prefix: &str) -> String {
    format!("{prefix}-{}", Uuid::new_v4())
}

pub fn now_ts() -> String {
    Utc::now().to_rfc3339()
}

pub fn normalize_model_id(model_id: &str) -> String {
    model_id
        .strip_prefix("models/")
        .unwrap_or(model_id)
        .to_string()
}
