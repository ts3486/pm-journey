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
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "scenario_guide")]
    pub scenario_guide: Option<String>,
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
            id: "basic-intro-alignment".to_string(),
            title: "自己紹介".to_string(),
            description: "新規PJに参加するPM/PMOとして、自己紹介を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
            kickoff_prompt: "新規PJに参加するPM/PMOとして、自己紹介をしてみてください！".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "礼儀".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "自己紹介の明確さ".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コミュニケーション能力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "印象管理".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-intro-m1".to_string(), title: "自己紹介を行う".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("次の一文だけ返答してください。「ありがとうございます、これからよろしくお願いします！」".to_string()),
            single_response: Some(true),
        },
        Scenario {
            id: "basic-product-understanding".to_string(),
            title: "プロダクト理解".to_string(),
            description: "新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: "プロダクト理解のシナリオです。プロダクトの全体像を掴むために適切な質問をしてください。プロダクトの全体像を把握できたら、シナリオを完了してください。".to_string().into(),
            kickoff_prompt: "まずはプロダクト理解を進めましょう。以下の情報をもとに、プロダクト全体像を掴みましょう。\n\n■ プロダクト: 保険金請求サポートサービス\n保険金請求に必要な証跡の案内、自動検知、進捗可視化を提供するサービス\n\n■ 主な機能\n- ステップ形式で必要書類を案内し、提出漏れを防ぐ\n- 不足証跡を自動で検知し、再提出を最小化する\n- 請求進捗をリアルタイムで可視化し、ユーザー不安を軽減する\n\nプロダクトが解決しようとしている課題や、達成したい目標について理解を深めることが、全体像を掴む上で重要です。まずは、このサービスがどのような課題を解決しようとしているのか、考えてみましょう。".to_string(),
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
            agent_prompt: Some("ユーザーがプロダクト理解するためのサポートをしてください。ユーザーはプロダクト概要の情報は一切持っていない前提で話してください。ユーザーの質問に答えたあと、必ず別のプロダクトに対する質問を促してください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-meeting-minutes".to_string(),
            title: "議事録の作成".to_string(),
            description: "ミーティング内容を整理し、議事録を作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
            kickoff_prompt: "先ほどのミーティング内容をもとに議事録を作成してください。参加者、議題、決定事項、アクションアイテム、次回予定を含めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-minutes-m1".to_string(), title: "議事録を作成する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("ユーザーが議事録を作成するのをサポートしてください。必要に応じてミーティングの詳細情報を提供してください。".to_string()),
            single_response: None,
        },
        // Test-case scenarios
        Scenario {
            id: "test-login".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能のテストケースをエージェントと共同して設計する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: Some(FeatureMockup {
                component: "login".to_string(),
                description: "メールアドレスとパスワードで認証するログインフォームです。".to_string(),
            }),
            scenario_guide: "ログイン機能のテストケースを作成するシナリオです。テストケース作成や機能について質問があればエージェントに質問をしてみましょう。テストケースが十分だと判断したら、シナリオを完了してください。".to_string().into(),
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
            agent_prompt: Some("ログイン機能のテストケースを作成するシナリオです。ユーザーのログイン機能の理解やテストケース作成をサポートしてください。".to_string()),
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
            scenario_guide: "フォーム機能のテストケースを作成するシナリオです。テストケース作成や機能について質問があれば右下のチャットUIからエージェントに質問をしてみましょう。".to_string().into(),
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
            agent_prompt: Some("フォーム機能のテストケースを作成するシナリオです。ユーザーのフォーム機能の理解やテストケース作成作りをサポートしてください。".to_string()),
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
            scenario_guide: "ファイルアップロード機能のテストケースを作成するシナリオです。テストケース作成や機能について質問があれば右下のチャットUIからエージェントに質問をしてみましょう。".to_string().into(),
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
            agent_prompt: Some("ファイルアップロード機能のテストケースを作成するシナリオです。ユーザーのファイルアップロード機能の理解やテストケース作成をサポートしてください。".to_string()),
            single_response: None,
        },
        // Requirement-definition scenarios
        Scenario {
            id: "basic-requirement-definition-doc".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能の要件定義をエージェントと共同して作成する。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "login".to_string(), description: "メールアドレスとパスワードで認証するログインフォームです。".to_string() }),
            scenario_guide: "ログイン機能の要件定義を作成するシナリオです。エージェントと要件定義について相談しながら、要件定義をチャット内でエージェントに送ってみましょう。要件定義が十分だと判断したら、シナリオを完了してください。".to_string().into(),
            kickoff_prompt: "ログイン機能を開発する上でエンジニアやデザイナーに渡す、要件定義を作成してください。".to_string(),
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
            agent_prompt: Some("ログイン機能の要件定義を行うシナリオです。ユーザーのログイン機能の理解や要件定義作成をサポートしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-hearing-plan".to_string(),
            title: "問い合わせフォーム機能".to_string(),
            description: "問い合わせフォーム機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "form".to_string(), description: "お問い合わせフォームです。入力検証とエラー表示を確認できます。".to_string() }),
            scenario_guide: None,
            kickoff_prompt: "問い合わせフォーム機能の要件定義を行うシナリオです。ユーザーの問い合わせフォーム機能の理解や要件定義作成をサポートしてください。".to_string(),
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
            agent_prompt: Some("問い合わせフォーム機能の要件ヒアリング計画を作成するシナリオです。ユーザーの問い合わせフォーム機能の理解や要件ヒアリング計画作成をサポートしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-requirement-user-story".to_string(),
            title: "ファイルアップロード機能".to_string(),
            description: "ファイルアップロード機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "file-upload".to_string(), description: "ドラッグ＆ドロップ対応のファイルアップロード機能です。".to_string() }),
            scenario_guide: None,
            kickoff_prompt: "ファイルアップロード機能の要件定義を行うシナリオです。ユーザーのファイルアップロード機能の理解や要件定義作成をサポートしてください。".to_string(),
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
            agent_prompt: Some("ファイルアップロード機能のユーザーストーリーを作成するシナリオです。ユーザーのファイルアップロード機能の理解や要件定義作成をサポートしてください。".to_string()),
            single_response: None,
        },
        // Incident-response scenarios
        Scenario {
            id: "coming-incident-response".to_string(),
            title: "P1障害: ログイン不能バグの緊急対応".to_string(),
            description: "P1障害の初動対応と報告を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
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
            agent_prompt: Some("P1障害の初動対応を行うシナリオです。ユーザーの障害理解や初動対応の整理をサポートしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "coming-incident-triage-escalation".to_string(),
            title: "P2障害: 決済遅延バグ".to_string(),
            description: "P2障害のトリアージとエスカレーション判断を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
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
            agent_prompt: Some("P2障害のトリアージとエスカレーション判断を行うシナリオです。ユーザーの障害理解や初動対応の整理をサポートしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "coming-postmortem-followup".to_string(),
            title: "P3障害: 表示崩れバグの再発防止".to_string(),
            description: "P3障害の原因分析と再発防止策を決定する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
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
            agent_prompt: Some("P3障害の原因分析と再発防止策を決定するシナリオです。ユーザーの障害理解や初動対応の整理をサポートしてください。".to_string()),
            single_response: None,
        },
        // Business-execution scenarios
        Scenario {
            id: "coming-priority-tradeoff-workshop".to_string(),
            title: "優先度トレードオフ".to_string(),
            description: "複数の候補案を比較し、段階リリース計画を決定する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
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
            agent_prompt: Some("優先度トレードオフのシナリオです。複数の候補案を比較し、段階リリース計画を決定するサポートをしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "adv-data-roi".to_string(),
            title: "データ分析".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: Some("データ分析のシナリオです。データに基づいた意思決定をサポートしてください。".to_string()),
            single_response: None,
        },
        Scenario {
            id: "adv-strategy-diagnosis".to_string(),
            title: "プロダクト戦略".to_string(),
            description: "Coming soon...".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: None,
            kickoff_prompt: "Coming soon...".to_string(),
            evaluation_criteria: vec![],
            passing_score: None,
            missions: None,
            agent_prompt: Some("プロダクト戦略のシナリオです。戦略的な意思決定をサポートしてください。".to_string()),
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
