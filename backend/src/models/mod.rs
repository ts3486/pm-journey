use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PmbokKnowledgeArea {
    Integration,
    Scope,
    Schedule,
    Cost,
    Quality,
    Resource,
    Communication,
    Risk,
    Procurement,
    Stakeholder,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ScenarioType {
    SoftSkills,
    TestCases,
    RequirementDefinition,
    IncidentResponse,
    BusinessExecution,
}

impl ScenarioType {
    pub fn to_discipline(&self) -> ScenarioDiscipline {
        match self {
            ScenarioType::IncidentResponse | ScenarioType::BusinessExecution => {
                ScenarioDiscipline::Challenge
            }
            _ => ScenarioDiscipline::Basic,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FeatureMockup {
    pub component: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Scenario {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(alias = "scenario_type")]
    pub scenario_type: ScenarioType,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "feature_mockup")]
    pub feature_mockup: Option<FeatureMockup>,
    #[serde(alias = "kickoff_prompt")]
    pub kickoff_prompt: String,
    #[serde(alias = "evaluation_criteria")]
    pub evaluation_criteria: Vec<EvaluationCategory>,
    #[serde(alias = "passing_score")]
    pub passing_score: Option<f32>,
    pub missions: Option<Vec<Mission>>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "agent_prompt")]
    pub agent_prompt: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "single_response")]
    pub single_response: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SessionStatus {
    Active,
    Completed,
    Evaluated,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressFlags {
    pub requirements: bool,
    pub priorities: bool,
    pub risks: bool,
    pub acceptance: bool,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Session {
    pub id: String,
    #[serde(alias = "scenario_id")]
    pub scenario_id: String,
    #[serde(alias = "scenario_discipline")]
    pub scenario_discipline: Option<ScenarioDiscipline>,
    pub status: SessionStatus,
    #[serde(alias = "started_at")]
    pub started_at: String,
    #[serde(alias = "ended_at")]
    pub ended_at: Option<String>,
    #[serde(alias = "last_activity_at")]
    pub last_activity_at: String,
    #[serde(alias = "user_name")]
    pub user_name: Option<String>,
    #[serde(alias = "progress_flags")]
    pub progress_flags: ProgressFlags,
    #[serde(alias = "evaluation_requested")]
    pub evaluation_requested: bool,
    #[serde(alias = "mission_status")]
    pub mission_status: Option<Vec<MissionStatus>>,
    #[serde(alias = "organization_id")]
    pub organization_id: Option<String>,
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
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    #[serde(alias = "session_id")]
    pub session_id: String,
    pub role: MessageRole,
    pub content: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
    pub tags: Option<Vec<MessageTag>>,
    #[serde(alias = "queued_offline")]
    pub queued_offline: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EvaluationCategory {
    pub name: String,
    pub weight: f32,
    pub score: Option<f32>,
    pub feedback: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Evaluation {
    #[serde(alias = "session_id")]
    pub session_id: String,
    #[serde(alias = "overall_score")]
    pub overall_score: Option<f32>,
    pub passing: Option<bool>,
    pub categories: Vec<EvaluationCategory>,
    pub summary: Option<String>,
    #[serde(alias = "improvement_advice")]
    pub improvement_advice: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Mission {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub order: i32,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MissionStatus {
    #[serde(alias = "mission_id")]
    pub mission_id: String,
    #[serde(alias = "completed_at")]
    pub completed_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryItem {
    #[serde(alias = "session_id")]
    pub session_id: String,
    #[serde(alias = "scenario_id")]
    pub scenario_id: Option<String>,
    #[serde(alias = "scenario_discipline")]
    pub scenario_discipline: Option<ScenarioDiscipline>,
    pub metadata: HistoryMetadata,
    pub actions: Vec<Message>,
    pub evaluation: Option<Evaluation>,
    #[serde(alias = "storage_location")]
    pub storage_location: Option<String>,
    pub comments: Option<Vec<ManagerComment>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct HistoryMetadata {
    pub duration: Option<f32>,
    #[serde(rename = "messageCount", alias = "message_count")]
    pub message_count: Option<u64>,
    #[serde(rename = "startedAt", alias = "started_at")]
    pub started_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ManagerComment {
    pub id: String,
    #[serde(alias = "session_id")]
    pub session_id: String,
    #[serde(alias = "author_name")]
    pub author_name: Option<String>,
    #[serde(alias = "author_user_id")]
    pub author_user_id: Option<String>,
    #[serde(alias = "author_role")]
    pub author_role: Option<String>,
    pub content: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TestCase {
    pub id: String,
    #[serde(alias = "session_id")]
    pub session_id: String,
    pub name: String,
    pub preconditions: String,
    pub steps: String,
    #[serde(alias = "expected_result")]
    pub expected_result: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum OutputKind {
    Text,
    Url,
    Image,
}

impl OutputKind {
    pub fn as_str(&self) -> &str {
        match self {
            OutputKind::Text => "text",
            OutputKind::Url => "url",
            OutputKind::Image => "image",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "text" => Some(OutputKind::Text),
            "url" => Some(OutputKind::Url),
            "image" => Some(OutputKind::Image),
            _ => None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Output {
    pub id: String,
    #[serde(alias = "session_id")]
    pub session_id: String,
    pub kind: OutputKind,
    pub value: String,
    pub note: Option<String>,
    #[serde(alias = "created_by_user_id")]
    pub created_by_user_id: String,
    #[serde(alias = "created_at")]
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum ScenarioDiscipline {
    Basic,
    Challenge,
}

impl ScenarioDiscipline {
    pub fn as_str(&self) -> &str {
        match self {
            ScenarioDiscipline::Basic => "BASIC",
            ScenarioDiscipline::Challenge => "CHALLENGE",
        }
    }
}

pub(crate) fn scenario_type_for_id(id: &str) -> ScenarioType {
    if id.starts_with("test-") {
        ScenarioType::TestCases
    } else if id.starts_with("basic-requirement") {
        ScenarioType::RequirementDefinition
    } else if id.contains("incident") || id.contains("postmortem") {
        ScenarioType::IncidentResponse
    } else if id.starts_with("challenge-") || id.starts_with("adv-") {
        ScenarioType::BusinessExecution
    } else {
        ScenarioType::SoftSkills
    }
}

pub fn default_scenarios() -> Vec<Scenario> {
    let mut scenarios = vec![
        Scenario {
            id: "basic-product-understanding".to_string(),
            title: "プロダクト理解".to_string(),
            description: "新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "まずはプロダクト理解を進めましょう。以下の情報をもとに、プロダクト全体像を整理してください。\n\n■ プロダクト: 保険金請求サポートサービス\n保険金請求に必要な証跡の案内、自動検知、進捗可視化を提供するサービス\n\n■ 主な課題\n- 証跡が分かりづらく、提出漏れが発生\n- 不足情報での差し戻しが多い\n- ステータスが見えにくい\n\n■ 解決策の特徴\n- ステップ形式で必要書類を案内\n- 不足証跡を自動検知\n- リアルタイムで請求進捗を表示\n分からないことがあれば質問してください。\nプロダクト概要が理解できたら、「理解しました」と答えてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "プロダクト概要の理解".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "ユーザーと課題の整理".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "機能と差別化ポイントの把握".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "深掘りポイントと思考力".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "product-m1".to_string(), title: "プロダクト概要を理解する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\nプロダクトの全体像を自分の言葉で整理してください。「誰の・どんな課題を・どう解決するか」「主要な機能と差別化ポイント」「あなたがPMとして最初に深掘りしたい点」の3点を答えてください。".to_string()),
            single_response: Some(true),
        },
        Scenario {
            id: "basic-intro-alignment".to_string(),
            title: "自己紹介＆期待値合わせ".to_string(),
            description: "新規プロジェクトに合流し、役割と成功条件を30分で擦り合わせる。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたは新規PJに参加するPM/PMOとして、初回ミーティングで役割と期待値を揃えます。短時間で目的・進め方・次アクションを決めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-intro-m1".to_string(), title: "自己紹介を行う".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\n新規プロジェクトの初回ミーティングで自己紹介と期待値合わせを行ってください。PMとしての役割・責任・進め方・次アクションをチームと合意してください。\n\n期待される構成:\n- 自己紹介と担当領域\n- プロジェクトへの期待と懸念\n- 進め方と確認頻度の合意\n- 次のアクションと担当".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-meeting-minutes".to_string(),
            title: "議事メモの作成と共有".to_string(),
            description: "会議内容を要点・決定・アクションに整理し共有する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして会議内容を議事メモに整理します。決定事項・未決事項・次アクションと担当を明記し、共有用のまとめを作成してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-minutes-m1".to_string(), title: "決定事項と未決事項を整理する".to_string(), description: None, order: 1 },
                Mission { id: "basic-minutes-m2".to_string(), title: "次アクションと担当・期日を明記する".to_string(), description: None, order: 2 },
                Mission { id: "basic-minutes-m3".to_string(), title: "共有メッセージとして要約する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-schedule-share".to_string(),
            title: "スケジュール感の共有".to_string(),
            description: "プロジェクトの見通しとマイルストーンを共有する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとしてプロジェクトのスケジュール感を共有します。全体像、マイルストーン、前提条件、次の判断ポイントを整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-schedule-m1".to_string(), title: "全体像と進め方を共有する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\nプロジェクトのスケジュール感を関係者に共有してください。全体像・主要マイルストーン・前提条件・次の判断ポイントを整理して伝えてください。\n\n期待される構成:\n- 全体期間と主なフェーズ\n- 主要マイルストーンと完了条件\n- 前提条件・制約・リスク\n- 次の判断ポイントと期日".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-docs-refine".to_string(),
            title: "既存資料の軽微な修正".to_string(),
            description: "資料を読み手に伝わる形に整える。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして既存資料を軽微に修正します。目的と対象読者を整理し、表現と構成を改善してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-docs-m1".to_string(), title: "資料の目的と対象を整理する".to_string(), description: None, order: 1 },
                Mission { id: "basic-docs-m2".to_string(), title: "分かりにくい表現や構成を修正する".to_string(), description: None, order: 2 },
                Mission { id: "basic-docs-m3".to_string(), title: "要点を伝わる形でまとめる".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-ticket-refine".to_string(),
            title: "チケット要件整理".to_string(),
            description: "曖昧なチケットを受入可能な形に分解し、スプリントに載せられる状態へ整理する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして曖昧なチケットをスプリントに載せられる形へ精査します。目的、受入条件、依存/リスクを明文化してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-ticket-m1".to_string(), title: "課題の目的とゴールを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-ticket-m2".to_string(), title: "受入条件(AC)を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-ticket-m3".to_string(), title: "依存関係とリスクを明文化する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-ticket-splitting".to_string(),
            title: "チケット分割と優先度付け".to_string(),
            description: "大きな依頼を分割し、優先順位と依存を整理する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして大きな依頼を分割します。価値の高い順に優先度を付け、依存関係とリスクを整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-split-m1".to_string(), title: "チケットを実行可能な単位に分割する".to_string(), description: None, order: 1 },
                Mission { id: "basic-split-m2".to_string(), title: "優先度と価値を整理する".to_string(), description: None, order: 2 },
                Mission { id: "basic-split-m3".to_string(), title: "依存関係とリスクを明文化する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-acceptance-review".to_string(),
            title: "受入条件のレビュー".to_string(),
            description: "既存の受入条件を見直し、検証可能性を高める。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして受入条件をレビューします。曖昧な表現を修正し、検証可能な形に整えてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-acceptance-m1".to_string(), title: "受入条件をレビューする".to_string(), description: None, order: 1 },
                Mission { id: "basic-acceptance-m2".to_string(), title: "曖昧な表現を修正する".to_string(), description: None, order: 2 },
                Mission { id: "basic-acceptance-m3".to_string(), title: "依存関係とリスクを確認する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-unknowns-discovery".to_string(),
            title: "不明点の洗い出し".to_string(),
            description: "曖昧な前提や未決事項を可視化し、確認計画を立てる。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとして要件の不明点を洗い出します。確認先・優先度・解消方法を整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-unknowns-m1".to_string(), title: "不明点・未決事項を列挙する".to_string(), description: None, order: 1 },
                Mission { id: "basic-unknowns-m2".to_string(), title: "確認先と必要情報を整理する".to_string(), description: None, order: 2 },
                Mission { id: "basic-unknowns-m3".to_string(), title: "優先度と解消計画を決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-testcase-design".to_string(),
            title: "テストケース作成".to_string(),
            description: "新機能の仕様からスモーク/回帰テストケースを洗い出し、漏れのない最小集合を作る。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "新機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-test-m1".to_string(), title: "正常系と主要なユーザーフローを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "basic-test-m2".to_string(), title: "主要な異常系と境界を決める".to_string(), description: None, order: 2 },
                Mission { id: "basic-test-m3".to_string(), title: "前提データ・環境・優先度を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-test-viewpoints".to_string(),
            title: "テスト観点の洗い出しと優先度付け".to_string(),
            description: "仕様からテスト観点を洗い出し、リスクベースで優先度を付ける。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはQA/PMとしてテスト観点を洗い出し、影響度と頻度で優先順位を決めます。前提条件も整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-viewpoints-m1".to_string(), title: "主要なテスト観点を洗い出す".to_string(), description: None, order: 1 },
                Mission { id: "basic-viewpoints-m2".to_string(), title: "リスク/影響度で優先順位を付ける".to_string(), description: None, order: 2 },
                Mission { id: "basic-viewpoints-m3".to_string(), title: "前提条件と不足情報を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-test-risk-review".to_string(),
            title: "テスト計画のリスクレビュー".to_string(),
            description: "既存のテスト計画を見直し、リスクベースで優先度を調整する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはQA/PMとして既存のテスト計画をレビューします。高リスク領域の優先度を見直し、前提条件を再整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-riskreview-m1".to_string(), title: "高リスク領域を特定する".to_string(), description: None, order: 1 },
                Mission { id: "basic-riskreview-m2".to_string(), title: "優先度と観点を再調整する".to_string(), description: None, order: 2 },
                Mission { id: "basic-riskreview-m3".to_string(), title: "前提条件と不足情報を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-regression-smoke".to_string(),
            title: "回帰テストの最小セット整理".to_string(),
            description: "回帰テストの必須ケースを最小セットで整理する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはQA/PMとして回帰テストの最小セットを整理します。必須フローと優先度、前提条件を明確にしてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-regression-m1".to_string(), title: "主要な回帰フローを洗い出す".to_string(), description: None, order: 1 },
                Mission { id: "basic-regression-m2".to_string(), title: "必須ケースの優先度を決める".to_string(), description: None, order: 2 },
                Mission { id: "basic-regression-m3".to_string(), title: "前提データと環境を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        // Test-case scenarios
        Scenario {
            id: "test-login".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "login".to_string(),
                description: "メールアドレスとパスワードで認証するログインフォームです。".to_string(),
            }),
            kickoff_prompt: "ログイン機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-login-m1".to_string(), title: "正常系ログインフローを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-login-m2".to_string(), title: "異常系・セキュリティ観点を洗い出す".to_string(), description: None, order: 2 },
                Mission { id: "test-login-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nログイン機能のテストケースを作成してください。正常系・異常系・セキュリティ観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- 異常系テストケース\n- セキュリティ観点のテストケース\n- 前提条件・テストデータ\n\n## 背景情報\nログインフォームはメールアドレスとパスワードで認証します。ソーシャルログイン（Google）も対応しています。連続ログイン失敗時のロック機能があります。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "test-form".to_string(),
            title: "フォーム機能".to_string(),
            description: "フォーム機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "form".to_string(),
                description: "お問い合わせフォームです。入力検証とエラー表示を確認できます。".to_string(),
            }),
            kickoff_prompt: "フォーム機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-form-m1".to_string(), title: "入力バリデーションケースを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-form-m2".to_string(), title: "エラー表示と操作性を検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-form-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nフォーム機能のテストケースを作成してください。入力バリデーション・エラー表示・UX観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- バリデーションエラーケース\n- UI・UXテストケース\n- 前提条件・テストデータ\n\n## 背景情報\n問い合わせフォームです。入力項目は氏名・メール・件名・本文。全項目必須。メールアドレスは形式チェックあり。送信後に確認メールが送られます。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "test-file-upload".to_string(),
            title: "ファイルアップロード機能".to_string(),
            description: "ファイルアップロード機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "file-upload".to_string(),
                description: "ドラッグ＆ドロップ対応のファイルアップロード機能です。".to_string(),
            }),
            kickoff_prompt: "ファイルアップロード機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-upload-m1".to_string(), title: "ファイル種別とサイズ検証ケースを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-upload-m2".to_string(), title: "エラー処理とセキュリティ観点を検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-upload-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nファイルアップロード機能のテストケースを作成してください。ファイル種別・サイズ制限・エラー処理・セキュリティ観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- ファイル種別・サイズ検証ケース\n- エラー処理ケース\n- セキュリティケース\n- 前提条件・テストデータ\n\n## 背景情報\n証跡アップロード機能。対応形式はJPG・PNG・PDF。最大サイズは10MB。複数ファイル同時アップロード可（最大5件）。アップロード後にウイルスチェックが走ります。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "test-password-reset".to_string(),
            title: "パスワード再設定機能".to_string(),
            description: "パスワード再設定機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "password-reset".to_string(),
                description: "メール認証コードでパスワードを再設定するフローです。".to_string(),
            }),
            kickoff_prompt: "パスワード再設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-reset-m1".to_string(), title: "再設定フローの正常系を列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-reset-m2".to_string(), title: "セキュリティ・異常系観点を洗い出す".to_string(), description: None, order: 2 },
                Mission { id: "test-reset-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "test-search-filter".to_string(),
            title: "検索・絞り込み機能".to_string(),
            description: "検索・絞り込み機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "search-filter".to_string(),
                description: "一覧画面で検索・絞り込み・並び替えができる機能です。".to_string(),
            }),
            kickoff_prompt: "検索・絞り込み機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-search-m1".to_string(), title: "検索クエリの正常系・境界値を列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-search-m2".to_string(), title: "絞り込みと並び替えの組み合わせを検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-search-m3".to_string(), title: "0件・エラー・操作性観点を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "test-notification-settings".to_string(),
            title: "通知設定機能".to_string(),
            description: "通知設定機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "notification-settings".to_string(),
                description: "チャネル別・イベント別に通知受信設定を変更できる機能です。".to_string(),
            }),
            kickoff_prompt: "通知設定機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-notify-m1".to_string(), title: "チャネル別・イベント別設定を列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-notify-m2".to_string(), title: "保存反映と権限エラー観点を洗い出す".to_string(), description: None, order: 2 },
                Mission { id: "test-notify-m3".to_string(), title: "前提条件と優先度を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "test-profile-edit".to_string(),
            title: "プロフィール編集機能".to_string(),
            description: "プロフィール編集機能のテストケースを設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "profile-edit".to_string(),
                description: "プロフィール情報と画像を更新できる編集画面です。".to_string(),
            }),
            kickoff_prompt: "プロフィール編集機能のテストケースを作成してください。プロダクトや機能の詳細について質問があれば遠慮なく聞いてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-profile-m1".to_string(), title: "入力項目バリデーションを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-profile-m2".to_string(), title: "画像アップロードと保存処理を検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-profile-m3".to_string(), title: "権限・公開範囲観点を整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        // Requirement-definition scenarios
        Scenario {
            id: "basic-requirement-definition-doc".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "お疲れ様です、POの鈴木です！ログイン機能で『ログインできない』問い合わせが増えているので、最低限のログイン体験を安定化したいです。要件定義をお願いできますか？".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqdoc-m2".to_string(), title: "ログイン成功/失敗時の要件を定義する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\nログイン機能の要件定義を行ってください。『ログインできない』問い合わせが増えているという課題に対して、最低限のログイン体験を安定化するための要件を整理してください。会話を通じて段階的に要件を合意していきましょう。\n\n期待される構成:\n- 目的・対象ユーザー\n- 受入条件\n- 非対象と不明点の確認\n\n## 背景情報\nログインできない問い合わせが週30件を超えています。主な原因はパスワード忘れとソーシャルログイン連携のエラーです。開発リソースは1スプリント（2週間）です。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-hearing-plan".to_string(),
            title: "問い合わせフォーム機能".to_string(),
            description: "問い合わせフォーム機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "問い合わせフォームの離脱が増えています。CSは入力項目を減らしたい一方で、法務は同意取得を厳密にしたいと言っています。要件を整理してもらえますか？".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqhear-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqhear-m2".to_string(), title: "入力/送信/エラー時の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqhear-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\n問い合わせフォーム機能の要件ヒアリング計画を作成してください。CS側の「入力項目を減らしたい」という要求と、法務側の「同意取得を厳格化したい」という要求の両立を検討してください。\n\n期待される構成:\n- ヒアリング目的と対象者\n- CSへの確認事項\n- 法務への確認事項\n- 優先度と進め方\n\n## 背景情報\nCSチームは問い合わせ件数削減のために入力項目を5→3項目に減らしたい。法務チームは個人情報保護の観点から同意チェックボックスを2→4項目に増やしたい。リリースは来月を予定。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-user-story".to_string(),
            title: "ファイルアップロード機能".to_string(),
            description: "ファイルアップロード機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "サポート向けに添付ファイルアップロードを追加したいです。営業は早期リリースを求めていますが、インフラはサイズ制限を厳守してほしいと言っています。要件を整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqstory-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqstory-m2".to_string(), title: "形式/サイズ/失敗時の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqstory-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nファイルアップロード機能のユーザーストーリーを作成してください。「早期リリースしたい」という開発側の要望と「サイズ制限を厳格にしたい」というセキュリティ側の要望を踏まえて、ユーザー視点で要件を整理してください。\n\n期待される構成:\n- ユーザーストーリー（As a... I want... So that...）\n- 受入条件（Given/When/Then）\n- 完了定義（DoD）\n\n## 背景情報\n証跡アップロード機能の第1フェーズ。開発チームはMVPとして2週間で出したい。セキュリティチームはウイルスチェックと10MB制限を必須としている。ユーザーは請求に必要な証跡写真をスマホで撮ってアップロードする想定。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-nfr".to_string(),
            title: "パスワード再設定機能".to_string(),
            description: "パスワード再設定機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "パスワード再設定の問い合わせが急増しています。UXは簡単な導線を求めていますが、セキュリティは厳格な本人確認を求めています。要件を整理してもらえますか？".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqnfr-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqnfr-m2".to_string(), title: "本人確認/期限/完了条件の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqnfr-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-priority-matrix".to_string(),
            title: "検索・絞り込み機能".to_string(),
            description: "検索・絞り込み機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "検索・絞り込み機能の改善依頼があります。PMは多条件検索を求めていますが、開発からは性能劣化の懸念が出ています。要件を整理しましょう。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqprio-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqprio-m2".to_string(), title: "検索条件/ソート/0件表示の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqprio-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-risk-check".to_string(),
            title: "通知設定機能".to_string(),
            description: "通知設定機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "通知設定を見直したいです。マーケは通知頻度を上げたい一方で、ユーザーからは通知過多の不満が来ています。要件定義を手伝ってください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqrisk-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqrisk-m2".to_string(), title: "チャネル/頻度/保存反映の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqrisk-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-consensus".to_string(),
            title: "プロフィール編集機能".to_string(),
            description: "プロフィール編集機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "プロフィール編集を改善したいです。利用者は即時保存を期待していますが、開発は同時編集時の競合を懸念しています。要件を整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqconsensus-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqconsensus-m2".to_string(), title: "入力制約/保存/競合時の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqconsensus-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        // Coming scenarios (BASIC discipline)
        Scenario {
            id: "coming-stakeholder-negotiation".to_string(),
            title: "ステークホルダー優先度交渉".to_string(),
            description: "営業と開発の対立を整理し、合意形成を進める。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "営業は『今月中に新機能を出したい』、開発は『品質基準を満たさない限りリリースできない』と主張しています。対立点を整理し、合意形成に向けた交渉を進めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-stakeholder-m1".to_string(), title: "対立点と共通目的を明確化する".to_string(), description: None, order: 1 },
                Mission { id: "coming-stakeholder-m2".to_string(), title: "譲歩案と判断基準を提示する".to_string(), description: None, order: 2 },
                Mission { id: "coming-stakeholder-m3".to_string(), title: "合意事項・保留事項・次アクションを確定する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-priority-tradeoff-workshop".to_string(),
            title: "優先度トレードオフ".to_string(),
            description: "複数の候補案を比較し、段階リリース計画を決定する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "次リリース候補として『高速検索』『通知改善』『管理画面改修』の3案があります。価値・工数・リスクを比較し、段階リリースの合意案を作ってください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-tradeoff-m1".to_string(), title: "比較軸を定義して各案を評価する".to_string(), description: None, order: 1 },
                Mission { id: "coming-tradeoff-m2".to_string(), title: "採用案と却下案を整理する".to_string(), description: None, order: 2 },
                Mission { id: "coming-tradeoff-m3".to_string(), title: "段階リリース計画と判断理由を合意する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-decision-log-alignment".to_string(),
            title: "意思決定ログ共有と認識合わせ".to_string(),
            description: "意思決定ログを整理し、認識ズレを解消する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "先週決めた『段階リリース方針』について、営業と開発で認識にズレが出ています。意思決定ログを整理し、共有メッセージと確認ポイントを作成してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-decisionlog-m1".to_string(), title: "ズレている認識ポイントを特定する".to_string(), description: None, order: 1 },
                Mission { id: "coming-decisionlog-m2".to_string(), title: "意思決定の背景と根拠を再整理する".to_string(), description: None, order: 2 },
                Mission { id: "coming-decisionlog-m3".to_string(), title: "共有文面と確認ポイントを確定する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-sprint-retrospective".to_string(),
            title: "スプリント振り返り".to_string(),
            description: "スプリント振り返りで改善アクションを整理する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "スプリントふりかえりの進め方と改善アクションを整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-retro-m1".to_string(), title: "改善アクションを整理する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-release-readiness-review".to_string(),
            title: "リリース準備レビュー".to_string(),
            description: "リリース準備状況を確認し、Go/No-Goを判断する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "リリース準備レビューのチェック項目と判断基準を整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-release-m1".to_string(), title: "Go/No-Go判断材料を整理する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-kpi-review-action".to_string(),
            title: "KPIレビューと改善アクション".to_string(),
            description: "KPIを振り返り、次スプリントの改善施策を決定する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "主要KPIの振り返りと次スプリントの改善アクションを整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-kpi-m1".to_string(), title: "改善施策を整理する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        // Coming scenarios (CHALLENGE discipline)
        Scenario {
            id: "coming-incident-response".to_string(),
            title: "P1障害: ログイン不能バグの緊急対応".to_string(),
            description: "P1障害の初動対応と報告を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "本番環境で『ログインAPIが500エラーを返し続け、全ユーザーがログイン不能』というP1障害が発生しました。初動対応、影響範囲、社内外への初回報告を会話で整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-incident-m1".to_string(), title: "影響範囲と緊急度を確定する".to_string(), description: None, order: 1 },
                Mission { id: "coming-incident-m2".to_string(), title: "初動対応と暫定復旧方針を決める".to_string(), description: None, order: 2 },
                Mission { id: "coming-incident-m3".to_string(), title: "初回報告とエスカレーションを実行する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-incident-triage-escalation".to_string(),
            title: "P2障害: 決済遅延バグ".to_string(),
            description: "P2障害のトリアージとエスカレーション判断を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "本番環境で『決済は成功しているが完了通知反映が最大20分遅延する』不具合が発生しています。P2想定で、優先度判定とエスカレーション判断を会話で進めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-triage-m1".to_string(), title: "事象の再現条件と影響ユーザーを特定する".to_string(), description: None, order: 1 },
                Mission { id: "coming-triage-m2".to_string(), title: "優先度と対応期限を決定する".to_string(), description: None, order: 2 },
                Mission { id: "coming-triage-m3".to_string(), title: "エスカレーション先と報告リズムを確定する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-postmortem-followup".to_string(),
            title: "P3障害: 表示崩れバグの再発防止".to_string(),
            description: "P3障害の原因分析と再発防止策を決定する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Androidの一部端末でプロフィール画面のボタンが重なって表示崩れするP3不具合が報告されました。原因分析、優先度判断、再発防止策を会話で整理してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-postmortem-m1".to_string(), title: "事実と原因仮説を切り分ける".to_string(), description: None, order: 1 },
                Mission { id: "coming-postmortem-m2".to_string(), title: "恒久対応と暫定対応を決定する".to_string(), description: None, order: 2 },
                Mission { id: "coming-postmortem-m3".to_string(), title: "再発防止アクションを担当・期限付きで合意する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-project-rescue".to_string(),
            title: "遅延プロジェクト立て直し (チャレンジ)".to_string(),
            description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたは遅延しているプロジェクトのPM/PMOです。遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-rescue-m1".to_string(), title: "遅延要因とリスクを特定する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-rescue-m2".to_string(), title: "スコープ再構成と優先度を決める".to_string(), description: None, order: 2 },
                Mission { id: "challenge-rescue-m3".to_string(), title: "リカバリ計画とコミュニケーション案を作る".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-deadline-advance".to_string(),
            title: "リリース期限の突然の前倒し (チャレンジ)".to_string(),
            description: "外部要因で期限が前倒しになり、影響分析と打ち手を提案する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとしてリリース期限が突然前倒しになった状況に対応します。影響範囲を整理し、複数の打ち手と合意形成を進めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-deadline-m1".to_string(), title: "影響範囲を洗い出す".to_string(), description: None, order: 1 },
                Mission { id: "challenge-deadline-m2".to_string(), title: "選択肢とトレードオフを提示する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-deadline-m3".to_string(), title: "合意した方針と次アクションを決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-progress-visibility".to_string(),
            title: "進捗が見えない状況への対応 (チャレンジ)".to_string(),
            description: "進捗が見えない状況で可視化と打ち手を設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして進捗が見えない状況に対応します。最小限の可視化手段と報告リズムを設計し、次アクションを決めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-visibility-m1".to_string(), title: "進捗可視化の指標と方法を決める".to_string(), description: None, order: 1 },
                Mission { id: "challenge-visibility-m2".to_string(), title: "リスク要因を整理する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-visibility-m3".to_string(), title: "報告と次アクションを合意する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-quality-fire".to_string(),
            title: "品質問題の緊急対応と優先度調整 (チャレンジ)".to_string(),
            description: "品質問題が発生し、緊急対応と優先度を再調整する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして品質問題に緊急対応します。原因と影響を整理し、優先度と対応方針を合意してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-quality-m1".to_string(), title: "品質問題の原因と影響を整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-quality-m2".to_string(), title: "緊急対応と優先度を決める".to_string(), description: None, order: 2 },
                Mission { id: "challenge-quality-m3".to_string(), title: "関係者への説明と合意を行う".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-ambiguous-request".to_string(),
            title: "要件が曖昧な依頼への対応 (チャレンジ)".to_string(),
            description: "曖昧な要求を具体化し、合意できるスコープを作る。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして曖昧な依頼に対応します。成功条件と仮スコープを整理し、確認事項と次アクションを合意してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-ambiguous-m1".to_string(), title: "成功条件を明確化する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-ambiguous-m2".to_string(), title: "仮スコープと非対象を整理する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-ambiguous-m3".to_string(), title: "確認事項と次アクションを決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-scope-addition".to_string(),
            title: "追加スコープ要求の交渉 (チャレンジ)".to_string(),
            description: "追加要求に対してスコープ調整と合意形成を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして追加スコープ要求の交渉を行います。代替案と影響を提示し、合意内容をまとめてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-scopeadd-m1".to_string(), title: "追加要求の背景と目的を整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-scopeadd-m2".to_string(), title: "代替案と影響を提示する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-scopeadd-m3".to_string(), title: "合意内容と次アクションを決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-scope-negotiation".to_string(),
            title: "スコープ／リソース交渉 (チャレンジ)".to_string(),
            description: "顧客や上長とスコープ削減かリソース増加を交渉し、合意形成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとしてスコープまたはリソースの交渉を行います。代替案とインパクトを提示し、短時間で合意を得てください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-negotiation-m1".to_string(), title: "譲れない条件とBATNAを整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-negotiation-m2".to_string(), title: "スコープ/リソースの代替案とインパクトをまとめる".to_string(), description: None, order: 2 },
                Mission { id: "challenge-negotiation-m3".to_string(), title: "合意プロセスとステークホルダー調整を計画する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-impossible-request".to_string(),
            title: "エンジニアから「無理です」と言われる (チャレンジ)".to_string(),
            description: "技術的制約を理解し、代替案と合意を作る。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPMとしてエンジニアから実現困難と指摘された状況に対応します。制約を整理し、代替案と合意形成を進めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-impossible-m1".to_string(), title: "制約・根拠を明確化する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-impossible-m2".to_string(), title: "代替案と影響を比較する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-impossible-m3".to_string(), title: "合意した対応と次アクションを決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-conflict-mediation".to_string(),
            title: "コンフリクト調整 (チャレンジ)".to_string(),
            description: "開発とQA・ビジネスの対立をファシリテートし、合意に導く。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして対立が発生している会議をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-conflict-m1".to_string(), title: "論点と事実/解釈を分けて整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-conflict-m2".to_string(), title: "合意の選択肢と条件を提示する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-conflict-m3".to_string(), title: "フォロータスクと担当を決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-priority-conflict".to_string(),
            title: "優先度対立のファシリテーション (チャレンジ)".to_string(),
            description: "関係者間の優先度対立を整理し、合意に導く。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとして優先度対立をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-priority-m1".to_string(), title: "対立の論点を整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-priority-m2".to_string(), title: "合意の選択肢と条件を提示する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-priority-m3".to_string(), title: "フォロータスクと担当を決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-stakeholder-misalignment".to_string(),
            title: "ステークホルダーとの認識ズレ解消 (チャレンジ)".to_string(),
            description: "期待値のズレを解消し、共通認識と再発防止を作る。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとしてステークホルダー間の認識ズレを解消します。ズレの原因を整理し、共通認識と再発防止プロセスを合意してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-alignment-m1".to_string(), title: "ズレているポイントを特定する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-alignment-m2".to_string(), title: "共通認識を再整理する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-alignment-m3".to_string(), title: "再発防止の確認プロセスを決める".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "challenge-user-perspective".to_string(),
            title: "ユーザー視点が抜けていることへの気づき (チャレンジ)".to_string(),
            description: "ユーザー視点の欠落に気づき、価値に立ち返る。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "あなたはPM/PMOとしてユーザー視点が抜けていることに気づきます。ユーザー行動を整理し、最小限の改善案と合意を作ってください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "challenge-user-m1".to_string(), title: "ユーザー行動フローを整理する".to_string(), description: None, order: 1 },
                Mission { id: "challenge-user-m2".to_string(), title: "価値と影響を説明する".to_string(), description: None, order: 2 },
                Mission { id: "challenge-user-m3".to_string(), title: "最小改善案と合意をまとめる".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: None,
            single_response: None,
        },
        // Placeholder scenarios for new frontend categories
        Scenario {
            id: "test-login".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能のテストケースを作成し、認証フローとセキュリティ観点を網羅する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "login".to_string(),
                description: "メールアドレスとパスワードで認証するログインフォームです。".to_string(),
            }),
            kickoff_prompt: "今回はログイン機能のテストケース作成に取り組みます。認証フローとセキュリティの観点を意識しましょう。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "テストカバレッジ".to_string(), weight: 50.0, score: None, feedback: None },
                EvaluationCategory { name: "セキュリティ考慮".to_string(), weight: 50.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\nログイン機能のテストケースを作成してください。正常系・異常系・セキュリティ観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- 異常系テストケース\n- セキュリティ観点のテストケース\n- 前提条件・テストデータ\n\n## 背景情報\nログインフォームはメールアドレスとパスワードで認証します。ソーシャルログイン（Google）も対応しています。連続ログイン失敗時のロック機能があります。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "test-form".to_string(),
            title: "フォーム機能".to_string(),
            description: "フォーム機能のテストケースを作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "form".to_string(),
                description: "入力フォーム".to_string(),
            }),
            kickoff_prompt: "フォーム機能のテストケースを作成します。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "テストカバレッジ".to_string(), weight: 100.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\nフォーム機能のテストケースを作成してください。入力バリデーション・エラー表示・UX観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- バリデーションエラーケース\n- UI・UXテストケース\n- 前提条件・テストデータ\n\n## 背景情報\n問い合わせフォームです。入力項目は氏名・メール・件名・本文。全項目必須。メールアドレスは形式チェックあり。送信後に確認メールが送られます。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "test-file-upload".to_string(),
            title: "ファイルアップロード機能".to_string(),
            description: "ファイルアップロード機能のテストケースを作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "file-upload".to_string(),
                description: "ファイルアップロード機能".to_string(),
            }),
            kickoff_prompt: "ファイルアップロード機能のテストケースを作成します。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "テストカバレッジ".to_string(), weight: 100.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\nファイルアップロード機能のテストケースを作成してください。ファイル種別・サイズ制限・エラー処理・セキュリティ観点を網羅してください。\n\n期待される構成:\n- 正常系テストケース\n- ファイル種別・サイズ検証ケース\n- エラー処理ケース\n- セキュリティケース\n- 前提条件・テストデータ\n\n## 背景情報\n証跡アップロード機能。対応形式はJPG・PNG・PDF。最大サイズは10MB。複数ファイル同時アップロード可（最大5件）。アップロード後にウイルスチェックが走ります。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-definition-doc".to_string(),
            title: "要件定義書作成".to_string(),
            description: "要件定義書を作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "要件定義書を作成します。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "要件定義品質".to_string(), weight: 100.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\nログイン機能の要件定義を行ってください。『ログインできない』問い合わせが増えているという課題に対して、最低限のログイン体験を安定化するための要件を整理してください。会話を通じて段階的に要件を合意していきましょう。\n\n期待される構成:\n- 目的・対象ユーザー\n- 受入条件\n- 非対象と不明点の確認\n\n## 背景情報\nログインできない問い合わせが週30件を超えています。主な原因はパスワード忘れとソーシャルログイン連携のエラーです。開発リソースは1スプリント（2週間）です。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-hearing-plan".to_string(),
            title: "要件ヒアリング計画".to_string(),
            description: "要件ヒアリング計画を作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "要件ヒアリング計画を作成します。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "計画品質".to_string(), weight: 100.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\n問い合わせフォーム機能の要件ヒアリング計画を作成してください。CS側の「入力項目を減らしたい」という要求と、法務側の「同意取得を厳格化したい」という要求の両立を検討してください。\n\n期待される構成:\n- ヒアリング目的と対象者\n- CSへの確認事項\n- 法務への確認事項\n- 優先度と進め方\n\n## 背景情報\nCSチームは問い合わせ件数削減のために入力項目を5→3項目に減らしたい。法務チームは個人情報保護の観点から同意チェックボックスを2→4項目に増やしたい。リリースは来月を予定。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-user-story".to_string(),
            title: "ユーザーストーリー作成".to_string(),
            description: "ユーザーストーリーを作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "ユーザーストーリーを作成します。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "ストーリー品質".to_string(), weight: 100.0, score: None, feedback: None },
            ],
            passing_score: Some(60.0),
            missions: None,
            agent_prompt: Some("## タスク指示\nファイルアップロード機能のユーザーストーリーを作成してください。「早期リリースしたい」という開発側の要望と「サイズ制限を厳格にしたい」というセキュリティ側の要望を踏まえて、ユーザー視点で要件を整理してください。\n\n期待される構成:\n- ユーザーストーリー（As a... I want... So that...）\n- 受入条件（Given/When/Then）\n- 完了定義（DoD）\n\n## 背景情報\n証跡アップロード機能の第1フェーズ。開発チームはMVPとして2週間で出したい。セキュリティチームはウイルスチェックと10MB制限を必須としている。ユーザーは請求に必要な証跡写真をスマホで撮ってアップロードする想定。".to_string()),
            single_response: None,
        },
        // Placeholder coming soon scenarios
        Scenario {
            id: "coming-incident-response".to_string(),
            title: "障害対応".to_string(),
            description: "障害対応を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-incident-triage-escalation".to_string(),
            title: "障害トリアージとエスカレーション".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-postmortem-followup".to_string(),
            title: "ポストモーテム・フォローアップ".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-priority-tradeoff-workshop".to_string(),
            title: "優先度トレードオフワークショップ".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-stakeholder-negotiation".to_string(),
            title: "ステークホルダー交渉".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "coming-decision-log-alignment".to_string(),
            title: "決定ログの整理と共有".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "adv-data-roi".to_string(),
            title: "データ分析とROI評価".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
        Scenario {
            id: "adv-strategy-diagnosis".to_string(),
            title: "戦略診断".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: None,
            single_response: None,
        },
    ];

    for scenario in scenarios.iter_mut() {
        scenario.scenario_type = scenario_type_for_id(&scenario.id);
    }

    scenarios
}


// Add ScoringGuidelines for evaluation criteria
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScoringGuidelines {
    pub excellent: String,
    pub good: String,
    pub needs_improvement: String,
    pub poor: String,
}

// Add RatingCriterion (full version with guidelines)
#[allow(dead_code)]
#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RatingCriterion {
    pub id: String,
    pub name: String,
    pub weight: f32,
    pub description: String,
    pub scoring_guidelines: ScoringGuidelines,
}
