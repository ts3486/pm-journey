use reqwest::Client;
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use tracing::warn;

use crate::error::{anyhow_error, client_error, AppError};
use crate::features::evaluations::repository::EvaluationRepository;
use crate::features::messages::repository::MessageRepository;
use crate::features::sessions::repository::SessionRepository;
use crate::models::{
    default_scenarios, Evaluation, EvaluationCategory, Message, MessageRole, SessionStatus,
};
use crate::shared::helpers::{normalize_model_id, now_ts};

use super::models::{EvaluationCriterion, EvaluationRequest, ScoringGuidelines};

#[derive(Clone)]
pub struct EvaluationService {
    pool: PgPool,
}

impl EvaluationService {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn evaluate_session(
        &self,
        session_id: &str,
        request: EvaluationRequest,
    ) -> Result<Evaluation, AppError> {
        let session_repo = SessionRepository::new(self.pool.clone());
        let eval_repo = EvaluationRepository::new(self.pool.clone());
        let message_repo = MessageRepository::new(self.pool.clone());

        // Begin transaction
        let mut tx = self
            .pool
            .begin()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to begin transaction: {}", e)))?;

        // Get session
        let mut session = session_repo
            .get(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to get session: {}", e)))?
            .ok_or_else(|| anyhow_error("session not found"))?;

        let criteria = if let Some(criteria) = request.criteria.clone() {
            if criteria.is_empty() {
                None
            } else {
                Some(criteria)
            }
        } else {
            None
        };

        let criteria = if let Some(criteria) = criteria {
            criteria
        } else {
            let fallback = default_scenarios()
                .into_iter()
                .find(|s| s.id == session.scenario_id)
                .map(|s| {
                    s.evaluation_criteria
                        .into_iter()
                        .map(|c| EvaluationCriterion {
                            id: None,
                            name: c.name,
                            weight: c.weight,
                            description: String::new(),
                            scoring_guidelines: ScoringGuidelines {
                                excellent: String::new(),
                                good: String::new(),
                                needs_improvement: String::new(),
                                poor: String::new(),
                            },
                        })
                        .collect::<Vec<_>>()
                })
                .unwrap_or_default();
            fallback
        };

        if criteria.is_empty() {
            return Err(anyhow_error("evaluation criteria are missing"));
        }

        let messages = message_repo
            .list_by_session(session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to load messages: {}", e)))?;
        let has_evaluable_messages = messages.iter().any(|m| m.role != MessageRole::System);
        let has_test_cases = request
            .test_cases_context
            .as_ref()
            .is_some_and(|tc| !tc.trim().is_empty());
        if !has_evaluable_messages && !has_test_cases {
            return Err(client_error(
                "評価対象のメッセージまたはテストケースがありません。",
            ));
        }

        // Create evaluation via Gemini
        let eval = generate_ai_evaluation(&request, &criteria, &messages, session_id).await?;
        eval_repo
            .create_in_tx(&mut tx, &eval)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to create evaluation: {}", e)))?;

        // Update session status
        session.status = SessionStatus::Evaluated;
        session.evaluation_requested = true;
        session.last_activity_at = now_ts();
        session_repo
            .update_last_activity_in_tx(&mut tx, session_id)
            .await
            .map_err(|e| anyhow_error(&format!("Failed to update session: {}", e)))?;

        tx.commit()
            .await
            .map_err(|e| anyhow_error(&format!("Failed to commit transaction: {}", e)))?;

        Ok(eval)
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EvaluationOutputCategory {
    name: String,
    score: Option<f32>,
    feedback: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct EvaluationOutput {
    categories: Vec<EvaluationOutputCategory>,
    overall_score: Option<f32>,
    summary: Option<String>,
    improvement_advice: Option<String>,
}

fn build_evaluation_instruction(
    request: &EvaluationRequest,
    criteria: &[EvaluationCriterion],
    strict: bool,
) -> String {
    let mut sections = vec![
        "あなたは厳格な評価者です。評価対象はユーザーの発言のみです。アシスタントの発言は文脈として参照するだけにしてください。".to_string(),
        "以下の評価基準に基づいて採点し、JSONのみで出力してください。".to_string(),
    ];

    if let Some(title) = &request.scenario_title {
        sections.push(format!("シナリオ: {}", title));
    }
    if let Some(description) = &request.scenario_description {
        sections.push(format!("シナリオ概要: {}", description));
    }
    if let Some(prompt) = &request.scenario_prompt {
        sections.push(format!("シナリオ指示: {}", prompt));
    }
    if let Some(product_context) = &request.product_context {
        sections.push(product_context.clone());
    }
    if let Some(test_cases_context) = &request.test_cases_context {
        sections.push(format!("## 作成されたテストケース\n{}", test_cases_context));
    }

    let mut criteria_lines = Vec::new();
    criteria_lines.push("## 評価基準".to_string());
    for c in criteria {
        if let Some(id) = &c.id {
            criteria_lines.push(format!("- {} (ID: {}, 重み: {}%)", c.name, id, c.weight));
        } else {
            criteria_lines.push(format!("- {} (重み: {}%)", c.name, c.weight));
        }
        if !c.description.is_empty() {
            criteria_lines.push(format!("  - 説明: {}", c.description));
        }
        if !c.scoring_guidelines.excellent.is_empty()
            || !c.scoring_guidelines.good.is_empty()
            || !c.scoring_guidelines.needs_improvement.is_empty()
            || !c.scoring_guidelines.poor.is_empty()
        {
            criteria_lines.push(format!("  - Excellent: {}", c.scoring_guidelines.excellent));
            criteria_lines.push(format!("  - Good: {}", c.scoring_guidelines.good));
            criteria_lines.push(format!(
                "  - NeedsImprovement: {}",
                c.scoring_guidelines.needs_improvement
            ));
            criteria_lines.push(format!("  - Poor: {}", c.scoring_guidelines.poor));
        }
    }
    sections.push(criteria_lines.join("\n"));

    let passing_score = request.passing_score.unwrap_or(70.0);
    sections.push(format!("合格基準: {}点以上", passing_score));

    let mut output_rules = vec![
        "出力は**必ず**単一のJSONオブジェクトのみ。説明文・前置き・後置き・Markdown・コードブロックは禁止。".to_string(),
        "JSONはダブルクォートのみを使用し、末尾のカンマは禁止。".to_string(),
        "出力形式(JSONのみ): {\"categories\":[{\"name\":\"...\",\"score\":0-100,\"feedback\":\"...\"}],\"overallScore\":0-100,\"summary\":\"...\",\"improvementAdvice\":\"...\"}".to_string(),
        "- categoriesは基準と同名・同順・同数で出力する".to_string(),
        "- scoreは0〜100の数値。summary/improvementAdviceは空文字も可".to_string(),
        "- feedbackは各カテゴリ1文・全角120文字以内、summary/improvementAdviceは各1〜2文・全角160文字以内".to_string(),
    ];
    if strict {
        output_rules.push("- JSON以外の文字列や説明文は一切出力しない".to_string());
        output_rules.push("- ``` などのコードブロックは禁止".to_string());
        output_rules.push(
            "以下のJSONテンプレートの数値とコメントだけを埋めて返すこと。キーの追加・削除は禁止。"
                .to_string(),
        );
        let template = build_evaluation_template(criteria);
        output_rules.push(format!("JSONテンプレート:\n{}", template));
    }
    sections.push(output_rules.join("\n"));

    sections.join("\n\n")
}

fn extract_json_value(text: &str) -> Option<serde_json::Value> {
    let trimmed = text.trim();
    if let Ok(value) = serde_json::from_str::<serde_json::Value>(trimmed) {
        return Some(value);
    }
    for (start, _) in trimmed.match_indices('{') {
        let slice = &trimmed[start..];
        let mut de = serde_json::Deserializer::from_str(slice);
        if let Ok(value) = serde_json::Value::deserialize(&mut de) {
            return Some(value);
        }
    }
    None
}

fn preview_for_log(text: &str, limit: usize) -> String {
    let mut preview = text.replace('\n', "\\n").replace('\r', "\\r");
    if preview.len() > limit {
        preview.truncate(limit);
        preview.push_str("…");
    }
    preview
}

fn build_evaluation_template(criteria: &[EvaluationCriterion]) -> serde_json::Value {
    let categories = criteria
        .iter()
        .map(|c| {
            json!({
                "name": c.name,
                "score": 0,
                "feedback": ""
            })
        })
        .collect::<Vec<_>>();

    json!({
        "categories": categories,
        "overallScore": 0,
        "summary": "",
        "improvementAdvice": ""
    })
}

fn build_evaluation_template_json(criteria: &[EvaluationCriterion]) -> String {
    serde_json::to_string_pretty(&build_evaluation_template(criteria)).unwrap_or_else(|_| {
        "{\"categories\":[],\"overallScore\":0,\"summary\":\"\",\"improvementAdvice\":\"\"}"
            .to_string()
    })
}

async fn call_gemini_evaluation(
    system_instruction: String,
    input_text: String,
    model_id: &str,
    gemini_key: &str,
) -> Result<String, AppError> {
    let max_output_tokens = std::env::var("GEMINI_EVAL_MAX_OUTPUT_TOKENS")
        .ok()
        .and_then(|value| value.parse::<u32>().ok())
        .unwrap_or(2048);
    let payload = json!({
        "contents": [
            {
                "role": "user",
                "parts": [{ "text": input_text }]
            }
        ],
        "systemInstruction": { "parts": [{ "text": system_instruction }] },
        "generationConfig": {
            "temperature": 0,
            "maxOutputTokens": max_output_tokens,
            "responseMimeType": "application/json"
        }
    });

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model_id, gemini_key
    );

    let client = Client::new();
    let res = client
        .post(url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| anyhow_error(format!("Gemini evaluation failed: {}", e)))?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(anyhow_error(format!(
            "Gemini evaluation error {}: {}",
            status, text
        )));
    }

    let data: serde_json::Value = res
        .json()
        .await
        .map_err(|e| anyhow_error(format!("Failed to parse Gemini evaluation response: {}", e)))?;

    let finish_reason = data
        .get("candidates")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("finishReason"))
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");

    let reply_text = data
        .get("candidates")
        .and_then(|v| v.get(0))
        .and_then(|v| v.get("content"))
        .and_then(|v| v.get("parts"))
        .and_then(|v| v.as_array())
        .map(|parts| {
            parts
                .iter()
                .filter_map(|p| p.get("text").and_then(|t| t.as_str()))
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string()
        })
        .unwrap_or_default();

    if reply_text.is_empty() {
        let candidate_count = data
            .get("candidates")
            .and_then(|v| v.as_array())
            .map(|c| c.len())
            .unwrap_or(0);
        warn!(
            model_id = %model_id,
            finish_reason = %finish_reason,
            candidate_count,
            "Gemini evaluation returned empty content"
        );
    } else if finish_reason == "MAX_TOKENS" {
        warn!(
            model_id = %model_id,
            finish_reason = %finish_reason,
            reply_len = reply_text.len(),
            "Gemini evaluation output may be truncated"
        );
    }

    Ok(reply_text)
}

async fn generate_ai_evaluation(
    request: &EvaluationRequest,
    criteria: &[EvaluationCriterion],
    messages: &[Message],
    session_id: &str,
) -> Result<Evaluation, AppError> {
    let gemini_key = std::env::var("GEMINI_API_KEY")
        .or_else(|_| std::env::var("NEXT_PUBLIC_GEMINI_API_KEY"))
        .map_err(|_| anyhow_error("GEMINI_API_KEY is not set"))?;

    let system_instruction = build_evaluation_instruction(request, criteria, false);

    let transcript = messages
        .iter()
        .filter(|m| m.role != MessageRole::System)
        .map(|m| {
            let role = match m.role {
                MessageRole::User => "ユーザー",
                MessageRole::Agent => "アシスタント",
                MessageRole::System => "システム",
            };
            format!("[{}] {}", role, m.content)
        })
        .collect::<Vec<_>>()
        .join("\n");

    let eval_model =
        std::env::var("GEMINI_EVAL_MODEL").unwrap_or_else(|_| "gemini-3-flash-preview".to_string());
    let eval_model = normalize_model_id(&eval_model);

    let reply_text = call_gemini_evaluation(
        system_instruction,
        transcript.clone(),
        &eval_model,
        &gemini_key,
    )
    .await?;

    let mut json_value = extract_json_value(&reply_text);
    if json_value.is_none() {
        warn!(
            session_id = %session_id,
            attempt = "initial",
            reply_len = reply_text.len(),
            reply_preview = %preview_for_log(&reply_text, 600),
            "Gemini evaluation returned non-JSON output"
        );
        let strict_instruction = build_evaluation_instruction(request, criteria, true);
        let strict_reply = call_gemini_evaluation(
            strict_instruction,
            transcript.clone(),
            &eval_model,
            &gemini_key,
        )
        .await?;
        json_value = extract_json_value(&strict_reply);
        if json_value.is_none() {
            warn!(
                session_id = %session_id,
                attempt = "strict",
                reply_len = strict_reply.len(),
                reply_preview = %preview_for_log(&strict_reply, 600),
                "Gemini evaluation strict output still invalid"
            );
            let template = build_evaluation_template_json(criteria);
            let repair_instruction = format!(
                "あなたはJSON修復担当です。以下のドラフトと評価基準/テンプレートを使い、必ず有効なJSONのみを返してください。追加説明は不要です。\n- JSON以外の文字列は禁止\n- テンプレートのキーを追加/削除しない\n- 数値は0-100の範囲\n\nJSONテンプレート:\n{}",
                template
            );
            let repair_input = format!(
                "評価ドラフト:\n{}\n\n会話ログ:\n{}",
                strict_reply, transcript
            );
            let repaired_reply =
                call_gemini_evaluation(repair_instruction, repair_input, &eval_model, &gemini_key)
                    .await?;
            json_value = extract_json_value(&repaired_reply);
            if json_value.is_none() {
                warn!(
                    session_id = %session_id,
                    attempt = "repair",
                    reply_len = repaired_reply.len(),
                    reply_preview = %preview_for_log(&repaired_reply, 600),
                    "Gemini evaluation repair output still invalid"
                );
            }
        }
    }

    let json_value =
        json_value.ok_or_else(|| anyhow_error("Gemini evaluation returned invalid JSON"))?;
    let output: EvaluationOutput = serde_json::from_value(json_value)
        .map_err(|e| anyhow_error(format!("Failed to decode evaluation JSON: {}", e)))?;

    let mut categories = Vec::new();
    for criterion in criteria {
        let matched = output.categories.iter().find(|c| c.name == criterion.name);
        let score = matched
            .and_then(|c| c.score)
            .unwrap_or(0.0)
            .clamp(0.0, 100.0);
        let feedback = matched
            .and_then(|c| c.feedback.clone())
            .filter(|f| !f.trim().is_empty())
            .unwrap_or_else(|| "評価コメントが不足しています。".to_string());
        categories.push(EvaluationCategory {
            name: criterion.name.clone(),
            weight: criterion.weight,
            score: Some(score),
            feedback: Some(feedback),
        });
    }

    let total_weight: f32 = categories.iter().map(|c| c.weight).sum();
    let computed_overall = if total_weight > 0.0 {
        categories
            .iter()
            .map(|c| c.score.unwrap_or(0.0) * c.weight)
            .sum::<f32>()
            / total_weight
    } else {
        0.0
    };
    let overall_score = output.overall_score.unwrap_or(computed_overall).round();
    let passing_score = request.passing_score.unwrap_or(70.0);
    let passing = overall_score >= passing_score;

    Ok(Evaluation {
        session_id: session_id.to_string(),
        overall_score: Some(overall_score),
        passing: Some(passing),
        categories,
        summary: output.summary.filter(|s| !s.trim().is_empty()),
        improvement_advice: output.improvement_advice.filter(|s| !s.trim().is_empty()),
    })
}
