import type {
  RatingCriterion,
  Scenario,
  ScenarioCatalogSection,
  ScenarioDiscipline,
  ScenarioSummary,
} from "@/types/session";

// ============================================================================
// Scenario-Specific Rating Criteria
// ============================================================================

// 1. basic-intro-alignment: 自己紹介＆期待値合わせ
const introAlignmentCriteria: RatingCriterion[] = [
  {
    id: "intro-role-clarity",
    name: "役割・責任の明確化",
    weight: 25,
    description: "自分の役割と責任範囲を明確に伝え、相手の役割も確認できているか",
    scoringGuidelines: {
      excellent: "自分の役割を具体的に説明し、相手の役割・期待も確認。責任境界が明確",
      good: "役割を説明し、相手にも確認。一部曖昧な点が残る",
      needsImprovement: "自分の役割は述べたが、相手の確認が不十分",
      poor: "役割の説明が曖昧または欠如",
    },
  },
  {
    id: "intro-expectation-align",
    name: "期待値の擦り合わせ",
    weight: 25,
    description: "成功条件や優先度について相互理解を形成できているか",
    scoringGuidelines: {
      excellent: "成功条件・優先度・制約を双方で確認し、認識のズレを解消",
      good: "主要な期待値を確認。細部の擦り合わせが一部不足",
      needsImprovement: "期待値の確認を試みたが、合意形成が不十分",
      poor: "期待値の擦り合わせがほぼ行われていない",
    },
  },
  {
    id: "intro-communication",
    name: "コミュニケーション姿勢",
    weight: 25,
    description: "積極的な傾聴、適切な質問、相手への敬意を示せているか",
    scoringGuidelines: {
      excellent: "相手の発言を引用・要約し、オープンな質問で深掘り。敬意ある対話",
      good: "適切に質問し傾聴姿勢あり。一部一方的な場面も",
      needsImprovement: "質問はあるが表面的。傾聴が不足",
      poor: "一方的な発言が多く、相手の意見を引き出せていない",
    },
  },
  {
    id: "intro-next-action",
    name: "次アクションの具体性",
    weight: 25,
    description: "担当・期日を含む具体的な次ステップを合意できているか",
    scoringGuidelines: {
      excellent: "2件以上の具体的アクションを担当・期日付きで合意",
      good: "次アクションを決定。担当または期日が一部曖昧",
      needsImprovement: "次アクションに言及したが具体性に欠ける",
      poor: "次アクションが決まっていない",
    },
  },
];

// 2. basic-ticket-refine: チケット要件整理
const ticketRefineCriteria: RatingCriterion[] = [
  {
    id: "ticket-goal-clarity",
    name: "目的・ゴールの明確化",
    weight: 25,
    description: "チケットの目的とユーザー価値を明確に定義できているか",
    scoringGuidelines: {
      excellent: "ユーザーストーリー形式で目的を明文化。ビジネス価値と技術要件を紐付け",
      good: "目的を説明。ユーザー価値の記述が一部抽象的",
      needsImprovement: "目的に言及したが、ゴールが曖昧",
      poor: "目的・ゴールの定義がない",
    },
  },
  {
    id: "ticket-acceptance",
    name: "受入条件(AC)の定義",
    weight: 30,
    description: "観測可能で検証可能な受入条件を設定できているか",
    scoringGuidelines: {
      excellent: "3件以上の具体的AC。Given-When-Then形式または同等の明確さ",
      good: "ACを定義。一部が主観的または曖昧",
      needsImprovement: "ACを試みたが、検証可能性が低い",
      poor: "ACが定義されていない",
    },
  },
  {
    id: "ticket-dependency",
    name: "依存関係の整理",
    weight: 25,
    description: "技術的・チーム間の依存を特定し、担当と期日を明記できているか",
    scoringGuidelines: {
      excellent: "依存先を特定し、担当者・期日・確認方法を明記",
      good: "依存を特定。担当または期日が一部未定",
      needsImprovement: "依存に言及したが詳細が不足",
      poor: "依存関係の整理がない",
    },
  },
  {
    id: "ticket-risk",
    name: "リスクの特定",
    weight: 20,
    description: "実装上のリスクや不確実性を洗い出し、対策を検討できているか",
    scoringGuidelines: {
      excellent: "2件以上のリスクを特定し、影響と対策を記載",
      good: "リスクを特定。対策が一部曖昧",
      needsImprovement: "リスクに言及したが分析が浅い",
      poor: "リスクの検討がない",
    },
  },
];

