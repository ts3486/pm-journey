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
    pub evaluation_criteria: Vec<RatingCriterion>,
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
    } else if id.starts_with("challenge-")
        || id.starts_with("adv-")
        || id == "coming-priority-tradeoff-workshop"
    {
        ScenarioType::BusinessExecution
    } else {
        ScenarioType::SoftSkills
    }
}

fn criterion(name: &str, weight: f32) -> RatingCriterion {
    RatingCriterion {
        id: None,
        name: name.to_string(),
        weight,
        description: String::new(),
        scoring_guidelines: ScoringGuidelines::default(),
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
                criterion("礼儀", 25.0),
                criterion("自己紹介の明確さ", 25.0),
                criterion("コミュニケーション能力", 25.0),
                criterion("印象管理", 25.0),
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
                criterion("プロダクト概要の理解", 25.0),
                criterion("ユーザーと課題の整理", 25.0),
                criterion("機能と差別化ポイントの把握", 25.0),
                criterion("深掘りポイントと思考力", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "product-m1".to_string(), title: "プロダクト概要を理解する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\nユーザー（PM）はキックオフで保険金請求サポートサービスの基本情報（主な機能3点）を受け取っています。その前提で、より深い理解を促してください。\n\n## PMが質問した場合に提供する情報\n- ターゲットユーザー: 保険金請求を行う契約者（個人）、保険会社の審査担当者\n- 解決する課題: 初回提出の承認率が約50%と低く、差し戻しによる処理遅延とCS負荷が発生\n- KPI目標: 初回提出承認率を50%→80%に改善、請求完了までの平均日数を14日→7日に短縮\n- 技術スタック: React + Node.js、AWS S3（証跡保存）、OCR API（書類自動読取）\n- 競合との差別化: ステップ形式の案内UIと不足証跡の自動検知の組み合わせ\n- 今後のロードマップ: MVP→証跡内容チェック（AI）→保険会社向け管理画面\n\n## ミッション\n1. プロダクト概要を理解する（ユーザー・課題・解決策の構造を把握）\n\n## サポート方針\n- ユーザーの質問には端的に回答し、さらに深掘りすべき観点を1つ提示する\n- ユーザーが表面的な理解に留まっている場合は「なぜ」「誰にとって」を問い返す\n- プロダクト理解に必要な観点（ユーザー像・課題・競合・KPI）を網羅できるよう導く".to_string()),
            single_response: None,
        },
        Scenario {
            id: "basic-meeting-minutes".to_string(),
            title: "議事録の作成".to_string(),
            description: "ミーティングログを読み、議事録を作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: Some("以下のリンクからミーティングログをダウンロードして内容を確認し、議事録を作成してください。\n\n[ミーティングログをダウンロード](/assets/ミーティングログ.txt)".to_string()),
            kickoff_prompt: "以下のリンクからミーティングログをダウンロードして内容を確認し、議事録を作成してください。\n\n[ミーティングログをダウンロード](/assets/ミーティングログ.txt)\n\nフォーマットは自由です。".to_string(),
            evaluation_criteria: vec![
                criterion("フォーマット", 33.0),
                criterion("情報の正確性", 34.0),
                criterion("網羅性", 33.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-minutes-m1".to_string(), title: "議事録を作成する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("ユーザーが提出した議事録を受け取ってください。内容についてのフィードバックは不要です。\n\n以下が元のミーティングログです。評価時にこの内容と照合してください。\n\n---\n【保険金請求サポートサービス MVP仕様検討MTG（約5分）】\n\n佐藤（PM）:\nえー、では時間になったので始めましょう。皆さんお疲れ様です。\n今日は保険金請求サポートサービスのMVPについて、スコープと優先順位を整理したいと思います。\n今四半期中にリリースする前提なので、現実的なラインを決めたいです。よろしくお願いします。\n\n高橋（Ops）:\nよろしくお願いします。\n\n佐藤:\nまず、現場の課題から確認させてください。\n高橋さん、今の請求プロセスで一番問題になっているのは何でしょうか？\n\n高橋:\nそうですね……一番多いのは証跡の不足です。\nユーザーが必要な書類を全部提出してくれないケースがかなりあります。\n\n佐藤:\n体感でどのくらいですか？\n\n高橋:\nうーん、初回提出でそのまま承認できるのは、大体50％くらいですね。\n残りは何かしら不足があります。\n\n山本（Frontend）:\n半分差し戻しになる感じですか。\n\n高橋:\nはい。領収書が不鮮明だったり、必要な書類自体が提出されていなかったりします。\nあと、「何を出せばいいか分からなかった」という問い合わせも多いです。\n\n中村（UX）:\nなるほど……。\nじゃあ、最初の段階で必要書類を明確に見せるのが重要ですね。\n\n佐藤:\nそうですね。商品ごとにチェックリスト形式で表示するのはどうでしょうか？\n\n中村:\nいいと思います。\n例えば「領収書」「診断書」などが並んでいて、アップロードするとチェックが付く形です。\n\n山本:\nそれならユーザーも進捗が分かりますし、実装もそこまで複雑ではないです。\n\n田中（Backend）:\nバックエンド側は、商品ごとに必要書類の定義を持たせれば対応できます。\nrequired_documentsみたいなテーブルを作る形ですね。\n\n鈴木（Tech Lead）:\nそれで問題ないと思います。将来的な拡張もできます。\n\n佐藤:\nOK、それはMVPに入れましょう。\n\n佐藤:\n次に、証跡アップロードですが、複数ファイル対応は必須ですよね？\n\n高橋:\nはい。5枚以上になることも普通にあります。\n\n田中:\nファイル本体はオブジェクトストレージに保存して、DBにはメタデータだけ保存します。\nその方がスケーラブルです。\n\n鈴木:\n署名付きURLを使えばセキュリティも担保できますね。\n個人情報なのでアクセス制御はしっかりやりましょう。\n\n佐藤:\n監査ログも必要ですね。\n\n鈴木:\nはい。誰がいつ承認・差し戻ししたかは必ず保存します。\n\n佐藤:\n分かりました。\n\n中村:\nあと、ユーザーが今どのステータスにいるのか分かる表示も必要だと思います。\n\n山本:\nタイムライン形式で表示できます。\n「提出中」「審査中」「差し戻し」「承認済み」などです。\n\n高橋:\nそれは現場的にも助かります。\n問い合わせが減ると思います。\n\n佐藤:\nいいですね、それもMVPに含めましょう。\n\n田中:\n不足書類のチェックも実装できます。\n必要カテゴリが揃っていなければ、提出完了できないようにします。\n\n佐藤:\nそれでいきましょう。\n内容チェックまでは次フェーズで。\n\n佐藤:\n今日はここまでにしましょう。ありがとうございました。\n---".to_string()),
            single_response: Some(true),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-login-m1".to_string(), title: "正常系ログインフローを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-login-m2".to_string(), title: "異常系・セキュリティ観点を洗い出す".to_string(), description: None, order: 2 },
                Mission { id: "test-login-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nログイン機能のテストケース作成をサポートする。ユーザー（PM）がテスト観点を網羅できるよう導く。\n\n## 機能仕様\n- フィールド: メールアドレス（type=email）、パスワード（type=password、表示/非表示トグル付き）、ログイン状態を保持チェックボックス\n- メールバリデーション: 必須、正規表現 /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ に合致すること\n- パスワードバリデーション: 必須、8文字以上\n- エラーメッセージ: 「メールアドレスを入力してください」「有効なメールアドレスを入力してください」「パスワードを入力してください」「パスワードは8文字以上で入力してください」\n- セキュリティ: ログイン5回失敗でアカウント15分ロック\n- 関連リンク: パスワードリセット、新規登録\n\n## ミッション\n1. 正常系ログインフローを列挙する\n2. 異常系・セキュリティ観点を洗い出す\n3. 前提条件とテストデータを整理する\n\n## サポート方針\n- ユーザーが観点を挙げたら、抜けている視点を問いかける（例:「境界値は考えましたか？」）\n- テストケースの完成形は提示せず、考える手がかりを与える\n- セキュリティ観点（アカウントロック、パスワードマスク）に気づけるよう誘導する".to_string()),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-form-m1".to_string(), title: "入力バリデーションケースを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-form-m2".to_string(), title: "エラー表示と操作性を検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-form-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nお問い合わせフォーム機能のテストケース作成をサポートする。ユーザー（PM）がテスト観点を網羅できるよう導く。\n\n## 機能仕様\n- フィールド: お名前（必須）、メールアドレス（必須）、電話番号（任意）、カテゴリ（必須・プルダウン）、お問い合わせ内容（必須・テキストエリア）、利用規約同意（必須・チェックボックス）\n- カテゴリ選択肢: 製品について / サポート / 請求・お支払い / その他\n- メールバリデーション: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/\n- 電話番号バリデーション: 入力時のみ /^[0-9-]{10,13}$/\n- お問い合わせ内容: 10文字以上1000文字以内、文字数カウンター表示\n- エラーメッセージ: 「お名前を入力してください」「有効なメールアドレスを入力してください」「有効な電話番号を入力してください」「カテゴリを選択してください」「10文字以上で入力してください」「1000文字以内で入力してください」「利用規約に同意してください」\n- 送信成功後: 完了画面を表示、フォームリセット機能あり\n\n## ミッション\n1. 入力バリデーションケースを列挙する\n2. エラー表示と操作性を検討する\n3. 前提条件とテストデータを整理する\n\n## サポート方針\n- ユーザーが観点を挙げたら、抜けている視点を問いかける（例:「任意フィールドのバリデーションは？」）\n- テストケースの完成形は提示せず、考える手がかりを与える\n- 境界値（10文字/1000文字）や任意フィールドの扱いに気づけるよう誘導する".to_string()),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(70.0),
            missions: Some(vec![
                Mission { id: "test-upload-m1".to_string(), title: "ファイル種別とサイズ検証ケースを列挙する".to_string(), description: None, order: 1 },
                Mission { id: "test-upload-m2".to_string(), title: "エラー処理とセキュリティ観点を検討する".to_string(), description: None, order: 2 },
                Mission { id: "test-upload-m3".to_string(), title: "前提条件とテストデータを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nファイルアップロード機能のテストケース作成をサポートする。ユーザー（PM）がテスト観点を網羅できるよう導く。\n\n## 機能仕様\n- アップロード方式: ドラッグ＆ドロップ、クリック選択の2種類\n- 許可ファイル形式: JPEG, PNG, GIF, PDF\n- ファイルサイズ上限: 1ファイル10MBまで\n- ファイル数上限: 最大5ファイル\n- ファイル状態: pending → uploading（進捗バー表示） → success（✓） / error（リトライボタン）\n- エラーメッセージ: 「許可されていないファイル形式です（JPEG, PNG, GIF, PDF のみ）」「ファイルサイズが10MBを超えています」「ファイルは最大5個までアップロードできます」\n- UI要素: ファイルアイコン（画像🖼️/文書📄）、ファイルサイズ表示、個別削除ボタン（✕）、リトライボタン\n- ドラッグ中: ドロップエリアが青枠でハイライト\n\n## ミッション\n1. ファイル種別とサイズ検証ケースを列挙する\n2. エラー処理とセキュリティ観点を検討する\n3. 前提条件とテストデータを整理する\n\n## サポート方針\n- ユーザーが観点を挙げたら、抜けている視点を問いかける（例:「複数ファイル同時アップロード時の動作は？」）\n- テストケースの完成形は提示せず、考える手がかりを与える\n- ドラッグ＆ドロップとクリック選択の両方、エラー時のリトライ、状態遷移に気づけるよう誘導する".to_string()),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqdoc-m2".to_string(), title: "ログイン成功/失敗時の要件を定義する".to_string(), description: None, order: 1 },
            ]),
            agent_prompt: Some("## タスク指示\nログイン機能の要件定義作成をサポートする。ユーザー（PM）が要件を漏れなく定義できるよう導く。\n\n## 機能仕様\n- フィールド: メールアドレス（type=email）、パスワード（type=password、表示/非表示トグル付き）、ログイン状態を保持チェックボックス\n- メールバリデーション: 必須、正規表現 /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ に合致すること\n- パスワードバリデーション: 必須、8文字以上\n- エラーメッセージ: 「メールアドレスを入力してください」「有効なメールアドレスを入力してください」「パスワードを入力してください」「パスワードは8文字以上で入力してください」\n- セキュリティ: ログイン5回失敗でアカウント15分ロック\n- 関連リンク: パスワードリセット、新規登録\n\n## ミッション\n1. ログイン成功/失敗時の要件を定義する\n\n## サポート方針\n- ユーザーが要件を挙げたら、抜けている観点を問いかける（例:「セキュリティ要件は検討しましたか？」）\n- 要件定義の完成形は提示せず、考えるべき観点のヒントを与える\n- 正常系・異常系・非機能要件（セキュリティ、パフォーマンス）を網羅できるよう誘導する".to_string()),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqhear-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqhear-m2".to_string(), title: "入力/送信/エラー時の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqhear-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\n問い合わせフォーム機能の要件定義をサポートする。ユーザー（PM）が要件を漏れなく定義できるよう導く。\n\n## 機能仕様\n- フィールド: お名前（必須）、メールアドレス（必須）、電話番号（任意）、カテゴリ（必須・プルダウン）、お問い合わせ内容（必須・テキストエリア）、利用規約同意（必須・チェックボックス）\n- カテゴリ選択肢: 製品について / サポート / 請求・お支払い / その他\n- メールバリデーション: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/\n- 電話番号バリデーション: 入力時のみ /^[0-9-]{10,13}$/\n- お問い合わせ内容: 10文字以上1000文字以内、文字数カウンター表示\n- エラーメッセージ: 「お名前を入力してください」「有効なメールアドレスを入力してください」「有効な電話番号を入力してください」「カテゴリを選択してください」「10文字以上で入力してください」「1000文字以内で入力してください」「利用規約に同意してください」\n- 送信成功後: 完了画面を表示、フォームリセット機能あり\n\n## ミッション\n1. 目的・対象ユーザーを確認する\n2. 入力/送信/エラー時の受入条件を定義する\n3. 非対象と不明点の確認アクションを整理する\n\n## サポート方針\n- ユーザーが要件を挙げたら、抜けている観点を問いかける（例:「任意フィールドの扱いは決めましたか？」）\n- 要件定義の完成形は提示せず、考えるべき観点のヒントを与える\n- 「誰が使うのか」「なぜこのフィールドが必要か」という目的から要件を導けるよう誘導する".to_string()),
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
                criterion("方針提示とリード力", 25.0),
                criterion("計画と実行可能性", 25.0),
                criterion("コラボレーションとフィードバック", 25.0),
                criterion("リスク/前提管理と改善姿勢", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "basic-reqstory-m1".to_string(), title: "目的・対象ユーザーを確認する".to_string(), description: None, order: 1 },
                Mission { id: "basic-reqstory-m2".to_string(), title: "形式/サイズ/失敗時の受入条件を定義する".to_string(), description: None, order: 2 },
                Mission { id: "basic-reqstory-m3".to_string(), title: "非対象と不明点の確認アクションを整理する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nファイルアップロード機能の要件定義をサポートする。ユーザー（PM）が要件を漏れなく定義できるよう導く。\n\n## 機能仕様\n- アップロード方式: ドラッグ＆ドロップ、クリック選択の2種類\n- 許可ファイル形式: JPEG, PNG, GIF, PDF\n- ファイルサイズ上限: 1ファイル10MBまで\n- ファイル数上限: 最大5ファイル\n- ファイル状態: pending → uploading（進捗バー表示） → success（✓） / error（リトライボタン）\n- エラーメッセージ: 「許可されていないファイル形式です（JPEG, PNG, GIF, PDF のみ）」「ファイルサイズが10MBを超えています」「ファイルは最大5個までアップロードできます」\n- UI要素: ファイルアイコン、ファイルサイズ表示、個別削除ボタン、リトライボタン\n\n## ミッション\n1. 目的・対象ユーザーを確認する\n2. 形式/サイズ/失敗時の受入条件を定義する\n3. 非対象と不明点の確認アクションを整理する\n\n## サポート方針\n- ユーザーが要件を挙げたら、抜けている観点を問いかける（例:「エラー時のユーザー体験は検討しましたか？」）\n- 要件定義の完成形は提示せず、考えるべき観点のヒントを与える\n- 機能要件だけでなく非機能要件（ファイルサイズ制限の根拠、セキュリティ）も考えられるよう誘導する".to_string()),
            single_response: None,
        },
        // Incident-response scenarios
        Scenario {
            id: "coming-incident-response".to_string(),
            title: "P1障害: ログイン不能バグの緊急対応".to_string(),
            description: "P1障害の初動対応と報告を行う。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## 障害ブリーフィング\n\n### 発生事象\n本番環境のログインAPIが500エラーを返し続け、**全ユーザーがログイン不能**な状態が継続中。\n\n### 重大度\n**P1（Critical）** — サービス全体が利用不可\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 09:15 | 監視アラート発報（エラーレート急上昇） |\n| 09:18 | CSチームに問い合わせ殺到開始 |\n| 09:20 | SREがAPI調査開始 |\n| 09:25 | **現在** — PMであるあなたに連絡が入る |\n\n### 影響範囲\n- 全ユーザー（約12万人）がログイン不能\n- モバイルアプリ・Webの両方に影響\n- 既にログイン済みセッションは有効\n\n### チーム情報\n- SRE: 田中（API調査中）\n- Backend Lead: 鈴木（原因特定中、デプロイ起因の可能性）\n- CS: 高橋（問い合わせ対応中、件数急増）\n- VP of Engineering: 山本（未連絡）\n- 広報: 中村（未連絡）".to_string()),
            kickoff_prompt: "本番環境で『ログインAPIが500エラーを返し続け、全ユーザーがログイン不能』というP1障害が発生しました。PMとして、影響範囲の整理、初動対応方針、ステークホルダーへの連絡、原因分析と再発防止を障害対応レポートにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("影響範囲と重大度の評価", 25.0),
                criterion("初動対応と優先度判断", 25.0),
                criterion("連絡・エスカレーションの適切さ", 25.0),
                criterion("復旧計画と再発防止の具体性", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-incident-m1".to_string(), title: "影響範囲と緊急度を確定する".to_string(), description: None, order: 1 },
                Mission { id: "coming-incident-m2".to_string(), title: "初動対応と暫定復旧方針を決める".to_string(), description: None, order: 2 },
                Mission { id: "coming-incident-m3".to_string(), title: "初回報告とエスカレーションを実行する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nP1障害（ログインAPI 500エラー）の対応をサポートする。PMの初動判断・エスカレーション・復旧計画を導く。\n\n## PMが質問した場合に提供する情報\n- 直近のデプロイ（09:10）でDB接続プールの設定変更があった\n- エラーログに「connection pool exhausted」が出ている\n- ロールバック手順は10分程度で実行可能\n- 影響はログインAPIのみ、他のAPIは正常稼働中\n- 既にログイン済みセッションは影響なし\n- SRE田中がAPI調査中、Backend Lead鈴木がデプロイ起因の可能性を調査中\n\n## ミッション\n1. 影響範囲と緊急度を確定する\n2. 初動対応と暫定復旧方針を決める\n3. 初回報告とエスカレーションを実行する\n\n## サポート方針\n- PMの対応方針に対して、技術的な実現可能性のフィードバックを行う\n- PMが見落としている観点があれば問いかける（例:「VP of Engineeringへの連絡タイミングは？」）\n- 判断の根拠を求める（例:「ロールバックを選んだ理由は？」「暫定対応と恒久対応の切り分けは？」）\n- 障害対応の完成形は提示せず、PMが自分で判断できるよう導く".to_string()),
            single_response: None,
        },
        Scenario {
            id: "coming-incident-triage-escalation".to_string(),
            title: "P2障害: 決済遅延バグ".to_string(),
            description: "P2障害のトリアージとエスカレーション判断を行う。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## 障害ブリーフィング\n\n### 発生事象\n決済処理自体は正常に完了しているが、**完了通知の反映が最大20分遅延**している。\n\n### 重大度\n**P2（High）** — 機能劣化（データ損失なし）\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 14:00 | CSに「決済したのに反映されない」問い合わせ3件 |\n| 14:30 | 開発チームが遅延を確認 |\n| 14:45 | **現在** — PMであるあなたに報告 |\n\n### 影響範囲\n- 過去2時間の決済ユーザー約800人が対象\n- 決済自体は成功、金銭的損失なし\n- ユーザーが二重決済を試みるリスクあり\n\n### チーム情報\n- Backend: 佐藤（通知キューの調査中）\n- CS: 高橋（問い合わせ対応中、テンプレ回答準備済み）\n- Product Owner: 山本（次のアクション判断待ち）".to_string()),
            kickoff_prompt: "本番環境で『決済は成功しているが完了通知反映が最大20分遅延する』不具合が発生しています。PMとして、影響範囲の整理、優先度判定とエスカレーション判断、ステークホルダーへの連絡方針を障害対応レポートにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("影響範囲と重大度の評価", 25.0),
                criterion("初動対応と優先度判断", 25.0),
                criterion("連絡・エスカレーションの適切さ", 25.0),
                criterion("復旧計画と再発防止の具体性", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-triage-m1".to_string(), title: "事象の再現条件と影響ユーザーを特定する".to_string(), description: None, order: 1 },
                Mission { id: "coming-triage-m2".to_string(), title: "優先度と対応期限を決定する".to_string(), description: None, order: 2 },
                Mission { id: "coming-triage-m3".to_string(), title: "エスカレーション先と報告リズムを確定する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nP2障害（決済通知遅延）の対応をサポートする。PMのトリアージ判断・エスカレーション方針を導く。\n\n## PMが質問した場合に提供する情報\n- 通知キュー（SQS）のコンシューマーが一部停止していた\n- 決済データ自体はDBに正常に記録されている\n- 二重決済防止のidempotencyキーは実装済み\n- コンシューマー再起動で復旧可能だが、滞留メッセージの処理に15分程度かかる見込み\n- 過去2時間の対象ユーザー約800人\n- CS高橋がテンプレ回答を準備済み\n\n## ミッション\n1. 事象の再現条件と影響ユーザーを特定する\n2. 優先度と対応期限を決定する\n3. エスカレーション先と報告リズムを確定する\n\n## サポート方針\n- PMの判断に対して、技術的な実現可能性やリスクのフィードバックを行う\n- PMが見落としている観点があれば問いかける（例:「二重決済のリスクはどう評価しますか？」）\n- P1との優先度の違いを意識させる（例:「P2にした根拠は？」「ユーザーへの暫定案内は？」）\n- 対応方針の完成形は提示せず、PMが自分で判断できるよう導く".to_string()),
            single_response: None,
        },
        Scenario {
            id: "coming-postmortem-followup".to_string(),
            title: "P3障害: 表示崩れバグの再発防止".to_string(),
            description: "P3障害の原因分析と再発防止策を決定する。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## 障害ブリーフィング\n\n### 発生事象\nAndroidの一部端末でプロフィール画面の**ボタンが重なって表示崩れ**する。\n\n### 重大度\n**P3（Medium）** — 特定条件のUI不具合\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 先週金曜 | ユーザーからストアレビューで報告（星2） |\n| 月曜AM | QAチームが再現確認 |\n| 月曜PM | **現在** — ポストモーテム会議の準備 |\n\n### 影響範囲\n- Android 12以下の一部端末（画面幅360dp未満）\n- 対象ユーザー推定：全Androidユーザーの約8%\n- 機能自体は動作する（タップ領域が重なるだけ）\n\n### チーム情報\n- Frontend: 山本（CSS原因の調査完了）\n- QA: 中村（再現端末リスト作成済み）\n- Design: 佐藤（修正デザイン案を準備中）\n- Product Owner: 鈴木（修正優先度の判断待ち）".to_string()),
            kickoff_prompt: "Androidの一部端末でプロフィール画面のボタンが重なって表示崩れするP3不具合が報告されました。PMとして、原因分析、優先度判断、再発防止策を障害対応レポートにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("影響範囲と重大度の評価", 25.0),
                criterion("初動対応と優先度判断", 25.0),
                criterion("連絡・エスカレーションの適切さ", 25.0),
                criterion("復旧計画と再発防止の具体性", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-postmortem-m1".to_string(), title: "事実と原因仮説を切り分ける".to_string(), description: None, order: 1 },
                Mission { id: "coming-postmortem-m2".to_string(), title: "恒久対応と暫定対応を決定する".to_string(), description: None, order: 2 },
                Mission { id: "coming-postmortem-m3".to_string(), title: "再発防止アクションを担当・期限付きで合意する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nP3障害（表示崩れ）のポストモーテムをサポートする。PMの原因分析・再発防止策の策定を導く。\n\n## PMが質問した場合に提供する情報\n- 原因はCSS Flexboxのmin-width未指定で、画面幅360dp未満の端末でボタンが折り返されずに重なる\n- 修正自体は1行のCSS変更（min-width: 0の追加）\n- 影響範囲は小さいが、同様のパターンが他3画面にも存在する可能性\n- レスポンシブテストのCI自動化が未整備\n- QA中村が再現端末リスト作成済み\n- Design佐藤が修正デザイン案を準備中\n\n## ミッション\n1. 事実と原因仮説を切り分ける\n2. 恒久対応と暫定対応を決定する\n3. 再発防止アクションを担当・期限付きで合意する\n\n## サポート方針\n- PMの再発防止策に対して、技術的な実現可能性のフィードバックを行う\n- PMが見落としている観点があれば問いかける（例:「他3画面の横展開はどうしますか？」）\n- 暫定対応と恒久対応の区別、担当と期限の明確化を促す\n- ポストモーテムの完成形は提示せず、PMが自分で構造化できるよう導く".to_string()),
            single_response: None,
        },
        // Business-execution scenarios
        Scenario {
            id: "coming-priority-tradeoff-workshop".to_string(),
            title: "優先度トレードオフ".to_string(),
            description: "複数の候補案を比較し、段階リリース計画を決定する。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## ビジネスブリーフィング\n\n### 状況\n次四半期リリースに向けて、開発リソース（エンジニア4名・3ヶ月）で対応できる候補が3つあります。全て同時にはできないため、**優先順位と段階リリース計画**の合意が必要です。\n\n### 候補案\n\n| 案 | 概要 | 想定工数 | ビジネスインパクト |\n|----|------|----------|--------------------|\n| A. 高速検索 | Elasticsearchによる全文検索 | 2名×2ヶ月 | 検索離脱率30%改善見込み |\n| B. 通知改善 | プッシュ通知のパーソナライズ | 1名×3ヶ月 | エンゲージメント15%向上見込み |\n| C. 管理画面改修 | オペレーション効率化 | 2名×1.5ヶ月 | CS対応時間40%削減見込み |\n\n### 制約\n- 四半期末までにリリース可能な状態にすること\n- QAリソースは1名のみ（並行テストは2機能まで）\n- 高速検索はインフラ変更を伴うため、リリース後1週間の監視期間が必要\n\n### ステークホルダー\n- CEO: 「検索改善は競合対策として急務」\n- CS責任者: 「管理画面が最優先、問い合わせが捌けない」\n- Growth担当: 「通知改善のROIが最も高い」".to_string()),
            kickoff_prompt: "次リリース候補として『高速検索』『通知改善』『管理画面改修』の3案があります。PMとして、現状分析と課題の整理、提案と根拠、トレードオフの整理、実行計画を意思決定ログにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("目的に対する意思決定の妥当性", 25.0),
                criterion("トレードオフと根拠の明確さ", 25.0),
                criterion("ステークホルダー合意形成", 25.0),
                criterion("実行計画とフォローアップ", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "coming-tradeoff-m1".to_string(), title: "比較軸を定義して各案を評価する".to_string(), description: None, order: 1 },
                Mission { id: "coming-tradeoff-m2".to_string(), title: "採用案と却下案を整理する".to_string(), description: None, order: 2 },
                Mission { id: "coming-tradeoff-m3".to_string(), title: "段階リリース計画と判断理由を合意する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\n優先度トレードオフの意思決定をサポートする。PMの比較分析・優先順位付け・段階リリース計画を導く。\n\n## PMが質問した場合に提供する情報\n- 高速検索: Elasticsearch導入、技術リスクあり（インフラ変更+1週間監視期間）、検索離脱率30%改善見込み\n- 通知改善: プッシュ通知パーソナライズ、エンゲージメント15%向上見込み、Growth担当はROI最高と主張\n- 管理画面改修: オペレーション効率化、CS対応時間40%削減見込み、CS責任者が最優先と主張\n- CEO: 検索改善は競合対策として急務と考えている\n- QAリソースは1名のみ、並行テスト2機能まで\n\n## ミッション\n1. 比較軸を定義して各案を評価する\n2. 採用案と却下案を整理する\n3. 段階リリース計画と判断理由を合意する\n\n## サポート方針\n- PMの提案に対して「なぜその優先順位なのか」「後回しにするリスクは」と根拠を問う\n- ステークホルダー間の利害対立を意識させる（例:「CEOとCS責任者の意見が割れていますが、どう合意形成しますか？」）\n- 合理的な根拠があれば柔軟に受け入れるが、感覚的な判断には具体的なデータを求める\n- 意思決定の完成形は提示せず、PMが自分で判断できるよう導く".to_string()),
            single_response: None,
        },
        Scenario {
            id: "adv-data-roi".to_string(),
            title: "データドリブン投資判断".to_string(),
            description: "データ分析に基づいて機能投資のROIを評価し、意思決定を行う。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## ビジネスブリーフィング\n\n### 状況\nプロダクトの月次レビューで、**次四半期の機能投資先**を決定する必要があります。データチームから各機能の利用状況レポートが届いています。\n\n### データサマリ\n\n| 機能 | MAU | 利用頻度/週 | NPS | 開発コスト（人月） | 売上貢献度 |\n|------|-----|-------------|-----|--------------------|-----------|\n| ダッシュボード | 8,500 | 4.2回 | +32 | 6 | 直接なし |\n| レポート出力 | 3,200 | 1.1回 | +45 | 4 | 月額¥120万 |\n| API連携 | 1,800 | 12.5回 | +18 | 8 | 月額¥280万 |\n| モバイルアプリ | 5,100 | 2.8回 | -5 | 10 | 月額¥50万 |\n\n### 制約\n- 次四半期の開発リソース: 12人月\n- 経営陣の期待: 四半期ARR +15%\n- チャーンレートが前月比で0.5%上昇中\n\n### ステークホルダー\n- CFO: 「ROIで判断してほしい。感覚的な議論は避けたい」\n- CTO: 「技術的負債も考慮すべき。API連携の基盤は古い」\n- 営業責任者: 「モバイル対応は商談で頻繁に聞かれる」".to_string()),
            kickoff_prompt: "次四半期の機能投資先をデータに基づいて決定してください。PMとして、現状分析と課題の整理、提案と根拠、トレードオフの整理、実行計画を意思決定ログにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("目的に対する意思決定の妥当性", 25.0),
                criterion("トレードオフと根拠の明確さ", 25.0),
                criterion("ステークホルダー合意形成", 25.0),
                criterion("実行計画とフォローアップ", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "adv-data-roi-m1".to_string(), title: "データからROIを算出し比較する".to_string(), description: None, order: 1 },
                Mission { id: "adv-data-roi-m2".to_string(), title: "投資先の優先順位と根拠を整理する".to_string(), description: None, order: 2 },
                Mission { id: "adv-data-roi-m3".to_string(), title: "実行計画と成功指標を定義する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nデータドリブンな投資判断をサポートする。PMのROI分析・優先順位付け・実行計画を導く。\n\n## PMが質問した場合に提供する情報\n- ダッシュボード: MAU 8,500、利用頻度4.2回/週、NPS+32、開発コスト6人月、直接売上なし\n- レポート出力: MAU 3,200、利用頻度1.1回/週、NPS+45、開発コスト4人月、月額¥120万\n- API連携: MAU 1,800、利用頻度12.5回/週、NPS+18、開発コスト8人月、月額¥280万\n- モバイルアプリ: MAU 5,100、利用頻度2.8回/週、NPS-5、開発コスト10人月、月額¥50万\n- チャーンレートが前月比0.5%上昇中、経営陣の期待はARR+15%\n- CTO: API連携の基盤は古く技術的負債あり\n- 営業責任者: モバイル対応は商談で頻繁に聞かれる\n\n## ミッション\n1. データからROIを算出し比較する\n2. 投資先の優先順位と根拠を整理する\n3. 実行計画と成功指標を定義する\n\n## サポート方針\n- PMの提案に「その数字の根拠は」「他の選択肢との比較は」と定量的な根拠を求める\n- チャーンレート上昇への対策を考えているか確認する\n- ROI計算の前提条件を明確にさせる（例:「その改善見込みの根拠は？」）\n- 投資判断の完成形は提示せず、PMがデータに基づいて自分で判断できるよう導く".to_string()),
            single_response: None,
        },
        Scenario {
            id: "adv-strategy-diagnosis".to_string(),
            title: "プロダクト戦略診断".to_string(),
            description: "プロダクトの成長停滞を分析し、戦略転換の提案を行う。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## ビジネスブリーフィング\n\n### 状況\nBtoB SaaSプロダクト（プロジェクト管理ツール）が**成長停滞**に直面しています。CEOから「現状分析と戦略提案」を求められています。\n\n### 現状データ\n\n| 指標 | 6ヶ月前 | 現在 | 業界平均 |\n|------|---------|------|----------|\n| MRR | ¥1,200万 | ¥1,250万 | - |\n| 新規獲得/月 | 45社 | 28社 | - |\n| チャーンレート | 3.2% | 4.8% | 3.0% |\n| NPS | +35 | +22 | +30 |\n| ARPU | ¥15,000 | ¥14,200 | ¥18,000 |\n\n### 競合環境\n- 競合A: AI機能を大幅強化、価格はほぼ同等\n- 競合B: エンタープライズ向けに特化、価格は2倍だが大手顧客を獲得中\n- 競合C: 無料プランを強化、SMB市場を侵食中\n\n### 制約\n- 開発チーム: 15名（増員予算は限定的）\n- 資金: 次のラウンドまで18ヶ月のランウェイ\n- 既存顧客からの要望: 「ガントチャート」「リソース管理」「レポート強化」\n\n### ステークホルダー\n- CEO: 「成長を取り戻すための大きな方向転換が必要かもしれない」\n- VP of Sales: 「エンタープライズに行くべき、ARPUを上げないと」\n- VP of Product: 「今の機能を磨くべき、新機能追加は中途半端になる」".to_string()),
            kickoff_prompt: "成長停滞に直面しているBtoB SaaSプロダクトの戦略提案を行ってください。PMとして、現状分析と課題の整理、提案と根拠、トレードオフの整理、実行計画を意思決定ログにまとめてください。".to_string(),
            evaluation_criteria: vec![
                criterion("目的に対する意思決定の妥当性", 25.0),
                criterion("トレードオフと根拠の明確さ", 25.0),
                criterion("ステークホルダー合意形成", 25.0),
                criterion("実行計画とフォローアップ", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "adv-strategy-m1".to_string(), title: "成長停滞の原因を構造的に分析する".to_string(), description: None, order: 1 },
                Mission { id: "adv-strategy-m2".to_string(), title: "戦略オプションを比較検討する".to_string(), description: None, order: 2 },
                Mission { id: "adv-strategy-m3".to_string(), title: "推奨戦略と実行ロードマップを提案する".to_string(), description: None, order: 3 },
            ]),
            agent_prompt: Some("## タスク指示\nプロダクト戦略診断をサポートする。PMの成長停滞分析・戦略オプション比較・ロードマップ策定を導く。\n\n## PMが質問した場合に提供する情報\n- MRR: ¥1,200万→¥1,250万（6ヶ月で微増）、新規獲得: 45社→28社/月に減少\n- チャーンレート: 3.2%→4.8%（業界平均3.0%）、NPS: +35→+22（業界平均+30）\n- ARPU: ¥15,000→¥14,200（業界平均¥18,000）\n- 競合A: AI機能強化、同等価格 / 競合B: エンタープライズ特化、2倍価格 / 競合C: 無料プラン強化、SMB侵食\n- 開発チーム15名、増員予算は限定的、ランウェイ18ヶ月\n- VP of Sales: エンタープライズ化でARPU向上を主張\n- VP of Product: 既存機能の改善優先を主張\n\n## ミッション\n1. 成長停滞の原因を構造的に分析する\n2. 戦略オプションを比較検討する\n3. 推奨戦略と実行ロードマップを提案する\n\n## サポート方針\n- PMの提案に「なぜそれが最善なのか」「失敗した場合のプランBは」と根拠を問う\n- 18ヶ月のランウェイ制約を意識させる（例:「成果が出るまでの時間は？」）\n- 既存顧客維持と成長の両立という矛盾に向き合わせる\n- 戦略提案の完成形は提示せず、PMが自分で構造的に判断できるよう導く".to_string()),
            single_response: None,
        },
    ];

    for scenario in scenarios.iter_mut() {
        scenario.scenario_type = scenario_type_for_id(&scenario.id);
    }

    scenarios
}


#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScoringGuidelines {
    pub excellent: String,
    pub good: String,
    pub needs_improvement: String,
    pub poor: String,
}

impl Default for ScoringGuidelines {
    fn default() -> Self {
        Self {
            excellent: String::new(),
            good: String::new(),
            needs_improvement: String::new(),
            poor: String::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RatingCriterion {
    #[serde(default)]
    pub id: Option<String>,
    pub name: String,
    pub weight: f32,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub scoring_guidelines: ScoringGuidelines,
}
