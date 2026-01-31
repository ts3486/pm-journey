use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ScenarioType {
    Basic,
    TestCase,
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
    pub discipline: ScenarioDiscipline,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "scenario_type")]
    pub scenario_type: Option<ScenarioType>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "feature_mockup")]
    pub feature_mockup: Option<FeatureMockup>,
    pub product: ProductInfo,
    pub mode: String,
    #[serde(default)]
    pub behavior: ScenarioBehavior,
    #[serde(alias = "kickoff_prompt")]
    pub kickoff_prompt: String,
    #[serde(alias = "evaluation_criteria")]
    pub evaluation_criteria: Vec<EvaluationCategory>,
    #[serde(alias = "passing_score")]
    pub passing_score: Option<f32>,
    pub missions: Option<Vec<Mission>>,
    #[serde(alias = "supplemental_info")]
    pub supplemental_info: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
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
    #[serde(alias = "success_criteria")]
    pub success_criteria: Vec<String>,
    #[serde(alias = "unique_edge")]
    pub unique_edge: Option<String>,
    #[serde(alias = "tech_stack")]
    pub tech_stack: Option<Vec<String>>,
    #[serde(alias = "core_features")]
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
    #[serde(alias = "message_count")]
    pub message_count: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ManagerComment {
    pub id: String,
    #[serde(alias = "session_id")]
    pub session_id: String,
    #[serde(alias = "author_name")]
    pub author_name: Option<String>,
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
#[serde(rename_all = "UPPERCASE")]
pub enum ScenarioDiscipline {
    Basic,
    Challenge,
}

pub fn default_scenarios() -> Vec<Scenario> {
    vec![
        Scenario {
            id: "basic-intro-alignment".to_string(),
            title: "自己紹介＆期待値合わせ".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "新規プロジェクトに合流し、役割と成功条件を30分で擦り合わせる。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "オンボーディングワークショップ".to_string(),
                summary: "ステークホルダーと目的・役割・進め方を合意する初回ミーティング。".to_string(),
                audience: "プロダクトオーナー、開発リーダー、QA".to_string(),
                problems: vec!["役割が不明瞭".to_string(), "優先度の解像度が低い".to_string()],
                goals: vec!["役割・責任の明確化".to_string(), "初期コミュニケーション計画の合意".to_string()],
                differentiators: vec!["シンプルな準備リスト".to_string(), "会話テンプレート".to_string()],
                scope: vec!["自己紹介".to_string(), "目的確認".to_string(), "進め方合意".to_string()],
                constraints: vec!["30分タイムボックス".to_string(), "参加者3名想定".to_string()],
                timeline: "初回ミーティング当日".to_string(),
                success_criteria: vec!["期待値の一致が確認できる".to_string(), "次アクションが2件以上決定".to_string()],
                unique_edge: Some("短時間で役割と進め方を固める練習に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["メモ".to_string(), "アクション記録".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("時間配分（5分自己紹介/15分期待値/10分次アクション）を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-agenda-facilitation".to_string(),
            title: "アジェンダを設定してミーティングを進行".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "目的に沿った会議を進行し、合意と次アクションを作る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "ミーティング進行テンプレ".to_string(),
                summary: "目的とアジェンダを明確にし、短時間で合意を得る進行メモ。".to_string(),
                audience: "開発リード、デザイナー、QA".to_string(),
                problems: vec!["目的が曖昧".to_string(), "議論が脱線".to_string(), "アクションが決まらない".to_string()],
                goals: vec!["目的の明確化".to_string(), "時間内に合意".to_string(), "次アクションの明文化".to_string()],
                differentiators: vec!["アジェンダテンプレ".to_string(), "タイムボックス設計".to_string()],
                scope: vec!["目的定義".to_string(), "アジェンダ設定".to_string(), "合意形成".to_string()],
                constraints: vec!["30分以内".to_string(), "参加者5名以内".to_string()],
                timeline: "次回定例ミーティング".to_string(),
                success_criteria: vec!["アジェンダ通りに進行".to_string(), "次アクションが決定".to_string()],
                unique_edge: Some("短時間会議の進行に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["アジェンダ表".to_string(), "タイムボックス".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
            kickoff_prompt: "あなたはPMとしてミーティングを進行します。目的を一文で定義し、アジェンダと時間配分を設定し、次のアクションを合意してください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-agenda-m1".to_string(), title: "ミーティングのアジェンダを作成する".to_string(), description: None, order: 1 },
            ]),
            supplemental_info: Some("目的の一文定義と時間配分の明確化を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-meeting-minutes".to_string(),
            title: "議事メモの作成と共有".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "会議内容を要点・決定・アクションに整理し共有する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "議事メモテンプレ".to_string(),
                summary: "会議内容を決定/未決/アクションに整理し、共有しやすくする。".to_string(),
                audience: "プロジェクトメンバー、関係者".to_string(),
                problems: vec!["決定事項が伝わらない".to_string(), "担当が曖昧".to_string(), "共有が遅い".to_string()],
                goals: vec!["決定事項の可視化".to_string(), "担当・期日の明記".to_string(), "共有スピード向上".to_string()],
                differentiators: vec!["決定事項テンプレ".to_string(), "アクション欄".to_string()],
                scope: vec!["決定事項整理".to_string(), "未決事項整理".to_string(), "アクション明記".to_string()],
                constraints: vec!["会議終了後30分以内に共有".to_string(), "関係者10名".to_string()],
                timeline: "会議当日中".to_string(),
                success_criteria: vec!["決定事項とアクションが明文化".to_string(), "関係者に共有済み".to_string()],
                unique_edge: Some("議事メモ作成に集中".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["議事メモ欄".to_string(), "アクションチェック".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("読み手がすぐ理解できる要約とアクション整理を重視してください。".to_string()),
        },
        Scenario {
            id: "basic-schedule-share".to_string(),
            title: "スケジュール感の共有".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "プロジェクトの見通しとマイルストーンを共有する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "スケジュール共有シート".to_string(),
                summary: "全体像とマイルストーンを整理し、関係者に共有する。".to_string(),
                audience: "開発チーム、ビジネス担当".to_string(),
                problems: vec!["全体像が不透明".to_string(), "マイルストーンが曖昧".to_string(), "前提条件が共有されない".to_string()],
                goals: vec!["全体像の共有".to_string(), "重要マイルストーンの明示".to_string(), "前提条件の整理".to_string()],
                differentiators: vec!["マイルストーンテンプレ".to_string(), "判断ポイント整理".to_string()],
                scope: vec!["全体像整理".to_string(), "マイルストーン整理".to_string(), "判断ポイント整理".to_string()],
                constraints: vec!["初期計画は暫定".to_string(), "スプリントは2週間".to_string()],
                timeline: "今週中に共有".to_string(),
                success_criteria: vec!["マイルストーンが合意".to_string(), "次の判断ポイントが明確".to_string()],
                unique_edge: Some("見通し共有の練習に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["マイルストーン表".to_string(), "前提メモ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("不確実性や前提条件を必ず共有してください。".to_string()),
        },
        Scenario {
            id: "basic-docs-refine".to_string(),
            title: "既存資料の軽微な修正".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "資料を読み手に伝わる形に整える。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "資料修正メモ".to_string(),
                summary: "目的と対象を整理し、表現と構成を改善する。".to_string(),
                audience: "関係者、チームメンバー".to_string(),
                problems: vec!["表現が分かりにくい".to_string(), "構成が散漫".to_string(), "要点が伝わらない".to_string()],
                goals: vec!["目的の明確化".to_string(), "表現の改善".to_string(), "要点の強調".to_string()],
                differentiators: vec!["レビュー観点整理".to_string(), "要点ハイライト".to_string()],
                scope: vec!["目的整理".to_string(), "表現修正".to_string(), "要点整理".to_string()],
                constraints: vec!["軽微な修正のみ".to_string(), "既存構成は大きく変更しない".to_string()],
                timeline: "本日中に共有".to_string(),
                success_criteria: vec!["要点が伝わる".to_string(), "読みやすさが改善".to_string()],
                unique_edge: Some("軽微修正に集中".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["修正メモ".to_string(), "レビュー観点".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("読み手が迷わない構成と簡潔な表現を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-ticket-refine".to_string(),
            title: "チケット要件整理".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "曖昧なチケットを受入可能な形に分解し、スプリントに載せられる状態へ整理する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "チケット精査セッション".to_string(),
                summary: "目的と受入条件を固め、開発が着手できる粒度に落とし込む。".to_string(),
                audience: "プロダクトオーナー、開発チーム、QA".to_string(),
                problems: vec!["目的が曖昧".to_string(), "受入条件が無い".to_string(), "依存が不明".to_string()],
                goals: vec!["受入基準の明文化".to_string(), "優先度と依存を整理".to_string(), "工数見積もり可能な粒度にする".to_string()],
                differentiators: vec!["シンプルなACテンプレ".to_string(), "依存を見える化".to_string()],
                scope: vec!["目的確認".to_string(), "AC定義".to_string(), "依存・リスク整理".to_string()],
                constraints: vec!["既存スプリントの枠内で調整".to_string(), "非機能要件も確認".to_string()],
                timeline: "今週のスプリント前".to_string(),
                success_criteria: vec!["ACが3〜5件明文化".to_string(), "依存/リスクが特定されている".to_string()],
                unique_edge: Some("受入基準作りと依存洗い出しに集中".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["ACテンプレ".to_string(), "依存チェックリスト".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("ACは観測可能な期待値で書き、依存は担当と期日をセットで整理してください。".to_string()),
        },
        Scenario {
            id: "basic-ticket-splitting".to_string(),
            title: "チケット分割と優先度付け".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "大きな依頼を分割し、優先順位と依存を整理する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "チケット分割メモ".to_string(),
                summary: "大きな依頼を実行可能な単位に分割し、優先順位を付ける。".to_string(),
                audience: "開発チーム、QA、PM".to_string(),
                problems: vec!["タスクが大きすぎる".to_string(), "優先度が曖昧".to_string(), "依存関係が不明".to_string()],
                goals: vec!["チケットの分割".to_string(), "優先順位の明確化".to_string(), "依存関係の整理".to_string()],
                differentiators: vec!["分割テンプレ".to_string(), "優先度ラベル".to_string()],
                scope: vec!["タスク分割".to_string(), "優先度整理".to_string(), "依存整理".to_string()],
                constraints: vec!["スプリント開始前に整理".to_string(), "最小リリースを意識".to_string()],
                timeline: "今週中に整理".to_string(),
                success_criteria: vec!["分割済みチケット".to_string(), "優先順位が合意".to_string()],
                unique_edge: Some("最小スコープ設計を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["分割リスト".to_string(), "優先度タグ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("最初のリリースで必要な最小スコープを意識してください。".to_string()),
        },
        Scenario {
            id: "basic-acceptance-review".to_string(),
            title: "受入条件のレビュー".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "既存の受入条件を見直し、検証可能性を高める。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "受入条件レビュー".to_string(),
                summary: "既存の受入条件を見直し、検証可能な形に整える。".to_string(),
                audience: "プロダクトオーナー、開発チーム、QA".to_string(),
                problems: vec!["受入条件が曖昧".to_string(), "検証方法が不明".to_string(), "依存が見えない".to_string()],
                goals: vec!["受入条件の明確化".to_string(), "検証可能性の向上".to_string(), "依存確認".to_string()],
                differentiators: vec!["ACテンプレ".to_string(), "検証観点メモ".to_string()],
                scope: vec!["ACレビュー".to_string(), "表現修正".to_string(), "依存確認".to_string()],
                constraints: vec!["既存チケットを前提".to_string(), "短時間レビュー".to_string()],
                timeline: "スプリント開始前".to_string(),
                success_criteria: vec!["ACが明確".to_string(), "検証方法が合意".to_string()],
                unique_edge: Some("受入条件の磨き込みに集中".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["ACリスト".to_string(), "修正メモ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("Given-When-Then形式や観測可能な条件を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-unknowns-discovery".to_string(),
            title: "不明点の洗い出し".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "曖昧な前提や未決事項を可視化し、確認計画を立てる。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "不明点整理シート".to_string(),
                summary: "要件の不明点を洗い出し、確認計画を立てるための整理シート。".to_string(),
                audience: "PM、開発、ビジネス担当".to_string(),
                problems: vec!["前提が曖昧".to_string(), "確認先が不明".to_string(), "判断が遅れる".to_string()],
                goals: vec!["不明点の可視化".to_string(), "確認先の特定".to_string(), "解消計画の策定".to_string()],
                differentiators: vec!["不明点テンプレ".to_string(), "確認優先度ラベル".to_string()],
                scope: vec!["不明点整理".to_string(), "確認先整理".to_string(), "優先度付け".to_string()],
                constraints: vec!["スプリント計画前に整理".to_string(), "関係者3〜5名".to_string()],
                timeline: "今週中に確認".to_string(),
                success_criteria: vec!["不明点リストが完成".to_string(), "確認計画が合意".to_string()],
                unique_edge: Some("曖昧さの可視化に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["不明点一覧".to_string(), "確認先メモ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("影響度が高い不明点から優先して解消してください。".to_string()),
        },
        Scenario {
            id: "basic-testcase-design".to_string(),
            title: "テストケース作成".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "新機能の仕様からスモーク/回帰テストケースを洗い出し、漏れのない最小集合を作る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "テスト計画メモ".to_string(),
                summary: "正常系と主要な異常系を素早く列挙し、優先度を付ける。".to_string(),
                audience: "QA、開発チーム、PM".to_string(),
                problems: vec!["ケース漏れ".to_string(), "優先度不明".to_string(), "前提データ不備".to_string()],
                goals: vec!["必須ケースの明確化".to_string(), "前提データと環境の定義".to_string(), "優先度付け".to_string()],
                differentiators: vec!["スモーク優先リスト".to_string(), "前提データチェック".to_string()],
                scope: vec!["正常系".to_string(), "主要異常系".to_string(), "前提データ・環境".to_string()],
                constraints: vec!["テスト時間は1日以内".to_string(), "主要ブラウザ2種のみ".to_string()],
                timeline: "今週のデプロイ前".to_string(),
                success_criteria: vec!["スモークケース5〜10件".to_string(), "前提データ/環境が明確".to_string()],
                unique_edge: Some("短時間で漏れに強い最小セットを作る練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["ケース一覧".to_string(), "優先度タグ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
            kickoff_prompt: "あなたはQA/PMとして新機能のテストケースを作成します。正常系と主要な異常系を洗い出し、前提データと環境を明記してください。".to_string(),
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
            supplemental_info: Some("カバレッジを意識しつつ、時間制約に収まる最小セットを優先してください。".to_string()),
        },
        Scenario {
            id: "basic-test-viewpoints".to_string(),
            title: "テスト観点の洗い出しと優先度付け".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "仕様からテスト観点を洗い出し、リスクベースで優先度を付ける。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "テスト観点リスト".to_string(),
                summary: "仕様からテスト観点を整理し、優先度を付けるためのチェックリスト。".to_string(),
                audience: "QA、開発、PM".to_string(),
                problems: vec!["観点が漏れる".to_string(), "優先度が不明".to_string(), "前提条件が曖昧".to_string()],
                goals: vec!["観点の網羅".to_string(), "優先度付け".to_string(), "前提条件の明確化".to_string()],
                differentiators: vec!["観点テンプレ".to_string(), "リスク評価欄".to_string()],
                scope: vec!["観点洗い出し".to_string(), "優先度設定".to_string(), "前提条件整理".to_string()],
                constraints: vec!["テスト準備は半日以内".to_string(), "主要ブラウザのみ".to_string()],
                timeline: "次回リリース前".to_string(),
                success_criteria: vec!["観点リストが完成".to_string(), "優先度が合意".to_string()],
                unique_edge: Some("観点の整理に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["観点一覧".to_string(), "優先度タグ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("観点の抜け漏れがないか、仕様との対応を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-test-risk-review".to_string(),
            title: "テスト計画のリスクレビュー".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "既存のテスト計画を見直し、リスクベースで優先度を調整する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "テスト計画レビュー".to_string(),
                summary: "高リスク領域のテスト優先度を見直すレビューセッション。".to_string(),
                audience: "QA、開発、PM".to_string(),
                problems: vec!["重要領域が抜ける".to_string(), "優先度が古い".to_string(), "前提条件が不明".to_string()],
                goals: vec!["高リスク領域の特定".to_string(), "優先度の再整理".to_string(), "前提条件の確認".to_string()],
                differentiators: vec!["リスクレビュー表".to_string(), "優先度再設定".to_string()],
                scope: vec!["高リスク領域整理".to_string(), "優先度再設定".to_string(), "前提条件確認".to_string()],
                constraints: vec!["時間は30分".to_string(), "直近リリースが近い".to_string()],
                timeline: "デプロイ前日".to_string(),
                success_criteria: vec!["優先度の再合意".to_string(), "テスト計画の更新".to_string()],
                unique_edge: Some("リスクベース見直しに特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["リスク一覧".to_string(), "優先度タグ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("限られた時間で効果が高いテストに集中してください。".to_string()),
        },
        Scenario {
            id: "basic-regression-smoke".to_string(),
            title: "回帰テストの最小セット整理".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "回帰テストの必須ケースを最小セットで整理する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "回帰テスト整理メモ".to_string(),
                summary: "回帰テストの必須ケースを整理し、最小セットを合意する。".to_string(),
                audience: "QA、開発、PM".to_string(),
                problems: vec!["ケースが多すぎる".to_string(), "優先度が不明".to_string(), "前提条件が曖昧".to_string()],
                goals: vec!["必須ケースの整理".to_string(), "優先度の合意".to_string(), "前提条件の明確化".to_string()],
                differentiators: vec!["最小セットの定義".to_string(), "優先度タグ".to_string()],
                scope: vec!["回帰フロー整理".to_string(), "優先度設定".to_string(), "前提条件整理".to_string()],
                constraints: vec!["テスト時間は半日".to_string(), "主要フロー中心".to_string()],
                timeline: "リリース直前".to_string(),
                success_criteria: vec!["最小セットが合意".to_string(), "前提条件が明確".to_string()],
                unique_edge: Some("最小回帰セットの設計に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["回帰フロー".to_string(), "優先度タグ".to_string()]),
            },
            mode: "guided".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("最小セットで品質を担保できる範囲を意識してください。".to_string()),
        },
        Scenario {
            id: "challenge-project-rescue".to_string(),
            title: "遅延プロジェクト立て直し (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "リカバリプラン".to_string(),
                summary: "納期リスクを抑えつつ、価値を守るための再計画を提示する。".to_string(),
                audience: "経営層、プロダクトオーナー、開発リード".to_string(),
                problems: vec!["スケジュール遅延".to_string(), "スコープ肥大".to_string(), "ステークホルダー不安".to_string()],
                goals: vec!["最小価値リリースの合意".to_string(), "リカバリ計画策定".to_string(), "コミュニケーション強化".to_string()],
                differentiators: vec!["スコープカット候補の明示".to_string(), "リカバリの優先度付け".to_string()],
                scope: vec!["遅延要因分析".to_string(), "スコープ再構成".to_string(), "リカバリ計画".to_string()],
                constraints: vec!["納期は固定".to_string(), "品質バーは下げない".to_string()],
                timeline: "2週間で方向性合意".to_string(),
                success_criteria: vec!["MVPリリースに合意".to_string(), "リスク/前提が透明化".to_string()],
                unique_edge: Some("交渉と計画立案を同時に練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["リカバリメモ".to_string(), "ステークホルダー通知".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("品質バーを下げずに間に合わせる打ち手（並行作業・カット案・リソース振替）を検討してください。".to_string()),
        },
        Scenario {
            id: "challenge-deadline-advance".to_string(),
            title: "リリース期限の突然の前倒し (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "外部要因で期限が前倒しになり、影響分析と打ち手を提案する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "前倒し対応ブリーフ".to_string(),
                summary: "期限前倒しの影響を整理し、選択肢を合意するためのブリーフ。".to_string(),
                audience: "経営層、プロダクトオーナー、開発リード".to_string(),
                problems: vec!["期限前倒し".to_string(), "リソース不足".to_string(), "品質リスク".to_string()],
                goals: vec!["影響範囲の整理".to_string(), "打ち手の提示".to_string(), "合意形成".to_string()],
                differentiators: vec!["影響範囲チェック".to_string(), "トレードオフ整理".to_string()],
                scope: vec!["影響分析".to_string(), "代替案提示".to_string(), "合意形成".to_string()],
                constraints: vec!["期限は変更不可".to_string(), "主要機能は維持".to_string()],
                timeline: "1週間以内に意思決定".to_string(),
                success_criteria: vec!["合意済みの対応方針".to_string(), "次アクションが明文化".to_string()],
                unique_edge: Some("前倒し対応の意思決定を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["影響チェック表".to_string(), "対応方針メモ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("品質・スコープ・リソースのトレードオフを明確にしてください。".to_string()),
        },
        Scenario {
            id: "challenge-progress-visibility".to_string(),
            title: "進捗が見えない状況への対応 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "進捗が見えない状況で可視化と打ち手を設計する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "進捗可視化メモ".to_string(),
                summary: "最小限の指標と報告リズムを設計し、進捗を見える化する。".to_string(),
                audience: "開発リード、プロダクトオーナー".to_string(),
                problems: vec!["進捗が不透明".to_string(), "報告が遅い".to_string(), "リスクが見えない".to_string()],
                goals: vec!["進捗可視化".to_string(), "リスク把握".to_string(), "報告リズムの合意".to_string()],
                differentiators: vec!["最小指標の定義".to_string(), "報告テンプレ".to_string()],
                scope: vec!["指標設計".to_string(), "報告設計".to_string(), "次アクション".to_string()],
                constraints: vec!["追加工数は最小".to_string(), "週次報告".to_string()],
                timeline: "今週中に可視化開始".to_string(),
                success_criteria: vec!["進捗指標が合意".to_string(), "報告リズムが開始".to_string()],
                unique_edge: Some("最小限の可視化設計に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["進捗メトリクス".to_string(), "報告テンプレ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("最小限の指標で現状を把握できるようにしてください。".to_string()),
        },
        Scenario {
            id: "challenge-quality-fire".to_string(),
            title: "品質問題の緊急対応と優先度調整 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "品質問題が発生し、緊急対応と優先度を再調整する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "品質緊急対応メモ".to_string(),
                summary: "品質問題の原因と影響を整理し、対応方針を合意する。".to_string(),
                audience: "開発リード、プロダクトオーナー".to_string(),
                problems: vec!["重大バグ".to_string(), "ユーザー影響".to_string(), "優先度の混乱".to_string()],
                goals: vec!["原因の整理".to_string(), "対応優先度の合意".to_string(), "関係者説明".to_string()],
                differentiators: vec!["緊急対応テンプレ".to_string(), "優先度マトリクス".to_string()],
                scope: vec!["原因分析".to_string(), "優先度整理".to_string(), "合意形成".to_string()],
                constraints: vec!["時間が限られる".to_string(), "リソースは固定".to_string()],
                timeline: "当日中に対応方針決定".to_string(),
                success_criteria: vec!["対応方針が合意".to_string(), "ユーザー影響の説明が完了".to_string()],
                unique_edge: Some("緊急対応の意思決定を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["影響整理".to_string(), "優先度マトリクス".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("ユーザー影響とリリース計画のトレードオフを明確にしてください。".to_string()),
        },
        Scenario {
            id: "challenge-ambiguous-request".to_string(),
            title: "要件が曖昧な依頼への対応 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "曖昧な要求を具体化し、合意できるスコープを作る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "要件整理ブリーフ".to_string(),
                summary: "曖昧な要求を具体化し、仮スコープと確認事項を整理する。".to_string(),
                audience: "事業責任者、開発リード".to_string(),
                problems: vec!["要求が曖昧".to_string(), "成功条件が不明".to_string(), "判断が遅い".to_string()],
                goals: vec!["成功条件の明確化".to_string(), "仮スコープの合意".to_string(), "確認事項の整理".to_string()],
                differentiators: vec!["成功条件テンプレ".to_string(), "仮スコープ整理".to_string()],
                scope: vec!["成功条件整理".to_string(), "仮スコープ整理".to_string(), "確認事項整理".to_string()],
                constraints: vec!["期限は厳しい".to_string(), "関係者合意が必要".to_string()],
                timeline: "今週中に合意".to_string(),
                success_criteria: vec!["成功条件が合意".to_string(), "次アクションが明文化".to_string()],
                unique_edge: Some("曖昧要求の具体化を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["成功条件メモ".to_string(), "確認事項リスト".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("曖昧さを放置せず、仮置きでも合意を取って進めてください。".to_string()),
        },
        Scenario {
            id: "challenge-scope-addition".to_string(),
            title: "追加スコープ要求の交渉 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "追加要求に対してスコープ調整と合意形成を行う。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "追加要求ブリーフ".to_string(),
                summary: "追加要求の背景を整理し、代替案と影響を比較する。".to_string(),
                audience: "顧客、上長、開発リード".to_string(),
                problems: vec!["追加要求".to_string(), "納期圧迫".to_string(), "リソース不足".to_string()],
                goals: vec!["背景整理".to_string(), "代替案提示".to_string(), "合意形成".to_string()],
                differentiators: vec!["影響比較表".to_string(), "合意メモ".to_string()],
                scope: vec!["背景整理".to_string(), "代替案提示".to_string(), "合意形成".to_string()],
                constraints: vec!["期限は固定".to_string(), "リソース追加は限定的".to_string()],
                timeline: "今週中に合意".to_string(),
                success_criteria: vec!["合意済みの対応方針".to_string(), "次アクションが明文化".to_string()],
                unique_edge: Some("追加要求の交渉に特化".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["代替案表".to_string(), "影響整理".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("期限・品質・リソースのトレードオフを明確にしてください。".to_string()),
        },
        Scenario {
            id: "challenge-scope-negotiation".to_string(),
            title: "スコープ／リソース交渉 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "顧客や上長とスコープ削減かリソース増加を交渉し、合意形成する。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "交渉ブリーフィング".to_string(),
                summary: "事前に代替案とインパクトを整理し、短時間で合意を目指す。".to_string(),
                audience: "顧客、上長、開発リード".to_string(),
                problems: vec!["スコープ肥大".to_string(), "リソース不足".to_string(), "意思決定が遅い".to_string()],
                goals: vec!["代替案の提示".to_string(), "インパクトの明示".to_string(), "合意形成".to_string()],
                differentiators: vec!["BATNA整理".to_string(), "譲れない条件の明確化".to_string()],
                scope: vec!["代替案作成".to_string(), "インパクト整理".to_string(), "合意手順".to_string()],
                constraints: vec!["交渉時間30分".to_string(), "現行リリース日固定".to_string()],
                timeline: "今週中に再合意".to_string(),
                success_criteria: vec!["合意済みのスコープ or リソース調整".to_string(), "合意内容が明文化".to_string()],
                unique_edge: Some("交渉準備と合意文書作成を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["提案メモ".to_string(), "インパクト表".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("合意後に残るリスクとフォローアップを必ず記録してください。".to_string()),
        },
        Scenario {
            id: "challenge-impossible-request".to_string(),
            title: "エンジニアから「無理です」と言われる (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "技術的制約を理解し、代替案と合意を作る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "実現性レビュー".to_string(),
                summary: "制約を整理し、代替案と合意形成を進めるためのレビュー。".to_string(),
                audience: "開発リード、ビジネス担当".to_string(),
                problems: vec!["技術的制約".to_string(), "期待値ギャップ".to_string(), "判断遅延".to_string()],
                goals: vec!["制約の明確化".to_string(), "代替案の提示".to_string(), "合意形成".to_string()],
                differentiators: vec!["制約整理テンプレ".to_string(), "代替案比較表".to_string()],
                scope: vec!["制約整理".to_string(), "代替案比較".to_string(), "合意形成".to_string()],
                constraints: vec!["既存リリース日固定".to_string(), "リソース追加は難しい".to_string()],
                timeline: "今週中に方向性決定".to_string(),
                success_criteria: vec!["合意済みの対応方針".to_string(), "次アクションが明文化".to_string()],
                unique_edge: Some("実現性と期待値の調整を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["制約メモ".to_string(), "代替案表".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("無理の理由を尊重しつつ、実現可能な落とし所を探してください。".to_string()),
        },
        Scenario {
            id: "challenge-conflict-mediation".to_string(),
            title: "コンフリクト調整 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "開発とQA・ビジネスの対立をファシリテートし、合意に導く。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "調整セッション".to_string(),
                summary: "論点を分解し、事実と解釈を整理して合意を形成する。".to_string(),
                audience: "開発リード、QA、ビジネスオーナー".to_string(),
                problems: vec!["優先度衝突".to_string(), "品質バーの違い".to_string(), "感情的な対立".to_string()],
                goals: vec!["論点の明確化".to_string(), "合意された着地点".to_string(), "フォローアクションの明記".to_string()],
                differentiators: vec!["事実/解釈の分離".to_string(), "合意メモテンプレ".to_string()],
                scope: vec!["論点整理".to_string(), "合意形成".to_string(), "フォロー計画".to_string()],
                constraints: vec!["1時間以内".to_string(), "主要ステークホルダー3者".to_string()],
                timeline: "今週中に解決方向性を決定".to_string(),
                success_criteria: vec!["合意事項と決定が明文化".to_string(), "フォロータスクが割り当て済み".to_string()],
                unique_edge: Some("ファシリテーションと合意文書化を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["論点リスト".to_string(), "合意メモ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("感情的な対立を避けるため、事実と解釈を分けて提示してください。".to_string()),
        },
        Scenario {
            id: "challenge-priority-conflict".to_string(),
            title: "優先度対立のファシリテーション (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "関係者間の優先度対立を整理し、合意に導く。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "優先度調整セッション".to_string(),
                summary: "論点と優先度を整理し、合意形成とフォローを行う。".to_string(),
                audience: "開発リード、営業、事業責任者".to_string(),
                problems: vec!["優先度衝突".to_string(), "意思決定の停滞".to_string(), "関係性の悪化".to_string()],
                goals: vec!["論点整理".to_string(), "合意形成".to_string(), "フォローアクション".to_string()],
                differentiators: vec!["論点整理テンプレ".to_string(), "合意メモ".to_string()],
                scope: vec!["論点整理".to_string(), "合意形成".to_string(), "フォロー計画".to_string()],
                constraints: vec!["短時間で合意".to_string(), "関係者3〜4名".to_string()],
                timeline: "今週中に合意".to_string(),
                success_criteria: vec!["合意事項が明文化".to_string(), "フォロータスクが決定".to_string()],
                unique_edge: Some("優先度対立の調整を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["論点整理".to_string(), "合意メモ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("事実と解釈を分け、公平なファシリテーションを心がけてください。".to_string()),
        },
        Scenario {
            id: "challenge-stakeholder-misalignment".to_string(),
            title: "ステークホルダーとの認識ズレ解消 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "期待値のズレを解消し、共通認識と再発防止を作る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "認識合わせセッション".to_string(),
                summary: "認識ズレを整理し、共通認識と再発防止プロセスを合意する。".to_string(),
                audience: "事業責任者、開発、営業".to_string(),
                problems: vec!["期待値ズレ".to_string(), "情報不足".to_string(), "意思決定の摩擦".to_string()],
                goals: vec!["ズレの可視化".to_string(), "共通認識の合意".to_string(), "再発防止".to_string()],
                differentiators: vec!["ズレ整理テンプレ".to_string(), "確認プロセス設計".to_string()],
                scope: vec!["ズレ特定".to_string(), "共通認識整理".to_string(), "再発防止策".to_string()],
                constraints: vec!["関係者全員の合意が必要".to_string(), "1回の会議で方向性確定".to_string()],
                timeline: "今週中に認識合わせ".to_string(),
                success_criteria: vec!["共通認識が明文化".to_string(), "確認プロセスが合意".to_string()],
                unique_edge: Some("認識ズレ解消のファシリテーションを練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["論点整理".to_string(), "合意メモ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("合意後の確認プロセス（定例やチェックポイント）まで設計してください。".to_string()),
        },
        Scenario {
            id: "challenge-user-perspective".to_string(),
            title: "ユーザー視点が抜けていることへの気づき (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "ユーザー視点の欠落に気づき、価値に立ち返る。".to_string(),
            scenario_type: None,
            feature_mockup: None,
            product: ProductInfo {
                name: "ユーザー価値再確認".to_string(),
                summary: "ユーザー行動を整理し、価値と最小改善案を再確認する。".to_string(),
                audience: "プロダクトオーナー、開発、営業".to_string(),
                problems: vec!["ユーザー視点不足".to_string(), "価値の説明不足".to_string(), "改善の優先度が不明".to_string()],
                goals: vec!["ユーザー行動の整理".to_string(), "価値の明確化".to_string(), "最小改善案の合意".to_string()],
                differentiators: vec!["ユーザー行動テンプレ".to_string(), "価値整理メモ".to_string()],
                scope: vec!["行動フロー整理".to_string(), "価値整理".to_string(), "改善案提示".to_string()],
                constraints: vec!["短期間で合意".to_string(), "現行計画に影響最小".to_string()],
                timeline: "今週中に方針決定".to_string(),
                success_criteria: vec!["ユーザー価値が明文化".to_string(), "改善案が合意".to_string()],
                unique_edge: Some("ユーザー視点回復の意思決定を練習".to_string()),
                tech_stack: Some(vec!["Next.js".to_string(), "Axum".to_string()]),
                core_features: Some(vec!["行動フロー".to_string(), "価値メモ".to_string()]),
            },
            mode: "freeform".to_string(),
            behavior: ScenarioBehavior::default(),
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
            supplemental_info: Some("機能ではなく価値に立ち返り、最小の打ち手を提案してください。".to_string()),
        },
    ]
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScenarioBehavior {
    pub user_led: Option<bool>,
    pub allow_proactive: Option<bool>,
    pub max_questions: Option<u32>,
    pub response_style: Option<String>,
    pub phase: Option<String>,
}

impl Default for ScenarioBehavior {
    fn default() -> Self {
        Self {
            user_led: None,
            allow_proactive: None,
            max_questions: None,
            response_style: None,
            phase: None,
        }
    }
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