// 3. basic-testcase-design: テストケース作成
const testcaseDesignCriteria: RatingCriterion[] = [
  {
    id: "test-normal-flow",
    name: "正常系の網羅性",
    weight: 30,
    description: "主要なユーザーフローと正常系パスを漏れなくカバーしているか",
    scoringGuidelines: {
      excellent: "主要フローを網羅。ユーザーシナリオに基づき論理的に構成",
      good: "正常系をカバー。一部のフローが欠落",
      needsImprovement: "基本的なケースのみ。網羅性が不足",
      poor: "正常系の洗い出しが不十分",
    },
  },
  {
    id: "test-edge-cases",
    name: "異常系・境界値の考慮",
    weight: 30,
    description: "エラーケース、境界値、エッジケースを適切に洗い出しているか",
    scoringGuidelines: {
      excellent: "境界値・エラー・権限・並行処理など多角的に検討",
      good: "主要な異常系をカバー。一部のエッジケースが欠落",
      needsImprovement: "異常系に言及したが体系的でない",
      poor: "異常系の検討がほぼない",
    },
  },
  {
    id: "test-precondition",
    name: "前提条件の明確化",
    weight: 20,
    description: "テストデータ、環境、前提条件を明記しているか",
    scoringGuidelines: {
      excellent: "各ケースにテストデータ・環境・初期状態を明記",
      good: "前提条件を記載。一部のケースで不足",
      needsImprovement: "前提条件の記述が断片的",
      poor: "前提条件の記載がない",
    },
  },
  {
    id: "test-priority",
    name: "優先度と効率性",
    weight: 20,
    description: "時間制約を考慮し、リスクベースで優先順位付けできているか",
    scoringGuidelines: {
      excellent: "リスク・頻度・影響度で優先順位付け。最小セットを意識",
      good: "優先度を設定。根拠が一部曖昧",
      needsImprovement: "優先度に言及したが基準が不明確",
      poor: "優先順位付けがない",
    },
  },
];

// 4. challenge-project-rescue: 遅延プロジェクト立て直し
const projectRescueCriteria: RatingCriterion[] = [
  {
    id: "rescue-root-cause",
    name: "遅延要因の分析",
    weight: 25,
    description: "遅延の根本原因を構造的に分析し、事実ベースで整理できているか",
    scoringGuidelines: {
      excellent: "複数の遅延要因を特定し、技術・プロセス・人的要因を分類。優先度付け",
      good: "主要な遅延要因を特定。分析が一部表面的",
      needsImprovement: "遅延要因に言及したが構造的分析が不足",
      poor: "遅延要因の分析がない",
    },
  },
  {
    id: "rescue-scope-replan",
    name: "スコープ再構成",
    weight: 25,
    description: "優先度に基づきスコープを再定義し、トレードオフを明示できているか",
    scoringGuidelines: {
      excellent: "Must/Should/Could/Won'tで分類。各項目のインパクトと根拠を明示",
      good: "スコープを再検討。優先度の根拠が一部曖昧",
      needsImprovement: "スコープ調整に言及したが具体性に欠ける",
      poor: "スコープ再構成の検討がない",
    },
  },
  {
    id: "rescue-recovery-plan",
    name: "リカバリ計画の具体性",
    weight: 30,
    description: "実行可能なリカバリ計画を期日・担当・マイルストーン付きで作成できているか",
    scoringGuidelines: {
      excellent: "週次マイルストーン、担当、リスク対策を含む詳細計画",
      good: "リカバリ計画を作成。一部の詳細が不足",
      needsImprovement: "計画の方向性のみ。実行可能性が低い",
      poor: "リカバリ計画がない",
    },
  },
  {
    id: "rescue-stakeholder",
    name: "ステークホルダー対応",
    weight: 20,
    description: "関係者への説明・合意形成の計画を立てられているか",
    scoringGuidelines: {
      excellent: "関係者別のコミュニケーション計画。説明資料の構成まで検討",
      good: "ステークホルダー対応を検討。一部が抽象的",
      needsImprovement: "対応の必要性に言及したが計画がない",
      poor: "ステークホルダー対応の検討がない",
    },
  },
];

