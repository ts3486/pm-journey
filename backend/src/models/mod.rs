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
    Basic,
    Challenge,
}

pub fn default_scenarios() -> Vec<Scenario> {
    vec![
        Scenario {
            id: "basic-intro-alignment".to_string(),
            title: "自己紹介＆期待値合わせ (基礎)".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "新規プロジェクトに合流し、役割と成功条件を30分で擦り合わせる。".to_string(),
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
            kickoff_prompt: "あなたは新規PJに参加するPM/PMOとして、初回ミーティングで役割と期待値を揃えます。短時間で目的・進め方・次アクションを決めてください。".to_string(),
            evaluation_criteria: vec![
                EvaluationCategory { name: "方針提示とリード力".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "計画と実行可能性".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "コラボレーションとフィードバック".to_string(), weight: 25.0, score: None, feedback: None },
                EvaluationCategory { name: "リスク/前提管理と改善姿勢".to_string(), weight: 25.0, score: None, feedback: None },
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "basic-intro-m1".to_string(), title: "自己紹介と役割・責任範囲の確認".to_string(), description: None, order: 1 },
                Mission { id: "basic-intro-m2".to_string(), title: "成功条件と優先度の合意".to_string(), description: None, order: 2 },
                Mission { id: "basic-intro-m3".to_string(), title: "次アクションと連絡リズムの設定".to_string(), description: None, order: 3 },
            ]),
            supplemental_info: Some("時間配分（5分自己紹介/15分期待値/10分次アクション）を意識してください。".to_string()),
        },
        Scenario {
            id: "basic-ticket-refine".to_string(),
            title: "チケット要件整理 (基礎)".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "曖昧なチケットを受入可能な形に分解し、スプリントに載せられる状態へ整理する。".to_string(),
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
            id: "basic-testcase-design".to_string(),
            title: "テストケース作成 (基礎)".to_string(),
            discipline: ScenarioDiscipline::Basic,
            description: "新機能の仕様からスモーク/回帰テストケースを洗い出し、漏れのない最小集合を作る。".to_string(),
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
            id: "challenge-project-rescue".to_string(),
            title: "遅延プロジェクト立て直し (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。".to_string(),
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
            id: "challenge-scope-negotiation".to_string(),
            title: "スコープ／リソース交渉 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "顧客や上長とスコープ削減かリソース増加を交渉し、合意形成する。".to_string(),
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
            id: "challenge-conflict-mediation".to_string(),
            title: "コンフリクト調整 (チャレンジ)".to_string(),
            discipline: ScenarioDiscipline::Challenge,
            description: "開発とQA・ビジネスの対立をファシリテートし、合意に導く。".to_string(),
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
    ]
}
