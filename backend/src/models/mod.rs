use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Scenario {
    pub id: String,
    pub title: String,
    pub discipline: ScenarioDiscipline,
    pub description: String,
    pub product: ProductInfo,
    pub mode: String,
    pub kickoff_prompt: String,
    pub evaluation_criteria: Vec<EvaluationCategory>,
    pub passing_score: Option<f32>,
    pub missions: Option<Vec<Mission>>,
    pub supplemental_info: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct ProductInfo {
    pub name: String,
    pub summary: String,
    pub audience: String,
    pub problems: Vec<String>,
    pub goals: Vec<String>,
    pub differentiators: Vec<String>,
    pub scope: Vec<String>,
    pub constraints: Vec<String>,
    pub timeline: String,
    pub success_criteria: Vec<String>,
    pub unique_edge: Option<String>,
    pub tech_stack: Option<Vec<String>>,
    pub core_features: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Active,
    Completed,
    Evaluated,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct ProgressFlags {
    pub requirements: bool,
    pub priorities: bool,
    pub risks: bool,
    pub acceptance: bool,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Session {
    pub id: String,
    pub scenario_id: String,
    pub scenario_discipline: Option<ScenarioDiscipline>,
    pub status: SessionStatus,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub last_activity_at: String,
    pub user_name: Option<String>,
    pub progress_flags: ProgressFlags,
    pub evaluation_requested: bool,
    pub mission_status: Option<Vec<MissionStatus>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageRole {
    User,
    Agent,
    System,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MessageTag {
    Decision,
    Assumption,
    Risk,
    NextAction,
    Summary,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Message {
    pub id: String,
    pub session_id: String,
    pub role: MessageRole,
    pub content: String,
    pub created_at: String,
    pub tags: Option<Vec<MessageTag>>,
    pub queued_offline: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct EvaluationCategory {
    pub name: String,
    pub weight: f32,
    pub score: Option<f32>,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Evaluation {
    pub session_id: String,
    pub overall_score: Option<f32>,
    pub passing: Option<bool>,
    pub categories: Vec<EvaluationCategory>,
    pub summary: Option<String>,
    pub improvement_advice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct Mission {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct MissionStatus {
    pub mission_id: String,
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct HistoryItem {
    pub session_id: String,
    pub scenario_id: Option<String>,
    pub scenario_discipline: Option<ScenarioDiscipline>,
    pub metadata: HistoryMetadata,
    pub actions: Vec<Message>,
    pub evaluation: Option<Evaluation>,
    pub storage_location: Option<String>,
    pub comments: Option<Vec<ManagerComment>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct HistoryMetadata {
    pub duration: Option<f32>,
    pub message_count: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct ManagerComment {
    pub id: String,
    pub session_id: String,
    pub author_name: Option<String>,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ScenarioDiscipline {
    PM,
    PMO,
}

pub fn default_scenarios() -> Vec<Scenario> {
    vec![
        Scenario {
            id: "pm-attendance-modernization".to_string(),
            title: "勤怠アプリ刷新 (PM)".to_string(),
            discipline: ScenarioDiscipline::PM,
            description: "打刻漏れを減らし、モバイルから使いやすい勤怠体験を短期で立ち上げる。".to_string(),
            product: ProductInfo {
                name: "モバイル勤怠アプリ".to_string(),
                summary: "現場従業員が毎日使う勤怠アプリを刷新し、打刻漏れを減らす。".to_string(),
                audience: "社内従業員・現場マネージャー・人事労務チーム".to_string(),
                problems: vec!["旧勤怠システムの打刻漏れ".to_string(), "モバイル非対応".to_string()],
                goals: vec!["打刻漏れ 50%削減".to_string(), "モバイル完了率向上".to_string()],
                differentiators: vec!["評価カテゴリと連動した進捗可視化".to_string()],
                scope: vec!["勤怠打刻".to_string(), "日次/週次エラー通知".to_string()],
                constraints: vec!["社内ネットワーク優先".to_string(), "個人情報の社外送信なし".to_string()],
                timeline: "6ヶ月で社内ローンチ".to_string(),
                success_criteria: vec!["評価70点以上でGO判断".to_string()],
                unique_edge: Some("PM視点の要件整理と評価フレームが組み込まれている".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["勤怠打刻".to_string(), "エラー通知".to_string()]),
            },
            mode: "freeform".to_string(),
            kickoff_prompt: "あなたはPMとして勤怠アプリ刷新をリードします。現状課題と成功条件を整理し、AIエンジニア/デザイナーの鈴木と対話しながら要件を詰めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "pm-attendance-m1".to_string(), title: "課題と現状整理を行う".to_string(), description: None, order: 1 },
                Mission { id: "pm-attendance-m2".to_string(), title: "成功条件とKPIを定義する".to_string(), description: None, order: 2 },
                Mission { id: "pm-attendance-m3".to_string(), title: "主要リスクと前提を洗い出す".to_string(), description: None, order: 3 },
            ]),
            supplemental_info: Some("勤怠打刻漏れの要因（モバイル/UX/ネットワーク）を整理し、評価70点以上を目指す。".to_string()),
        },
        Scenario {
            id: "pmo-portfolio-hygiene".to_string(),
            title: "プロジェクト運営ガバナンス (PMO)".to_string(),
            discipline: ScenarioDiscipline::PMO,
            description: "複数プロジェクトの健全性を可視化し、リスクと前提を統制する。".to_string(),
            product: ProductInfo {
                name: "PMO ハブ".to_string(),
                summary: "ポートフォリオ横断の進行状況とリスクを共通フォーマットで集約する。".to_string(),
                audience: "経営層、PM、PMOチーム".to_string(),
                problems: vec!["プロジェクト間で報告粒度がバラバラ".to_string()],
                goals: vec!["共通フォーマット定着".to_string(), "リスク検知の前倒し".to_string()],
                differentiators: vec!["評価カテゴリと連動したレビュー指標".to_string()],
                scope: vec!["ステータス更新テンプレート".to_string(), "リスク/課題トラッキング".to_string()],
                constraints: vec!["HTTPS必須".to_string(), "個別プロジェクトの機密保持".to_string()],
                timeline: "3ヶ月で全プロジェクトに展開".to_string(),
                success_criteria: vec!["週次レポート遵守率90%".to_string()],
                unique_edge: Some("PMOらしい統制と透明性を両立する仕組み".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["ステータス入力".to_string(), "リスク/前提整理".to_string()]),
            },
            mode: "freeform".to_string(),
            kickoff_prompt: "あなたはPMOとして複数プロジェクトをレビューします。リスクと前提を整理し、判断材料を揃えてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "pmo-hygiene-m1".to_string(), title: "共通フォーマットと更新リズムを定義する".to_string(), description: None, order: 1 },
                Mission { id: "pmo-hygiene-m2".to_string(), title: "リスク/前提の収集とエスカレーション基準をまとめる".to_string(), description: None, order: 2 },
                Mission { id: "pmo-hygiene-m3".to_string(), title: "レビュー指標と可視化要件を決める".to_string(), description: None, order: 3 },
            ]),
            supplemental_info: Some("HTTPS必須・機密保持を意識しつつ週次遵守とリスク検知前倒しを狙う。".to_string()),
        },
    ]
}