// 5. challenge-scope-negotiation: スコープ／リソース交渉
const scopeNegotiationCriteria: RatingCriterion[] = [
  {
    id: "negotiate-preparation",
    name: "交渉準備と分析",
    weight: 25,
    description: "譲れない条件、BATNA、相手の立場を事前に整理できているか",
    scoringGuidelines: {
      excellent: "BATNA・ZOPA・相手の利害を明確に整理。交渉戦略を立案",
      good: "主要な条件を整理。相手の立場の分析が一部不足",
      needsImprovement: "条件を列挙したが戦略的な整理がない",
      poor: "交渉準備がほぼない",
    },
  },
  {
    id: "negotiate-alternatives",
    name: "代替案の提示",
    weight: 30,
    description: "複数の選択肢をインパクト・リスク付きで提示できているか",
    scoringGuidelines: {
      excellent: "3案以上を提示。各案のメリット・デメリット・インパクトを定量化",
      good: "複数案を提示。インパクトの説明が一部定性的",
      needsImprovement: "代替案を出したが比較が不十分",
      poor: "代替案の提示がない",
    },
  },
  {
    id: "negotiate-persuasion",
    name: "説得力と論理性",
    weight: 25,
    description: "データや根拠に基づき、相手を納得させる説明ができているか",
    scoringGuidelines: {
      excellent: "データ・事例・論理で説得。相手の懸念に先回りして対応",
      good: "根拠を示して説明。一部の論点で深掘りが不足",
      needsImprovement: "説明はあるが根拠が弱い",
      poor: "説得力のある説明がない",
    },
  },
  {
    id: "negotiate-agreement",
    name: "合意形成と記録",
    weight: 20,
    description: "合意内容を明確化し、残リスクとフォローアップを記録できているか",
    scoringGuidelines: {
      excellent: "合意内容を文書化。残リスク・フォローアップ・次回確認日を明記",
      good: "合意を確認。一部の詳細が未定",
      needsImprovement: "合意に言及したが記録が曖昧",
      poor: "合意形成・記録がない",
    },
  },
];

// 6. challenge-conflict-mediation: コンフリクト調整
const conflictMediationCriteria: RatingCriterion[] = [
  {
    id: "conflict-fact-opinion",
    name: "事実と解釈の分離",
    weight: 30,
    description: "対立の論点を事実と解釈に分けて整理できているか",
    scoringGuidelines: {
      excellent: "論点を列挙し、各々について事実・解釈・感情を明確に分類",
      good: "事実と意見を分けて整理。一部の論点で混在",
      needsImprovement: "分離を試みたが体系的でない",
      poor: "事実と解釈の分離がない",
    },
  },
  {
    id: "conflict-neutrality",
    name: "中立性の維持",
    weight: 25,
    description: "特定の立場に偏らず、公平なファシリテーションができているか",
    scoringGuidelines: {
      excellent: "全員の意見を引き出し、公平に扱う。感情的な発言も受け止めつつ論点に戻す",
      good: "概ね中立的。一部で特定の立場に寄った場面あり",
      needsImprovement: "中立を意識したが偏りが目立つ",
      poor: "特定の立場に偏った進行",
    },
  },
  {
    id: "conflict-consensus",
    name: "合意形成力",
    weight: 25,
    description: "対立を解消し、全員が納得できる着地点を導けているか",
    scoringGuidelines: {
      excellent: "Win-Winの解決策を導出。各者の懸念を解消し、全員がコミット",
      good: "合意を形成。一部に不満が残る可能性",
      needsImprovement: "妥協点を探したが合意が不安定",
      poor: "合意に至っていない",
    },
  },
  {
    id: "conflict-followup",
    name: "フォローアップ計画",
    weight: 20,
    description: "合意後のタスク・担当・確認方法を明確にできているか",
    scoringGuidelines: {
      excellent: "タスク・担当・期日・次回確認日を明記。再発防止策も検討",
      good: "フォローアップを設定。一部詳細が不足",
      needsImprovement: "フォローアップに言及したが曖昧",
      poor: "フォローアップ計画がない",
    },
  },
];

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
    evaluationCriteria: introAlignmentCriteria,
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
    evaluationCriteria: ticketRefineCriteria,
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
    evaluationCriteria: testcaseDesignCriteria,
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
    evaluationCriteria: projectRescueCriteria,
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
    evaluationCriteria: scopeNegotiationCriteria,
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
    evaluationCriteria: conflictMediationCriteria,
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
