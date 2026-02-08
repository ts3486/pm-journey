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
            name: "保険金請求サポートサービス".to_string(),
            summary:
                "ユーザーが保険商品を購入し、後から証跡を提出して保険会社から保険金を受け取れる請求体験を提供するサービス。"
                    .to_string(),
            audience: "個人契約者、小規模事業者、保険金請求を担当する運用チーム".to_string(),
            problems: vec![
                "保険金請求に必要な証跡が分かりづらく、提出漏れが発生する".to_string(),
                "差し戻し理由が不明確で、再提出の手間と時間が増える".to_string(),
                "請求ステータスが見えづらく、問い合わせ対応コストが高い".to_string(),
            ],
            goals: vec![
                "ユーザーが迷わず保険金請求を完了できる体験を提供する".to_string(),
                "提出から支払いまでのリードタイムを短縮する".to_string(),
                "差し戻し率を下げ、初回提出での受理率を高める".to_string(),
            ],
            differentiators: vec![
                "必要書類をステップ形式で案内し、提出漏れを防ぐ".to_string(),
                "不足証跡を自動で検知し、再提出を最小化する".to_string(),
                "請求進捗をリアルタイムで可視化し、ユーザー不安を軽減する".to_string(),
            ],
            scope: vec![
                "保険商品の購入フロー".to_string(),
                "証跡提出フォーム（画像・PDF・URL）".to_string(),
                "請求ステータス追跡".to_string(),
                "通知・リマインド".to_string(),
            ],
            constraints: vec![
                "個人情報・証跡データを安全に扱うことが必須".to_string(),
                "監査対応のため提出履歴と更新履歴を保持する".to_string(),
                "MVPでは主要な請求フローを優先し段階的に拡張する".to_string(),
            ],
            timeline: Some("今四半期にMVP、次四半期に運用最適化機能を追加".to_string()),
            success_criteria: vec![
                "請求完了率の向上".to_string(),
                "差し戻し率の低下".to_string(),
                "初回支払いまでの日数短縮".to_string(),
            ],
            unique_edge: Some("請求者と審査担当の両方が迷わない、証跡中心の請求UXに特化".to_string()),
            tech_stack: vec![
                "Next.js".to_string(),
                "Tailwind CSS".to_string(),
                "Axum".to_string(),
                "PostgreSQL".to_string(),
                "Redis".to_string(),
            ],
            core_features: vec![
                "保険商品購入".to_string(),
                "証跡アップロード".to_string(),
                "請求ステータス管理".to_string(),
                "審査・承認ワークフロー".to_string(),
            ],
            product_prompt: Some(
                r#"## プロジェクト背景
- このプロジェクトは、ユーザーがオンラインで保険商品を購入し、後から証拠を提出して保険金を受け取れる保険金請求サービス。
- 請求プロセスのわかりやすさ、透明性、処理スピードを重視する。

## 対象ユーザーと課題
- 対象は、個人契約者と小規模事業者。
- 保険金請求時に必要書類が分かりづらく、提出漏れや差し戻しが発生しやすい。
- 請求ステータスが見えず、不安や問い合わせ増加につながっている。

## 目標と成功条件
- ユーザーが迷わず請求を完了できる体験を提供する。
- 提出から支払いまでのリードタイムを短縮する。
- 成功条件: 請求完了率の改善、差し戻し率の低下、初回支払いまでの日数短縮。

## スコープと主要機能
- 保険商品の購入フロー。
- 証拠提出フォーム（画像・PDF・URL）。
- 請求ステータス追跡（受付・審査中・追加提出・承認/却下・支払い完了）。
- 通知とリマインド機能。

## 制約とタイムライン
- 個人情報と証跡データを安全に扱うことが必須。
- 監査対応のため、提出履歴と更新履歴を保持する。
- まずはMVPとして主要な請求フローを優先し、段階的に機能拡張する。

## 差別化ポイントと補足
- 書類提出のガイドをステップ化し、ユーザーの迷いを減らす。
- 不足証跡を自動で指摘し、再提出を最小化する。
- 運用担当が判断しやすい審査ビューを提供し、処理速度を高める。"#
                    .to_string(),
            ),
            is_default: true,
            created_at: None,
            updated_at: None,
        }
    }
}
