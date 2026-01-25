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

const sharedProduct: Scenario["product"] = {
  name: "在庫最適化ダッシュボード",
  summary:
    "多店舗小売向けに、在庫・発注・売上を一画面で可視化し、欠品と過剰在庫を減らすSaaS。",
  audience: "店舗マネージャー、在庫管理担当、エリア統括",
  problems: ["欠品と過剰在庫が併発", "発注が属人化", "売上予測が粗い"],
  goals: ["欠品率の低下", "在庫回転率の改善", "発注作業時間の削減"],
  differentiators: ["需要予測ベースの発注提案", "店舗別の優先度表示", "モバイル棚卸対応"],
  scope: ["在庫ダッシュボード", "発注提案", "低在庫アラート", "POS連携(読み取り)"],
  constraints: ["既存POSとの連携が必須", "3か月でβリリース"],
  timeline: "今四半期にβ、次四半期に正式版",
  successCriteria: ["β導入5社", "欠品率10%削減", "発注作業時間を30%削減"],
  uniqueEdge: "現場が5分で意思決定できるシンプルUIに特化",
  techStack: ["Next.js", "Tailwind CSS", "Axum", "PostgreSQL", "Redis"],
  coreFeatures: ["在庫ダッシュボード", "自動発注提案", "低在庫アラート", "POS連携"],
};

const scenarioList: Scenario[] = [
  {
    id: "basic-intro-alignment",
    title: "自己紹介＆期待値合わせ (基礎)",
    discipline: "BASIC",
    description: "新規プロジェクトに合流し、役割と期待値を擦り合わせる。",
    product: sharedProduct,
    mode: "guided",
    kickoffPrompt: "こんにちは！エンジニア兼デザイナーの鈴木です。よろしくお願いします。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "basic-intro-m1", title: "自己紹介と役割・責任範囲の確認", order: 1 },
      { id: "basic-intro-m2", title: "現状と優先度の擦り合わせ", order: 2 },
      { id: "basic-intro-m3", title: "ネクストアクションの決定", order: 3 },
    ],
    supplementalInfo: "時間配分（5分自己紹介/15分期待値/10分次アクション）を意識してください。",
  },
  {
    id: "basic-ticket-refine",
    title: "チケット要件整理 (基礎)",
    discipline: "BASIC",
    description: "曖昧なチケットを受入可能な形に分解し、スプリントに載せられる状態へ整理する。",
    product: sharedProduct,
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
    product: sharedProduct,
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
    product: sharedProduct,
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
    product: sharedProduct,
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
    product: sharedProduct,
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
