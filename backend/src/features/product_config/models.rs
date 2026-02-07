use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

/// Product configuration for all scenarios
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProductConfig {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub name: String,
    pub summary: String,
    pub audience: String,
    pub problems: Vec<String>,
    pub goals: Vec<String>,
    #[serde(default)]
    pub differentiators: Vec<String>,
    #[serde(default)]
    pub scope: Vec<String>,
    #[serde(default)]
    pub constraints: Vec<String>,
    #[serde(default)]
    pub timeline: Option<String>,
    #[serde(default, alias = "success_criteria")]
    pub success_criteria: Vec<String>,
    #[serde(default, alias = "unique_edge")]
    pub unique_edge: Option<String>,
    #[serde(default, alias = "tech_stack")]
    pub tech_stack: Vec<String>,
    #[serde(default, alias = "core_features")]
    pub core_features: Vec<String>,
    #[serde(default, alias = "product_prompt")]
    pub product_prompt: Option<String>,
    /// Whether this is the default product config (not user-customized)
    #[serde(default, alias = "is_default")]
    pub is_default: bool,
    #[serde(skip_serializing_if = "Option::is_none", alias = "created_at")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", alias = "updated_at")]
    pub updated_at: Option<String>,
}

/// Request to update product configuration
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProductConfigRequest {
    pub name: String,
    pub summary: String,
    pub audience: String,
    pub problems: Vec<String>,
    pub goals: Vec<String>,
    #[serde(default)]
    pub differentiators: Vec<String>,
    #[serde(default)]
    pub scope: Vec<String>,
    #[serde(default)]
    pub constraints: Vec<String>,
    #[serde(default)]
    pub timeline: Option<String>,
    #[serde(default, alias = "success_criteria")]
    pub success_criteria: Vec<String>,
    #[serde(default, alias = "unique_edge")]
    pub unique_edge: Option<String>,
    #[serde(default, alias = "tech_stack")]
    pub tech_stack: Vec<String>,
    #[serde(default, alias = "core_features")]
    pub core_features: Vec<String>,
    #[serde(default, alias = "product_prompt")]
    pub product_prompt: Option<String>,
}

impl ProductConfig {
    /// Get the default product configuration
    pub fn default_product() -> Self {
        Self {
            id: None,
            name: "在庫最適化ダッシュボード".to_string(),
            summary:
                "多店舗小売向けに、在庫・発注・売上を一画面で可視化し、欠品と過剰在庫を減らすSaaS。"
                    .to_string(),
            audience: "店舗マネージャー、在庫管理担当、エリア統括".to_string(),
            problems: vec![
                "欠品と過剰在庫が併発".to_string(),
                "発注が属人化".to_string(),
                "売上予測が粗い".to_string(),
            ],
            goals: vec![
                "欠品率の低下".to_string(),
                "在庫回転率の改善".to_string(),
                "発注作業時間の削減".to_string(),
            ],
            differentiators: vec![
                "需要予測ベースの発注提案".to_string(),
                "店舗別の優先度表示".to_string(),
                "モバイル棚卸対応".to_string(),
            ],
            scope: vec![
                "在庫ダッシュボード".to_string(),
                "発注提案".to_string(),
                "低在庫アラート".to_string(),
                "POS連携(読み取り)".to_string(),
            ],
            constraints: vec![
                "既存POSとの連携が必須".to_string(),
                "3か月でβリリース".to_string(),
            ],
            timeline: Some("今四半期にβ、次四半期に正式版".to_string()),
            success_criteria: vec![
                "β導入5社".to_string(),
                "欠品率10%削減".to_string(),
                "発注作業時間を30%削減".to_string(),
            ],
            unique_edge: Some("現場が5分で意思決定できるシンプルUIに特化".to_string()),
            tech_stack: vec![
                "Next.js".to_string(),
                "Tailwind CSS".to_string(),
                "Axum".to_string(),
                "PostgreSQL".to_string(),
                "Redis".to_string(),
            ],
            core_features: vec![
                "在庫ダッシュボード".to_string(),
                "自動発注提案".to_string(),
                "低在庫アラート".to_string(),
                "POS連携".to_string(),
            ],
            product_prompt: None,
            is_default: true,
            created_at: None,
            updated_at: None,
        }
    }
}
