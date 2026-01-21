import type {
  Scenario,
  ScenarioCatalogSection,
  ScenarioDiscipline,
  ScenarioSummary,
} from "@/types/session";

const evaluationCriteria = [
  { name: "方針提示とリード力", weight: 25 },
  { name: "計画と実行可能性", weight: 25 },
  { name: "コラボレーションとフィードバック", weight: 25 },
  { name: "リスク/前提管理と改善姿勢", weight: 25 },
] as const;

const scenarioList: Scenario[] = [
  {
    id: "basic-intro-alignment",
    title: "自己紹介＆期待値合わせ (基礎)",
    discipline: "BASIC",
    description: "新規プロジェクトに合流し、役割と成功条件を30分で擦り合わせる。",
    product: {
      name: "オンボーディングワークショップ",
      summary: "ステークホルダーと目的・役割・進め方を合意する初回ミーティング。",
      audience: "プロダクトオーナー、開発リーダー、QA",
      problems: ["役割が不明瞭", "優先度の解像度が低い"],
      goals: ["役割・責任の明確化", "初期コミュニケーション計画の合意"],
      differentiators: ["シンプルな準備リスト", "会話テンプレート"],
      scope: ["自己紹介", "目的確認", "進め方合意"],
      constraints: ["30分タイムボックス", "参加者3名想定"],
      timeline: "初回ミーティング当日",
      successCriteria: ["期待値の一致が確認できる", "次アクションが2件以上決定"],
      uniqueEdge: "短時間で役割と進め方を固める練習に特化",
      techStack: ["Next.js", "Tailwind CSS", "Axum"],
      coreFeatures: ["メモ", "アクション記録"],
    },
    mode: "guided",
    kickoffPrompt: "あなたは新規PJに参加するPM/PMOとして、初回ミーティングで役割と期待値を揃えます。短時間で目的・進め方・次アクションを決めてください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "basic-intro-m1", title: "自己紹介と役割・責任範囲の確認", order: 1 },
      { id: "basic-intro-m2", title: "成功条件と優先度の合意", order: 2 },
      { id: "basic-intro-m3", title: "次アクションと連絡リズムの設定", order: 3 },
    ],
    supplementalInfo: "時間配分（5分自己紹介/15分期待値/10分次アクション）を意識してください。",
  },
  {
    id: "basic-ticket-refine",
    title: "チケット要件整理 (基礎)",
    discipline: "BASIC",
    description: "曖昧なチケットを受入可能な形に分解し、スプリントに載せられる状態へ整理する。",
    product: {
      name: "チケット精査セッション",
      summary: "目的と受入条件を固め、開発が着手できる粒度に落とし込む。",
      audience: "プロダクトオーナー、開発チーム、QA",
      problems: ["目的が曖昧", "受入条件が無い", "依存が不明"],
      goals: ["受入基準の明文化", "優先度と依存を整理", "工数見積もり可能な粒度にする"],
      differentiators: ["シンプルなACテンプレ", "依存を見える化"],
      scope: ["目的確認", "AC定義", "依存・リスク整理"],
      constraints: ["既存スプリントの枠内で調整", "非機能要件も確認"],
      timeline: "今週のスプリントプランニング前",
      successCriteria: ["ACが3〜5件明文化", "依存/リスクが特定されている"],
      uniqueEdge: "受入基準作りと依存洗い出しに集中",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["ACテンプレ", "依存チェックリスト"],
    },
    mode: "guided",
    kickoffPrompt: "あなたはPMとして曖昧なチケットをスプリントに載せられる形へ精査します。目的、受入条件、依存/リスクを明文化してください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "basic-ticket-m1", title: "課題の目的とゴールを確認する", order: 1 },
      { id: "basic-ticket-m2", title: "受入条件(AC)を定義する", order: 2 },
      { id: "basic-ticket-m3", title: "依存関係とリスクを明文化する", order: 3 },
    ],
    supplementalInfo: "ACは観測可能な期待値で書き、依存は担当と期日をセットで整理してください。",
  },
  {
    id: "basic-testcase-design",
    title: "テストケース作成 (基礎)",
    discipline: "BASIC",
    description: "新機能の仕様からスモーク/回帰テストケースを洗い出し、漏れのない最小集合を作る。",
    product: {
      name: "テスト計画メモ",
      summary: "正常系と主要な異常系を素早く列挙し、優先度を付ける。",
      audience: "QA、開発チーム、PM",
      problems: ["ケース漏れ", "優先度不明", "前提データ不備"],
      goals: ["必須ケースの明確化", "前提データと環境の定義", "優先度付け"],
      differentiators: ["スモーク優先リスト", "前提データチェック"],
      scope: ["正常系", "主要異常系", "前提データ・環境"],
      constraints: ["テスト時間は1日以内", "主要ブラウザ2種のみ"],
      timeline: "今週のデプロイ前",
      successCriteria: ["スモークケース5〜10件", "前提データ/環境が明確"],
      uniqueEdge: "短時間で漏れに強い最小セットを作る練習",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["ケース一覧", "優先度タグ"],
    },
    mode: "guided",
    kickoffPrompt: "あなたはQA/PMとして新機能のテストケースを作成します。正常系と主要な異常系を洗い出し、前提データと環境を明記してください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "basic-test-m1", title: "正常系と主要なユーザーフローを列挙する", order: 1 },
      { id: "basic-test-m2", title: "主要な異常系と境界を決める", order: 2 },
      { id: "basic-test-m3", title: "前提データ・環境・優先度を整理する", order: 3 },
    ],
    supplementalInfo: "カバレッジを意識しつつ、時間制約に収まる最小セットを優先してください。",
  },
  {
    id: "challenge-project-rescue",
    title: "遅延プロジェクト立て直し (チャレンジ)",
    discipline: "CHALLENGE",
    description: "遅延しているプロジェクトでスコープ再交渉とリカバリ計画を短時間でまとめる。",
    product: {
      name: "リカバリプラン",
      summary: "納期リスクを抑えつつ、価値を守るための再計画を提示する。",
      audience: "経営層、プロダクトオーナー、開発リード",
      problems: ["スケジュール遅延", "スコープ肥大", "ステークホルダー不安"],
      goals: ["最小価値リリースの合意", "リカバリ計画策定", "コミュニケーション強化"],
      differentiators: ["スコープカット候補の明示", "リカバリの優先度付け"],
      scope: ["遅延要因分析", "スコープ再構成", "リカバリ計画"],
      constraints: ["納期は固定", "品質バーは下げない"],
      timeline: "2週間で方向性合意",
      successCriteria: ["MVPリリースに合意", "リスク/前提が透明化"],
      uniqueEdge: "交渉と計画立案を同時に練習",
      techStack: ["Next.js", "Tailwind", "Axum"],
      coreFeatures: ["リカバリメモ", "ステークホルダー通知"],
    },
    mode: "freeform",
    kickoffPrompt: "あなたは遅延しているプロジェクトのPM/PMOです。遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "challenge-rescue-m1", title: "遅延要因とリスクを特定する", order: 1 },
      { id: "challenge-rescue-m2", title: "スコープ再構成と優先度を決める", order: 2 },
      { id: "challenge-rescue-m3", title: "リカバリ計画とコミュニケーション案を作る", order: 3 },
    ],
    supplementalInfo: "品質バーを下げずに間に合わせる打ち手（並行作業・カット案・リソース振替）を検討してください。",
  },
  {
    id: "challenge-scope-negotiation",
    title: "スコープ／リソース交渉 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "顧客や上長とスコープ削減かリソース増加を交渉し、合意形成する。",
    product: {
      name: "交渉ブリーフィング",
      summary: "事前に代替案とインパクトを整理し、短時間で合意を目指す。",
      audience: "顧客、上長、開発リード",
      problems: ["スコープ肥大", "リソース不足", "意思決定が遅い"],
      goals: ["代替案の提示", "インパクトの明示", "合意形成"],
      differentiators: ["BATNA整理", "譲れない条件の明確化"],
      scope: ["代替案作成", "インパクト整理", "合意手順"],
      constraints: ["交渉時間30分", "現行リリース日固定"],
      timeline: "今週中に再合意",
      successCriteria: ["合意済みのスコープ or リソース調整", "合意内容が明文化"],
      uniqueEdge: "交渉準備と合意文書作成を練習",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["提案メモ", "インパクト表"],
    },
    mode: "freeform",
    kickoffPrompt: "あなたはPM/PMOとしてスコープまたはリソースの交渉を行います。代替案とインパクトを提示し、短時間で合意を得てください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "challenge-negotiation-m1", title: "譲れない条件とBATNAを整理する", order: 1 },
      { id: "challenge-negotiation-m2", title: "スコープ/リソースの代替案とインパクトをまとめる", order: 2 },
      { id: "challenge-negotiation-m3", title: "合意プロセスとステークホルダー調整を計画する", order: 3 },
    ],
    supplementalInfo: "合意後に残るリスクとフォローアップを必ず記録してください。",
  },
  {
    id: "challenge-conflict-mediation",
    title: "コンフリクト調整 (チャレンジ)",
    discipline: "CHALLENGE",
    description: "開発とQA・ビジネスの対立をファシリテートし、合意に導く。",
    product: {
      name: "調整セッション",
      summary: "論点を分解し、事実と解釈を整理して合意を形成する。",
      audience: "開発リード、QA、ビジネスオーナー",
      problems: ["優先度衝突", "品質バーの違い", "感情的な対立"],
      goals: ["論点の明確化", "合意された着地点", "フォローアクションの明記"],
      differentiators: ["事実/解釈の分離", "合意メモテンプレ"],
      scope: ["論点整理", "合意形成", "フォロー計画"],
      constraints: ["1時間以内", "主要ステークホルダー3者"],
      timeline: "今週中に解決方向性を決定",
      successCriteria: ["合意事項と決定が明文化", "フォロータスクが割り当て済み"],
      uniqueEdge: "ファシリテーションと合意文書化を練習",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["論点リスト", "合意メモ"],
    },
    mode: "freeform",
    kickoffPrompt: "あなたはPM/PMOとして対立が発生している会議をファシリテートします。論点を整理し、合意とフォローアップをまとめてください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "challenge-conflict-m1", title: "論点と事実/解釈を分けて整理する", order: 1 },
      { id: "challenge-conflict-m2", title: "合意の選択肢と条件を提示する", order: 2 },
      { id: "challenge-conflict-m3", title: "フォロータスクと担当を決める", order: 3 },
    ],
    supplementalInfo: "感情的な対立を避けるため、事実と解釈を分けて提示してください。",
  },
];

