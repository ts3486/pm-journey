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
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "agent_opening_message")]
    pub agent_opening_message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", default)]
    #[serde(alias = "model_answer")]
    pub model_answer: Option<String>,
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
    } else if id.starts_with("basic-requirement") || id.starts_with("prd-") {
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
            description: "新規PJに参加するPMとして、自己紹介を行う。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: Some("## シナリオ概要\n\n新しいプロジェクトに参加したPMとして、チームメンバーへ自己紹介を行います。\n\n## なぜPMにとって重要か\n\nPMはプロジェクトの推進役として、エンジニア・デザイナー・ビジネスサイドなど多様なメンバーと協働します。 **第一印象はその後の信頼関係の土台** になります。\n\n自己紹介は単なる挨拶ではなく、「自分が何者で、どんな価値を提供できるか」を伝える最初の機会です。PMとして意識すべきポイントは以下の通りです：\n\n- **役割と期待値の明確化**: 自分がこのPJで何を担うのかを伝えることで、チームの認識を揃える\n- **親しみやすさと信頼感のバランス**: 専門性を示しつつ、相談しやすい雰囲気を作る\n- **チームへの敬意**: 既存メンバーの成果を尊重し、協力姿勢を示す\n\n実際の現場では、キックオフミーティングや初日の挨拶で自己紹介の機会が必ず訪れます。短い時間で的確に自分を伝えるスキルを身につけましょう。".to_string()),
            kickoff_prompt: "新規PJに参加するPMとして、自己紹介をしてみてください！".to_string(),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "basic-product-understanding".to_string(),
            title: "プロダクト理解".to_string(),
            description: "新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: Some("## シナリオ概要\n\n新しくプロジェクトに参加したPMとして、保険金請求サポートサービスのプロダクト概要を理解します。エージェントに質問しながら、プロダクトの全体像を掴みましょう。\n\n## なぜPMにとって重要か\n\nプロダクト理解はPMの全ての判断の基盤です。機能の優先順位付け、ステークホルダーとの議論、技術チームとの仕様調整——あらゆる場面で **プロダクトを深く理解しているかどうか** が意思決定の質を左右します。\n\n新しいPJに入った時、PMが最初にやるべきことは「正しい質問をして全体像を掴む」ことです。このシナリオでは以下のスキルを実践します：\n\n- **構造的な質問力**: 「誰が」「なぜ」「何を」解決するのかを体系的に理解する\n- **課題とソリューションの関係把握**: 機能の裏にあるユーザー課題を見抜く\n- **深掘りする思考力**: 表面的な機能理解で終わらず、KPI・競合・技術的制約まで掘り下げる\n\n実務では、プロダクトを理解せずに判断を下すPMはチームの信頼を失います。「なぜこの機能が必要なのか」を自分の言葉で説明できる状態を目指しましょう。".to_string()),
            kickoff_prompt: "まずはプロダクト理解を進めましょう。以下の情報をもとに、プロダクト全体像を掴みましょう。\n\n■ プロダクト: 保険金請求サポートサービス\n保険金請求に必要な証跡の案内、自動検知、進捗可視化を提供するサービス\n\n■ 主な機能\n- ステップ形式で必要書類を案内し、提出漏れを防ぐ\n- 不足証跡を自動で検知し、再提出を最小化する\n- 請求進捗をリアルタイムで可視化し、ユーザー不安を軽減する\n\n以下の5つのポイントを理解することがゴールです。エージェントに質問しながら、それぞれの理解を深めていきましょう。\n\n1. **ターゲットユーザーと課題** — 誰がどんな問題を抱えているのか\n2. **解決策と主要機能** — どのように課題を解決するのか\n3. **KPI・成功指標** — 何をもって成功とするのか\n4. **競合との差別化** — なぜこのプロダクトが選ばれるのか\n5. **技術構成とロードマップ** — どう作られ、今後どう進化するのか\n\nプロダクトの５つのポイントを理解したと判断したらシナリオを完了しましょう。".to_string(),
            evaluation_criteria: vec![
                criterion("プロダクト概要の理解", 25.0),
                criterion("ユーザーと課題の整理", 25.0),
                criterion("機能と差別化ポイントの把握", 25.0),
                criterion("深掘りポイントと思考力", 25.0),
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "product-m1".to_string(), title: "ターゲットユーザーと課題を理解する".to_string(), description: Some("誰がどんな問題を抱えているのかを把握する".to_string()), order: 1 },
                Mission { id: "product-m2".to_string(), title: "解決策と主要機能を理解する".to_string(), description: Some("どのように課題を解決するのかを把握する".to_string()), order: 2 },
                Mission { id: "product-m3".to_string(), title: "KPI・成功指標を理解する".to_string(), description: Some("何をもって成功とするのかを把握する".to_string()), order: 3 },
                Mission { id: "product-m4".to_string(), title: "競合との差別化を理解する".to_string(), description: Some("なぜこのプロダクトが選ばれるのかを把握する".to_string()), order: 4 },
                Mission { id: "product-m5".to_string(), title: "技術構成とロードマップを理解する".to_string(), description: Some("どう作られ、今後どう進化するのかを把握する".to_string()), order: 5 },
            ]),
            agent_prompt: Some("## タスク指示\nユーザー（PM）はキックオフで保険金請求サポートサービスの基本情報（主な機能3点）を受け取っています。その前提で、より深い理解を促してください。\n\n## PMが質問した場合に提供する情報\n- ターゲットユーザー: 保険金請求を行う契約者（個人）、保険会社の審査担当者\n- 解決する課題: 初回提出の承認率が約50%と低く、差し戻しによる処理遅延とCS負荷が発生\n- KPI目標: 初回提出承認率を50%→80%に改善、請求完了までの平均日数を14日→7日に短縮\n- 技術スタック: React + Node.js、AWS S3（証跡保存）、OCR API（書類自動読取）\n- 競合との差別化: ステップ形式の案内UIと不足証跡の自動検知の組み合わせ。競合は書類リスト提示のみで、ステップ案内+自動検知の組み合わせは本サービス独自\n- 今後のロードマップ: MVP（証跡案内・進捗可視化）→ Phase2: 証跡内容チェック（AI/OCR）→ Phase3: 保険会社向け管理画面・API連携\n\n## ミッション（5つの理解ポイント）\nユーザーが以下の5つのポイントをそれぞれ理解できるよう導いてください。ユーザーがあるポイントについて十分な理解を示したら、次のポイントへ自然に誘導してください。\n\n1. **ターゲットユーザーと課題** — 誰がどんな問題を抱えているのか（契約者の提出困難、審査担当者の差し戻し負荷）\n2. **解決策と主要機能** — ステップ案内・自動検知・進捗可視化がどう課題を解決するか\n3. **KPI・成功指標** — 初回承認率50%→80%、平均日数14日→7日という具体的目標\n4. **競合との差別化** — なぜステップ案内+自動検知の組み合わせが強みなのか\n5. **技術構成とロードマップ** — 技術スタックと、MVP→AI検知→管理画面という進化の方向性\n\n## サポート方針\n- ユーザーの質問には端的に回答し、さらに深掘りすべき観点を1つ提示する\n- ユーザーが表面的な理解に留まっている場合は「なぜ」「誰にとって」を問い返す\n- 同じ論点を繰り返さず、未達成のミッションポイントへ誘導する\n- 各ポイントについてユーザーが自分の言葉で説明できたら、そのポイントは理解済みと判断し、次へ進む\n- すべてのポイントを理解したら、全体のまとめを提示して完了を促す".to_string()),
            single_response: None,
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "basic-meeting-minutes".to_string(),
            title: "議事録の作成".to_string(),
            description: "ミーティングログを読み、議事録を作成する。".to_string(),
            scenario_type: ScenarioType::SoftSkills,
            feature_mockup: None,
            scenario_guide: Some("## シナリオ概要\n\n上に表示されているミーティングログを読み、議事録を作成してください。フォーマットは自由です。\n\n## なぜPMにとって重要か\n\nPMは日々多くのミーティングに参加し、その内容を正確に記録・共有する責任を担います。議事録は単なるメモではなく、 **チームの合意事項を形式化し、次のアクションを明確にする「意思決定の証跡」** です。\n\n優れた議事録を書けるPMは以下の能力を示しています：\n\n- **情報の構造化**: 散発的な議論を「決定事項」「TODO」「未決事項」に整理できる\n- **本質の抽出**: 長い議論から重要なポイントだけを漏れなく拾い上げる\n- **アクションの明確化**: 「誰が」「いつまでに」「何をする」を明示する\n\n実務では、議事録の質が低いと認識齟齬や手戻りが発生します。逆に、正確で分かりやすい議事録を書けるPMはチームから信頼され、プロジェクトの推進力が格段に上がります。".to_string()),
            kickoff_prompt: "上に表示されているミーティングログを読み、議事録を作成してください。フォーマットは自由です。".to_string(),
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
            agent_opening_message: None,
            model_answer: Some("## 議事録: 保険金請求サポートサービス MVP仕様検討MTG\n\n**日時**: （実施日）\n**参加者**: 佐藤（PM）、高橋（Ops）、山本（Frontend）、中村（UX）、田中（Backend）、鈴木（Tech Lead）\n\n---\n\n### 議題\n保険金請求サポートサービスのMVPスコープと優先順位の整理\n\n### 現状の課題\n- 初回提出でそのまま承認できるケースは約50%\n- 残りは証跡不足（不鮮明な領収書、必要書類の未提出など）による差し戻し\n- 「何を出せばいいか分からなかった」というユーザーからの問い合わせも多い\n\n### 決定事項\n\n#### 1. 必要書類チェックリスト表示（MVP対象）\n- 商品ごとにチェックリスト形式で必要書類を表示\n- アップロード完了でチェックが付くUI\n- バックエンド: 商品ごとの必要書類定義テーブル（required_documents）を作成\n\n#### 2. 証跡アップロード機能（MVP対象）\n- 複数ファイル対応（5枚以上のケースあり）\n- ファイル本体はオブジェクトストレージ、DBにはメタデータのみ保存\n- 署名付きURLによるアクセス制御（個人情報保護）\n- 監査ログ: 承認・差し戻しの操作履歴を必ず保存\n\n#### 3. 請求ステータス表示（MVP対象）\n- タイムライン形式で進捗を可視化（提出中→審査中→差し戻し→承認済み）\n- ユーザーの問い合わせ削減が期待される\n\n#### 4. 不足書類チェック（MVP対象）\n- 必要カテゴリが揃っていない場合、提出完了を不可にする\n- 書類の内容チェック（AI）は次フェーズへ先送り\n\n### 次フェーズへの先送り事項\n- 証跡内容チェック（AI活用）\n\n### TODO / ネクストアクション\n- 田中: required_documentsテーブルの設計\n- 山本: チェックリストUI・タイムラインUIの実装\n- 鈴木: 署名付きURL・監査ログの設計\n- 中村: チェックリストUIのUXデザイン".to_string()),
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
            scenario_guide: Some("## テストの基礎知識\n\nテストケースを作成する前に、以下の基本概念を押さえておきましょう。\n\n### テストケースとは\nテストケースとは「ソフトウェアが正しく動作するかを確認するための手順書」です。以下の要素で構成されます：\n- **テスト名**: 何を確認するテストか（例: 「正しいパスワードでログインできる」）\n- **前提条件**: テスト実行前に必要な状態（例: 「有効なアカウントが存在する」）\n- **手順**: 実行する操作のステップ（例: 「1. ログインページを開く → 2. メールを入力 → 3. パスワードを入力 → 4. ログインボタンを押す」）\n- **期待結果**: テスト成功時にどうなるべきか（例: 「ダッシュボード画面が表示される」）\n\n### 正常系と異常系\n- **正常系**: ユーザーが正しい操作をした場合のテスト（例: 正しいID/PWでログイン）\n- **異常系**: 誤った入力や想定外の操作をした場合のテスト（例: 間違ったPWでログイン）\n\n### 境界値テスト\n入力の境界にある値を重点的にテストする手法です。例えば「パスワードは8文字以上」なら、7文字（NG）・8文字（OK）・9文字（OK）をテストします。\n\n### テスト観点の例\n- **入力バリデーション**: 必須項目、文字数制限、形式チェック\n- **エラーハンドリング**: エラーメッセージの表示、画面遷移\n- **セキュリティ**: 不正アクセス、連続失敗時のロック\n- **ユーザビリティ**: 操作のわかりやすさ、フィードバックの適切さ\n\n---\n\n## テストの基礎知識\n\nテストケースを作成する前に、以下の基本概念を押さえておきましょう。\n\n### テストケースとは\nテストケースとは「ソフトウェアが正しく動作するかを確認するための手順書」です。以下の要素で構成されます：\n- **テスト名**: 何を確認するテストか（例: 「正しいパスワードでログインできる」）\n- **前提条件**: テスト実行前に必要な状態（例: 「有効なアカウントが存在する」）\n- **手順**: 実行する操作のステップ（例: 「1. ログインページを開く → 2. メールを入力 → 3. パスワードを入力 → 4. ログインボタンを押す」）\n- **期待結果**: テスト成功時にどうなるべきか（例: 「ダッシュボード画面が表示される」）\n\n### 正常系と異常系\n- **正常系**: ユーザーが正しい操作をした場合のテスト（例: 正しいID/PWでログイン）\n- **異常系**: 誤った入力や想定外の操作をした場合のテスト（例: 間違ったPWでログイン）\n\n### 境界値テスト\n入力の境界にある値を重点的にテストする手法です。例えば「パスワードは8文字以上」なら、7文字（NG）・8文字（OK）・9文字（OK）をテストします。\n\n### テスト観点の例\n- **入力バリデーション**: 必須項目、文字数制限、形式チェック\n- **エラーハンドリング**: エラーメッセージの表示、画面遷移\n- **セキュリティ**: 不正アクセス、連続失敗時のロック\n- **ユーザビリティ**: 操作のわかりやすさ、フィードバックの適切さ\n\n---\n\n## シナリオ概要\n\nログイン機能のテストケースをエージェントと協力して作成します。機能仕様を確認しながら、正常系・異常系・セキュリティ観点を網羅したテストケースを設計しましょう。\n\n## なぜPMにとって重要か\n\nPMは直接テストコードを書くことは少なくても、 **品質に対する責任** を持っています。テストケースの設計力は、PMが仕様の抜け漏れを事前に発見し、リリース後のトラブルを防ぐための重要なスキルです。\n\nこのシナリオで身につく能力：\n\n- **仕様の曖昧さを発見する力**: テストケースを考えることで「この場合どうなるべき？」という仕様の穴が見える\n- **リスクベースの思考**: 全てを均等にテストするのではなく、影響度の高い箇所を優先的に検証する判断力\n- **QAチームとの共通言語**: テスト観点を理解していることで、QAとの連携がスムーズになる\n\nログイン機能はセキュリティ上最も重要な機能の一つです。「ユーザーがどう使うか」だけでなく「攻撃者がどう悪用するか」まで考える視点を養いましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
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
            scenario_guide: Some("## テストの基礎知識\n\nテストケースを作成する前に、以下の基本概念を押さえておきましょう。\n\n### テストケースとは\nテストケースとは「ソフトウェアが正しく動作するかを確認するための手順書」です。以下の要素で構成されます：\n- **テスト名**: 何を確認するテストか（例: 「正しいパスワードでログインできる」）\n- **前提条件**: テスト実行前に必要な状態（例: 「有効なアカウントが存在する」）\n- **手順**: 実行する操作のステップ（例: 「1. ログインページを開く → 2. メールを入力 → 3. パスワードを入力 → 4. ログインボタンを押す」）\n- **期待結果**: テスト成功時にどうなるべきか（例: 「ダッシュボード画面が表示される」）\n\n### 正常系と異常系\n- **正常系**: ユーザーが正しい操作をした場合のテスト（例: 正しいID/PWでログイン）\n- **異常系**: 誤った入力や想定外の操作をした場合のテスト（例: 間違ったPWでログイン）\n\n### 境界値テスト\n入力の境界にある値を重点的にテストする手法です。例えば「パスワードは8文字以上」なら、7文字（NG）・8文字（OK）・9文字（OK）をテストします。\n\n### テスト観点の例\n- **入力バリデーション**: 必須項目、文字数制限、形式チェック\n- **エラーハンドリング**: エラーメッセージの表示、画面遷移\n- **セキュリティ**: 不正アクセス、連続失敗時のロック\n- **ユーザビリティ**: 操作のわかりやすさ、フィードバックの適切さ\n\n---\n\n## シナリオ概要\n\nお問い合わせフォーム機能のテストケースをエージェントと協力して作成します。複数の入力フィールド、バリデーション、エラー表示を考慮したテスト設計に取り組みましょう。\n\n## なぜPMにとって重要か\n\nフォームはユーザーとプロダクトの重要な接点です。入力エラーやバリデーション不備は **ユーザー離脱に直結** するため、PMとして品質を担保する観点を持つことが不可欠です。\n\nこのシナリオで身につく能力：\n\n- **ユーザー視点でのテスト設計**: ユーザーが実際にどんな入力をするか（正常・異常・境界値）を想像する力\n- **網羅性と優先度のバランス**: 限られたリソースの中で、どのテストを優先すべきか判断する力\n- **非機能要件への意識**: 「動く」だけでなく、操作性やエラー時の体験まで考慮する\n\nフォームのテストケース設計は、要件定義の精度を検証する行為でもあります。「この仕様で本当にユーザーが困らないか？」を考えるトレーニングとして取り組みましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
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
            scenario_guide: Some("## テストの基礎知識\n\nテストケースを作成する前に、以下の基本概念を押さえておきましょう。\n\n### テストケースとは\nテストケースとは「ソフトウェアが正しく動作するかを確認するための手順書」です。以下の要素で構成されます：\n- **テスト名**: 何を確認するテストか（例: 「正しいパスワードでログインできる」）\n- **前提条件**: テスト実行前に必要な状態（例: 「有効なアカウントが存在する」）\n- **手順**: 実行する操作のステップ（例: 「1. ログインページを開く → 2. メールを入力 → 3. パスワードを入力 → 4. ログインボタンを押す」）\n- **期待結果**: テスト成功時にどうなるべきか（例: 「ダッシュボード画面が表示される」）\n\n### 正常系と異常系\n- **正常系**: ユーザーが正しい操作をした場合のテスト（例: 正しいID/PWでログイン）\n- **異常系**: 誤った入力や想定外の操作をした場合のテスト（例: 間違ったPWでログイン）\n\n### 境界値テスト\n入力の境界にある値を重点的にテストする手法です。例えば「パスワードは8文字以上」なら、7文字（NG）・8文字（OK）・9文字（OK）をテストします。\n\n### テスト観点の例\n- **入力バリデーション**: 必須項目、文字数制限、形式チェック\n- **エラーハンドリング**: エラーメッセージの表示、画面遷移\n- **セキュリティ**: 不正アクセス、連続失敗時のロック\n- **ユーザビリティ**: 操作のわかりやすさ、フィードバックの適切さ\n\n---\n\n## シナリオ概要\n\nドラッグ＆ドロップ対応のファイルアップロード機能のテストケースをエージェントと協力して作成します。ファイル形式・サイズ制限・複数ファイル処理など、多角的なテスト設計に取り組みましょう。\n\n## なぜPMにとって重要か\n\nファイルアップロードは **ユーザーの重要なデータを扱う機能** であり、不具合があるとデータ損失やセキュリティリスクに直結します。PMとして、技術的な制約と品質要件を理解した上でテストを設計する力が求められます。\n\nこのシナリオで身につく能力：\n\n- **状態遷移の理解**: pending → uploading → success/error という状態の流れを把握し、各段階で何をテストすべきか考える\n- **セキュリティ観点の思考**: 悪意のあるファイル、偽装された拡張子など、攻撃パターンを想定する\n- **エッジケースの発見**: 同時アップロード、ネットワーク切断、ブラウザ互換性など、通常操作では見つからない問題を洗い出す\n\nファイルアップロードのような複雑な機能ほど、事前のテスト設計が品質を左右します。「普通に使えば動く」ではなく「どんな状況でも安全に動く」を目指す視点を養いましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        // Requirement-definition scenarios
        Scenario {
            id: "basic-requirement-definition-doc".to_string(),
            title: "ログイン機能".to_string(),
            description: "ログイン機能の要件定義をエージェントと共同して作成する。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "login".to_string(), description: "メールアドレスとパスワードで認証するログインフォームです。".to_string() }),
            scenario_guide: Some("## シナリオ概要\n\nログイン機能の要件定義をエージェントと協力して作成します。エンジニアやデザイナーに渡す要件定義として、正常系・異常系・非機能要件を網羅した文書を作成しましょう。\n\n## なぜPMにとって重要か\n\n要件定義は **PMの最も重要な成果物の一つ** です。要件が曖昧なまま開発が始まると、手戻り・認識齟齬・スケジュール遅延の原因になります。\n\nこのシナリオで身につく能力：\n\n- **要件の構造化**: 機能要件（何ができるか）と非機能要件（セキュリティ・パフォーマンス）を整理して記述する力\n- **受入条件の明確化**: 「完了」とは何かをエンジニア・QAが判断できるレベルで定義する\n- **ステークホルダー視点の切り替え**: ユーザー・エンジニア・ビジネスそれぞれの観点から要件を検討する\n\nログイン機能は一見シンプルですが、セキュリティ・UX・エラーハンドリングなど考慮すべき点が多い機能です。「当たり前」を明文化する難しさと重要さを体感しましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "basic-requirement-hearing-plan".to_string(),
            title: "問い合わせフォーム機能".to_string(),
            description: "問い合わせフォーム機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "form".to_string(), description: "お問い合わせフォームです。入力検証とエラー表示を確認できます。".to_string() }),
            scenario_guide: Some("## シナリオ概要\n\nお問い合わせフォーム機能の要件定義をエージェントと協力して作成します。目的・対象ユーザーの確認から、入力・送信・エラー時の受入条件の定義まで、段階的に要件を整理しましょう。\n\n## なぜPMにとって重要か\n\nPMは開発チームに「何を作るか」を正確に伝える責任があります。問い合わせフォームは **ユーザーの声をプロダクトに届ける窓口** であり、要件の質がユーザー体験に直結します。\n\nこのシナリオで身につく能力：\n\n- **目的起点の要件定義**: 「なぜこの機能が必要か」「誰がどんな時に使うか」から要件を導き出す思考\n- **境界条件の明確化**: 任意フィールドと必須フィールドの扱い、文字数制限の根拠など、判断が分かれるポイントを明文化する\n- **スコープの切り分け**: 「今回作るもの」と「作らないもの」を明示し、不明点はアクションとして残す\n\n実務では、曖昧な要件定義は「PMが何を考えているか分からない」というチームの不信感につながります。このシナリオで「誰が読んでも同じ理解になる」要件定義の書き方を実践しましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "basic-requirement-user-story".to_string(),
            title: "ファイルアップロード機能".to_string(),
            description: "ファイルアップロード機能の要件定義を行う。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: Some(FeatureMockup { component: "file-upload".to_string(), description: "ドラッグ＆ドロップ対応のファイルアップロード機能です。".to_string() }),
            scenario_guide: Some("## シナリオ概要\n\nファイルアップロード機能の要件定義をエージェントと協力して作成します。目的・対象ユーザーの確認から、ファイル形式・サイズ制限・エラー処理の受入条件まで、段階的に要件を整理しましょう。\n\n## なぜPMにとって重要か\n\nファイルアップロードは **技術的制約とユーザー体験のバランス** が問われる典型的な機能です。PMとして、技術チームと対等に議論し、ユーザーにとって最適な仕様を決定する力が求められます。\n\nこのシナリオで身につく能力：\n\n- **非機能要件の定義**: ファイルサイズ上限の根拠、許可形式の選定理由など、「なぜその制約か」を説明できる力\n- **エラーシナリオの網羅**: アップロード失敗時のリトライ、ネットワークエラー時の挙動など、異常系の仕様を漏れなく定義する\n- **技術的トレードオフの理解**: セキュリティ・パフォーマンス・UXの間のトレードオフを理解し、根拠ある判断を下す\n\nPMが技術的背景を理解した上で要件を定義できると、エンジニアとの信頼関係が格段に深まります。「技術のことは分からない」で済ませず、自分の言葉で技術的判断の根拠を説明できる力を磨きましょう。".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "prd-notification-settings".to_string(),
            title: "通知設定機能のPRD作成".to_string(),
            description: "解約理由トップの「通知が多すぎる」を解決する通知設定機能のPRDを作成する。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: None,
            scenario_guide: Some("## PRDとは\n\nPRD（製品要求文書）は **「何をなぜ作るか」** を定義する上流文書です。要件定義が「機能の詳細仕様」に焦点を当てるのに対し、PRDはビジネス課題から出発し、以下を定義します:\n\n- **背景と目的** : なぜこの機能が必要か（データに基づく根拠）\n- **成功指標** : 定量的なKPIと測定方法\n- **スコープ** : 今回作るもの/作らないもの\n- **ユーザーストーリー** : 誰が・何を・なぜ求めているか\n\nこのシナリオでは、解約理由データを基に通知設定機能のPRDを作成します。エンジニアリングリードの田中さんに技術面を相談しながら進めましょう。".to_string()),
            kickoff_prompt: "## 通知設定機能のPRD作成\n\nあなたはBtoB SaaSプロダクトのPMです。カスタマーサクセスチームから緊急の相談が来ました。\n\n### 背景\n\n直近の解約理由アンケート（n=142）で衝撃的なデータが出ました:\n\n| 解約理由 | 割合 |\n|---------|------|\n| **通知が多すぎる** | **32%（トップ）** |\n| 機能が使いにくい | 21% |\n| 価格が高い | 18% |\n| 他ツールに乗り換え | 15% |\n\nNPSスコアも直近3ヶ月で **+28 → +19** に低下しており、通知体験の悪化との相関が確認されています。\n\n### 現状の通知\n\n| チャネル | 種類 | 頻度 |\n|---------|------|------|\n| メール | 新機能案内 | 週1回 |\n| メール | 請求通知 | 月1回 |\n| メール | アラート通知 | 随時 |\n| アプリ内 | アクティビティ通知 | 随時 |\n| アプリ内 | システム通知 | 随時 |\n\n**問題** : 全てON/OFFの二択。頻度もチャネルも個別設定できない。\n\n### リソースと制約\n\n- **リリース目標** : Q2末（3ヶ月後）\n- **開発チーム** : フロントエンド1名 + バックエンド1名\n- **スコープ外** : プッシュ通知（モバイルアプリ未対応のため）\n- **既存システム** : SendGrid（メール）+ 内製通知サービス（アプリ内）".to_string(),
            evaluation_criteria: vec![
                RatingCriterion {
                    id: None,
                    name: "背景と目的の明確さ".to_string(),
                    weight: 25.0,
                    description: "課題の定量化、ビジネスインパクトの説明".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "解約率・NPS低下を定量データで示し、この機能が必要な理由をビジネス観点から明確に説明している".to_string(),
                        good: "背景と目的はあるが、定量的な根拠が一部不足".to_string(),
                        needs_improvement: "目的は書かれているが根拠が薄い".to_string(),
                        poor: "背景の説明がなく、機能の説明だけになっている".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "成功指標の具体性".to_string(),
                    weight: 25.0,
                    description: "測定可能で期限がある指標を定義しているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "数値目標・期限・測定方法が全て明記、ベースラインも示されている".to_string(),
                        good: "数値目標はあるが、期限または測定方法が不明確".to_string(),
                        needs_improvement: "成功指標が抽象的（「利用率向上」「解約減少」など）".to_string(),
                        poor: "成功指標が定義されていない".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "スコープの明確さ".to_string(),
                    weight: 25.0,
                    description: "含めるもの/含めないものが明確に線引きされているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "スコープ内・外が明確に列挙、境界線の理由も説明".to_string(),
                        good: "スコープ内は明確だが、スコープ外の明示が不完全".to_string(),
                        needs_improvement: "スコープが曖昧な表現のまま".to_string(),
                        poor: "スコープの定義がなく、何を作るか不明確".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "ユーザーストーリーの質".to_string(),
                    weight: 25.0,
                    description: "ペルソナ・行動・価値の3要素が含まれるか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "3つ以上のユーザーストーリーがAs a/I want/So that形式で書かれ、受入条件も明記".to_string(),
                        good: "ユーザーストーリーは3つ以上あるが、受入条件が不完全".to_string(),
                        needs_improvement: "形式が不完全または数が不足".to_string(),
                        poor: "ユーザーストーリーが作成されていない".to_string(),
                    },
                },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "prd-notif-m1".to_string(), title: "背景と目的を記述する（なぜ作るか）".to_string(), description: None, order: 1 },
                Mission { id: "prd-notif-m2".to_string(), title: "成功指標を定義する（何をもって成功とするか）".to_string(), description: None, order: 2 },
                Mission { id: "prd-notif-m3".to_string(), title: "スコープ内/スコープ外を明確にする".to_string(), description: None, order: 3 },
                Mission { id: "prd-notif-m4".to_string(), title: "ユーザーストーリーを3つ以上作成する".to_string(), description: None, order: 4 },
            ]),
            agent_prompt: Some("## あなたの役割\nPMが作成するPRDの曖昧な部分を技術的観点から突き、仕様を明確にするよう促す。\n\n## 基本方針\n- 実装者の視点で問う:「これで実装できるか」という観点でPRDの曖昧さを指摘\n- 前提を確認する: ユーザーが当然だと思っている前提を明示させる\n- スコープを詰める:「今回作るのか、作らないのか」を常に明確にさせる\n\n## 問いかけ例\n- 「'通知の頻度設定'とは具体的に？日次/週次の切り替え？1日の最大件数？」\n- 「'通知の種類別ON/OFF'の'種類'は？新機能案内・請求・アラートの3種類？アラートはOFFにできますか？」\n- 「成功指標の'利用率向上'は何%を目指す？ベースラインは？」\n- 「フロント1名・バック1名で3ヶ月、現実的なスコープですか？」\n- 「メール通知をOFFにした場合、請求通知もOFF？それは問題ない？」\n\n## 技術情報（質問された場合）\n- SendGridのサブスクリプション管理APIで種別ごとON/OFF可能\n- 頻度制御は既存通知サービスに機能追加が必要（約5日）\n- notification_settingsテーブル追加で設定保存対応可能\n- メール=SendGrid、アプリ内=内製サービスで別管理\n\n## 重要\nPRDの内容を代わりに書かない。「何を決める必要があるか」を気づかせる問いかけに徹する。".to_string()),
            single_response: None,
            agent_opening_message: Some("PRD作成に関してわからないことがあればお聞きください。技術的な制約や実装の観点からアドバイスできます。".to_string()),
            model_answer: None,
        },
        Scenario {
            id: "prd-onboarding-wizard".to_string(),
            title: "オンボーディング改善のPRD作成".to_string(),
            description: "アクティベーション率38%を改善するオンボーディングウィザードのPRDを作成する。".to_string(),
            scenario_type: ScenarioType::RequirementDefinition,
            feature_mockup: None,
            scenario_guide: Some("## PRDとは\n\nPRD（製品要求文書）は **「何をなぜ作るか」** を定義する上流文書です。要件定義が「機能の詳細仕様」に焦点を当てるのに対し、PRDはビジネス課題から出発し、以下を定義します:\n\n- **背景と目的** : なぜこの機能が必要か（データに基づく根拠）\n- **成功指標** : 定量的なKPIと測定方法\n- **スコープ** : 今回作るもの/作らないもの\n- **ユーザーストーリー** : 誰が・何を・なぜ求めているか\n\nこのシナリオでは、低迷するアクティベーション率を改善するオンボーディング機能のPRDを作成します。プロダクトデザイナーの山田さんにUX面を相談しながら進めましょう。".to_string()),
            kickoff_prompt: "## オンボーディング改善のPRD作成\n\nあなたはBtoB SaaSプロダクトのPMです。新規ユーザーの離脱が深刻な課題になっています。\n\n### 背景\n\n新規ユーザーのアクティベーション率（登録後7日以内にコア機能を利用）が **38%** で、業界平均の **60%** を大幅に下回っています。\n\n### ファネルデータ\n\n| ステップ | 完了率 | 離脱率 |\n|---------|--------|--------|\n| 登録→初回ログイン | 82% | 18% |\n| 初回ログイン→プロフィール設定 | 61% | 39% |\n| プロフィール設定→コア機能利用 | 48% | 52% |\n| **全体アクティベーション率** | **38%** | **62%** |\n\n### 行動データ\n\n- 離脱ユーザーの平均セッション数: **1.8回**\n- アクティブユーザーの平均セッション数: **6.2回** （初月）\n\n### ユーザーインタビュー（n=24）\n\n| 主な声 | 割合 |\n|-------|------|\n| 何から始めればいいか分からなかった | 58% |\n| 機能が多すぎて迷った | 42% |\n| 自分の業務にどう使えるか分からなかった | 33% |\n\n### リソースと制約\n\n- **リリース目標** : 次四半期末（約4ヶ月後）\n- **開発チーム** : フロント2名 + バック1名 + デザイナー1名\n- **既存のオンボーディング** : メールシーケンス（5通）のみ。アプリ内ガイドなし\n- **対象** : 新規登録ユーザー（既存ユーザーは対象外）".to_string(),
            evaluation_criteria: vec![
                RatingCriterion {
                    id: None,
                    name: "課題とデータの整理".to_string(),
                    weight: 25.0,
                    description: "現状の数値を正確に把握し、課題を構造的に説明しているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "アクティベーション率・離脱ポイント・ユーザーの声を構造的に整理し、ビジネスインパクトも定量化している".to_string(),
                        good: "主要データは整理しているが、一部の分析が不足".to_string(),
                        needs_improvement: "データを列挙しているが、構造的な分析になっていない".to_string(),
                        poor: "データを活用できておらず、感覚的な課題認識にとどまっている".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "ユーザージャーニーの設計".to_string(),
                    weight: 25.0,
                    description: "新規ユーザーが価値を感じるまでの最短パスを設計しているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "ファーストバリューモーメントを明確に定義し、そこに至る具体的なステップを設計している".to_string(),
                        good: "ジャーニーは設計しているが、価値を感じるポイントの定義が曖昧".to_string(),
                        needs_improvement: "ステップは考えているが、ユーザー視点が不足".to_string(),
                        poor: "ユーザージャーニーの設計がない".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "スコープとフェーズ分け".to_string(),
                    weight: 25.0,
                    description: "MVPと将来フェーズが明確に分けられているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "Phase 1（MVP）のスコープが明確で、Phase 2以降の構想も示されている。判断の根拠が論理的".to_string(),
                        good: "MVPのスコープは明確だが、フェーズ分けの根拠が不十分".to_string(),
                        needs_improvement: "スコープの記述はあるが、MVPの判断基準が不明確".to_string(),
                        poor: "スコープの定義がない、または全部入りで現実的でない".to_string(),
                    },
                },
                RatingCriterion {
                    id: None,
                    name: "成功指標と測定計画".to_string(),
                    weight: 25.0,
                    description: "定量的な目標と測定方法が定義されているか".to_string(),
                    scoring_guidelines: ScoringGuidelines {
                        excellent: "アクティベーション率の目標値・期限・測定方法が明確で、中間指標（各ステップの完了率）も定義".to_string(),
                        good: "目標値はあるが、中間指標または測定方法が不完全".to_string(),
                        needs_improvement: "目標が抽象的で測定可能でない".to_string(),
                        poor: "成功指標が定義されていない".to_string(),
                    },
                },
            ],
            passing_score: Some(60.0),
            missions: Some(vec![
                Mission { id: "prd-onboard-m1".to_string(), title: "課題をデータに基づいて構造的に整理する".to_string(), description: None, order: 1 },
                Mission { id: "prd-onboard-m2".to_string(), title: "ユーザージャーニーとファーストバリューモーメントを定義する".to_string(), description: None, order: 2 },
                Mission { id: "prd-onboard-m3".to_string(), title: "MVP（Phase 1）のスコープを明確にする".to_string(), description: None, order: 3 },
                Mission { id: "prd-onboard-m4".to_string(), title: "成功指標と測定計画を定義する".to_string(), description: None, order: 4 },
            ]),
            agent_prompt: Some("## あなたの役割\nプロダクトデザイナーの山田として振る舞う。PMが作成するPRDをユーザー体験の観点から検証し、より良い設計に導く。\n\n## 基本方針\n- ユーザー視点で問う:「このステップでユーザーは何を感じるか」を常に考えさせる\n- 具体性を求める:「オンボーディングを改善する」では不十分、具体的なインタラクションを定義させる\n- 優先順位を問う: 全部やりたい気持ちを抑え、MVPとして何が最も重要かを判断させる\n\n## 問いかけ例\n- 「ユーザーが'価値を感じる瞬間'とは具体的にどのアクション？それを最短で体験させるには？」\n- 「ステップが多すぎませんか？ユーザーは3クリック以上続くと離脱率が急上昇します」\n- 「'プロフィール設定'は本当にオンボーディングに必要？後回しにできませんか？」\n- 「業種別のテンプレートを用意する案はどうですか？ユーザーインタビューで'自分の業務にどう使えるか分からない'という声がありました」\n- 「成功指標のアクティベーション率60%は野心的ですが、いつまでに達成？中間目標は？」\n- 「既存のメールシーケンスとの整合性は？アプリ内ガイドと重複しませんか？」\n\n## デザイン情報（質問された場合）\n- 競合A: 3ステップのセットアップウィザード + インタラクティブツアー\n- 競合B: 業種選択→テンプレート適用→サンプルデータで体験\n- UXリサーチ: 「進捗バー付きのステップUI」はオンボーディング完了率を平均23%向上（業界データ）\n- デザインシステム: モーダル、ツールチップ、ステッパーUIのコンポーネントは既存\n- A/Bテスト: ウィザード形式 vs チェックリスト形式のテストを推奨\n\n## 重要\nPRDの内容を代わりに書かない。ユーザー体験の観点から問いかけ、PMが自分で最適な設計を導き出せるようサポートする。".to_string()),
            single_response: None,
            agent_opening_message: Some("プロダクトデザイナーの山田です。PRD作成に関してわからないことがあればお聞きください。ユーザー体験やデザインの観点からアドバイスできます。".to_string()),
            model_answer: None,
        },
        // Incident-response scenarios
        Scenario {
            id: "coming-incident-response".to_string(),
            title: "P1障害: ログイン不能バグの緊急対応".to_string(),
            description: "P1障害の初動対応と報告を行う。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\nP1障害の対応はPMにとって最もプレッシャーのかかる場面の一つです。 **冷静な状況判断・迅速なエスカレーション・ステークホルダーへの適切な情報提供** を同時に行う力が問われます。\n\n障害対応はPMの総合力が試される場面です：\n\n- **優先度判断**: 限られた情報の中で「今すぐやるべきこと」と「後回しにできること」を切り分ける\n- **エスカレーション判断**: 誰に、いつ、何を報告すべきかを即座に判断する\n- **復旧と再発防止の切り分け**: 暫定対応で復旧させつつ、恒久対応のプランも立てる\n\n実務では、PMの初動の速さと正確さがサービスの信頼性を守ります。このシナリオでP1障害対応の型を身につけましょう。\n\n---\n\n## 障害ブリーフィング\n\n### 発生事象\n本番環境のログインAPIが500エラーを返し続け、 **全ユーザーがログイン不能** な状態が継続中。\n\n### 重大度\n**P1（Critical）** — サービス全体が利用不可\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 09:15 | 監視アラート発報（エラーレート急上昇） |\n| 09:18 | CSチームに問い合わせ殺到開始 |\n| 09:20 | SREがAPI調査開始 |\n| 09:25 | **現在** — PMであるあなたに連絡が入る |\n\n### 影響範囲\n- 全ユーザー（約12万人）がログイン不能\n- モバイルアプリ・Webの両方に影響\n- 既にログイン済みセッションは有効\n\n### チーム情報\n- SRE: 田中（API調査中）\n- Backend Lead: 鈴木（原因特定中、デプロイ起因の可能性）\n- CS: 高橋（問い合わせ対応中、件数急増）\n- VP of Engineering: 山本（未連絡）\n- 広報: 中村（未連絡）".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "coming-incident-triage-escalation".to_string(),
            title: "P2障害: 決済遅延バグ".to_string(),
            description: "P2障害のトリアージとエスカレーション判断を行う。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\nP2障害はP1ほどの緊急度はないものの、 **適切なトリアージとエスカレーション判断** が求められる場面です。「どこまで対応するか」「誰にいつ報告するか」の判断を誤ると、不必要な混乱や対応遅延を招きます。\n\nこのシナリオで身につく能力：\n\n- **トリアージスキル**: 障害の重大度を正確に評価し、対応レベルを適切に設定する\n- **リスク評価**: 「決済は成功しているがユーザーが二重決済を試みるかもしれない」など、二次被害のリスクを予測する\n- **報告リズムの設計**: P1とは異なる報告頻度・報告先を適切に設定する\n\nPMにとって、全ての障害をP1と同じ緊急度で対応するのは非効率です。冷静に重大度を見極め、対応の強弱をつける力を養いましょう。\n\n---\n\n## 障害ブリーフィング\n\n### 発生事象\n決済処理自体は正常に完了しているが、 **完了通知の反映が最大20分遅延** している。\n\n### 重大度\n**P2（High）** — 機能劣化（データ損失なし）\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 14:00 | CSに「決済したのに反映されない」問い合わせ3件 |\n| 14:30 | 開発チームが遅延を確認 |\n| 14:45 | **現在** — PMであるあなたに報告 |\n\n### 影響範囲\n- 過去2時間の決済ユーザー約800人が対象\n- 決済自体は成功、金銭的損失なし\n- ユーザーが二重決済を試みるリスクあり\n\n### チーム情報\n- Backend: 佐藤（通知キューの調査中）\n- CS: 高橋（問い合わせ対応中、テンプレ回答準備済み）\n- Product Owner: 山本（次のアクション判断待ち）".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "coming-postmortem-followup".to_string(),
            title: "P3障害: 表示崩れバグの再発防止".to_string(),
            description: "P3障害の原因分析と再発防止策を決定する。".to_string(),
            scenario_type: ScenarioType::IncidentResponse,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\nP3障害は緊急度こそ低いものの、 **再発防止の仕組みづくり** がPMの腕の見せどころです。ポストモーテム（振り返り）を通じて、同じ問題が繰り返されない体制を構築するスキルは、チームの成熟度を高めるために欠かせません。\n\nこのシナリオで身につく能力：\n\n- **原因分析の構造化**: 「事実」と「推測」を明確に区別し、根本原因を特定する\n- **暫定対応と恒久対応の使い分け**: 目の前の問題を素早く解決しつつ、根本的な対策も並行して進める\n- **アクションの責任と期限の明確化**: 「誰が」「いつまでに」「何をするか」を合意し、フォローアップする\n\n障害対応は「直して終わり」ではありません。同様の問題を横展開で防止し、プロセス改善につなげるのがPMの役割です。\n\n---\n\n## 障害ブリーフィング\n\n### 発生事象\nAndroidの一部端末でプロフィール画面の **ボタンが重なって表示崩れ** する。\n\n### 重大度\n**P3（Medium）** — 特定条件のUI不具合\n\n### タイムライン\n| 時刻 | イベント |\n|------|----------|\n| 先週金曜 | ユーザーからストアレビューで報告（星2） |\n| 月曜AM | QAチームが再現確認 |\n| 月曜PM | **現在** — ポストモーテム会議の準備 |\n\n### 影響範囲\n- Android 12以下の一部端末（画面幅360dp未満）\n- 対象ユーザー推定：全Androidユーザーの約8%\n- 機能自体は動作する（タップ領域が重なるだけ）\n\n### チーム情報\n- Frontend: 山本（CSS原因の調査完了）\n- QA: 中村（再現端末リスト作成済み）\n- Design: 佐藤（修正デザイン案を準備中）\n- Product Owner: 鈴木（修正優先度の判断待ち）".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        // Business-execution scenarios
        Scenario {
            id: "coming-priority-tradeoff-workshop".to_string(),
            title: "優先度トレードオフ".to_string(),
            description: "複数の候補案を比較し、段階リリース計画を決定する。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\n「何を作るか」よりも **「何を作らないか」** を決めることがPMの最も難しい仕事です。リソースは常に有限であり、全てのステークホルダーの要望を同時に満たすことはできません。\n\nこのシナリオで身につく能力：\n\n- **比較軸の設計**: 感覚ではなく、明確な評価基準に基づいて選択肢を比較する\n- **ステークホルダーの合意形成**: 利害が対立する中で、全員が納得できる判断の根拠を示す\n- **段階リリースの計画力**: 「全部やる」ではなく「どの順番でやるか」を設計し、リスクを最小化する\n\n実務では、PMの優先順位判断がプロダクトの成否を左右します。データと論理に基づいた意思決定の型を身につけましょう。\n\n---\n\n## ビジネスブリーフィング\n\n### 状況\n次四半期リリースに向けて、開発リソース（エンジニア4名・3ヶ月）で対応できる候補が3つあります。全て同時にはできないため、 **優先順位と段階リリース計画** の合意が必要です。\n\n### 候補案\n\n| 案 | 概要 | 想定工数 | ビジネスインパクト |\n|----|------|----------|--------------------|\n| A. 高速検索 | Elasticsearchによる全文検索 | 2名×2ヶ月 | 検索離脱率30%改善見込み |\n| B. 通知改善 | プッシュ通知のパーソナライズ | 1名×3ヶ月 | エンゲージメント15%向上見込み |\n| C. 管理画面改修 | オペレーション効率化 | 2名×1.5ヶ月 | CS対応時間40%削減見込み |\n\n### 制約\n- 四半期末までにリリース可能な状態にすること\n- QAリソースは1名のみ（並行テストは2機能まで）\n- 高速検索はインフラ変更を伴うため、リリース後1週間の監視期間が必要\n\n### ステークホルダー\n- CEO: 「検索改善は競合対策として急務」\n- CS責任者: 「管理画面が最優先、問い合わせが捌けない」\n- Growth担当: 「通知改善のROIが最も高い」".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "adv-data-roi".to_string(),
            title: "データドリブン投資判断".to_string(),
            description: "データ分析に基づいて機能投資のROIを評価し、意思決定を行う。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\nPMの意思決定は「勘と経験」ではなく **データに基づく論理的な根拠** で行う必要があります。特に投資判断では、ROIの算出と比較が不可欠です。\n\nこのシナリオで身につく能力：\n\n- **データの読み解き**: MAU・NPS・ARPU・チャーンレートなど、複数の指標を組み合わせてプロダクトの健全性を評価する\n- **ROI計算と比較**: 開発コストに対する期待リターンを定量化し、投資対効果で選択肢を比較する\n- **定量と定性の統合**: 数字だけでは見えない技術的負債や営業上のニーズも考慮に入れた総合判断\n\n実務では「感覚的に良さそう」という提案はCFOや経営陣に通りません。データで語り、前提条件を明示し、リスクも含めて提案できるPMが信頼されます。\n\n---\n\n## ビジネスブリーフィング\n\n### 状況\nプロダクトの月次レビューで、 **次四半期の機能投資先** を決定する必要があります。データチームから各機能の利用状況レポートが届いています。\n\n### データサマリ\n\n| 機能 | MAU | 利用頻度/週 | NPS | 開発コスト（人月） | 売上貢献度 |\n|------|-----|-------------|-----|--------------------|-----------|\n| ダッシュボード | 8,500 | 4.2回 | +32 | 6 | 直接なし |\n| レポート出力 | 3,200 | 1.1回 | +45 | 4 | 月額¥120万 |\n| API連携 | 1,800 | 12.5回 | +18 | 8 | 月額¥280万 |\n| モバイルアプリ | 5,100 | 2.8回 | -5 | 10 | 月額¥50万 |\n\n### 制約\n- 次四半期の開発リソース: 12人月\n- 経営陣の期待: 四半期ARR +15%\n- チャーンレートが前月比で0.5%上昇中\n\n### ステークホルダー\n- CFO: 「ROIで判断してほしい。感覚的な議論は避けたい」\n- CTO: 「技術的負債も考慮すべき。API連携の基盤は古い」\n- 営業責任者: 「モバイル対応は商談で頻繁に聞かれる」".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
        },
        Scenario {
            id: "adv-strategy-diagnosis".to_string(),
            title: "プロダクト戦略診断".to_string(),
            description: "プロダクトの成長停滞を分析し、戦略転換の提案を行う。".to_string(),
            scenario_type: ScenarioType::BusinessExecution,
            feature_mockup: None,
            scenario_guide: Some("## なぜPMにとって重要か\n\nプロダクトの成長停滞は、PMが最も本質的な価値を発揮する場面です。 **現状を構造的に分析し、複数の戦略オプションを比較し、限られたリソースで最大の成果を出す方向性を提案する** ——これはPMの中核スキルそのものです。\n\nこのシナリオで身につく能力：\n\n- **構造的な現状分析**: MRR・チャーンレート・NPS・ARPUなどの指標から「何が問題の根本原因か」を特定する\n- **戦略オプションの設計と比較**: 「既存機能の改善」「上位市場への展開」「新機能追加」など、方向性の異なる戦略を設計し、トレードオフを明確にする\n- **ランウェイを意識した実行計画**: 18ヶ月という制約の中で成果を出すための現実的なロードマップを策定する\n\nPMは「今ある機能を少し良くする」だけでなく、プロダクトの未来を方向づける役割を担います。このシナリオで戦略的思考の型を実践しましょう。\n\n---\n\n## ビジネスブリーフィング\n\n### 状況\nBtoB SaaSプロダクト（プロジェクト管理ツール）が **成長停滞** に直面しています。CEOから「現状分析と戦略提案」を求められています。\n\n### 現状データ\n\n| 指標 | 6ヶ月前 | 現在 | 業界平均 |\n|------|---------|------|----------|\n| MRR | ¥1,200万 | ¥1,250万 | - |\n| 新規獲得/月 | 45社 | 28社 | - |\n| チャーンレート | 3.2% | 4.8% | 3.0% |\n| NPS | +35 | +22 | +30 |\n| ARPU | ¥15,000 | ¥14,200 | ¥18,000 |\n\n### 競合環境\n- 競合A: AI機能を大幅強化、価格はほぼ同等\n- 競合B: エンタープライズ向けに特化、価格は2倍だが大手顧客を獲得中\n- 競合C: 無料プランを強化、SMB市場を侵食中\n\n### 制約\n- 開発チーム: 15名（増員予算は限定的）\n- 資金: 次のラウンドまで18ヶ月のランウェイ\n- 既存顧客からの要望: 「ガントチャート」「リソース管理」「レポート強化」\n\n### ステークホルダー\n- CEO: 「成長を取り戻すための大きな方向転換が必要かもしれない」\n- VP of Sales: 「エンタープライズに行くべき、ARPUを上げないと」\n- VP of Product: 「今の機能を磨くべき、新機能追加は中途半端になる」".to_string()),
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
            agent_opening_message: None,
            model_answer: None,
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