export const scenarioCatalog: ScenarioCatalogSection[] = [
  {
    discipline: "BASIC",
    title: "基礎シナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "BASIC")
      .map<ScenarioSummary>(({ id, title, description, discipline }) => ({
        id,
        title,
        description,
        discipline,
      })),
  },
  {
    discipline: "CHALLENGE",
    title: "チャレンジシナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "CHALLENGE")
      .map<ScenarioSummary>(({ id, title, description, discipline }) => ({
        id,
        title,
        description,
        discipline,
      })),
  },
];

export const defaultScenario = scenarioList[0];

export function getScenarioById(id: string | null): Scenario | undefined {
  if (!id) return undefined;
  return scenarioList.find((s) => s.id === id);
}

export function getScenarioDiscipline(id: string | null): ScenarioDiscipline | undefined {
  return getScenarioById(id)?.discipline;
}

export function getScenarioKickoff(id: string | null): string | undefined {
  return getScenarioById(id)?.kickoffPrompt;
}

export function getScenarioSummary(id: string | null): ScenarioSummary | undefined {
  const scenario = getScenarioById(id);
  if (!scenario) return undefined;
  const { discipline, description, title: scenarioTitle } = scenario;
  return { id: scenario.id, title: scenarioTitle, description, discipline };
}
