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
    id: "pm-attendance-modernization",
    title: "勤怠アプリ刷新 (PM)",
    discipline: "PM",
    description: "打刻漏れを減らし、モバイルから使いやすい勤怠体験を短期で立ち上げる。",
    product: {
      name: "モバイル勤怠アプリ",
      summary: "現場従業員が毎日使う勤怠アプリを刷新し、打刻漏れを減らす。",
      audience: "社内従業員・現場マネージャー・人事労務チーム",
      problems: ["旧勤怠システムの打刻漏れ", "モバイル非対応", "ヘルプデスク問い合わせの増加"],
      goals: ["打刻漏れ 50%削減", "モバイル完了率向上", "6ヶ月で要件確定と展開準備"],
      differentiators: ["現場主導のフィードバックサイクル", "評価カテゴリと連動した進捗可視化"],
      scope: ["勤怠打刻", "日次/週次エラー通知", "基本レポート"],
      constraints: ["社内ネットワーク優先", "個人情報の社外送信なし", "評価カテゴリを明示"],
      timeline: "6ヶ月で社内ローンチ",
      successCriteria: ["評価70点以上でGO判断", "打刻エラー問い合わせ30%減"],
      uniqueEdge: "PM視点の要件整理と評価フレームが組み込まれている",
      techStack: ["Next.js", "Tailwind CSS", "Axum"],
      coreFeatures: ["勤怠打刻", "エラー通知", "シンプルなレポート"],
    },
    mode: "freeform",
    kickoffPrompt:
      "あなたはPMとして勤怠アプリ刷新をリードします。現状課題と成功条件を整理し、AIエンジニア/デザイナーの鈴木と対話しながら要件を詰めてください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pm-attendance-m1", title: "課題と現状整理を行う", order: 1 },
      { id: "pm-attendance-m2", title: "成功条件とKPIを定義する", order: 2 },
      { id: "pm-attendance-m3", title: "主要リスクと前提を洗い出す", order: 3 },
    ],
    supplementalInfo: "勤怠打刻漏れの要因（モバイル/UX/ネットワーク）を重点的に整理し、評価基準70点以上を目指してください。",
  },
  {
    id: "pm-mobile-checkin",
    title: "外出先打刻モバイル強化 (PM)",
    discipline: "PM",
    description: "フィールドワーカー向けに電波が弱い環境でも確実に打刻できる体験を設計する。",
    product: {
      name: "フィールド打刻アプリ",
      summary: "不安定な回線でも確実に打刻を記録し、後同期する仕組みを提供。",
      audience: "現場スタッフ、エリアマネージャー",
      problems: ["圏外で打刻が失敗する", "後からの修正が煩雑", "管理者への報告遅延"],
      goals: ["オフライン打刻100%保持", "同期失敗を0件に", "管理者への通知を即時化"],
      differentiators: ["オフラインキュー設計", "モバイル優先UI", "管理者通知連携"],
      scope: ["打刻", "後同期", "簡易通知"],
      constraints: ["端末認証が必要", "位置情報の取り扱いに配慮"],
      timeline: "3ヶ月でパイロット開始",
      successCriteria: ["同期成功率99%以上", "報告遅延50%削減"],
      uniqueEdge: "オフラインファースト設計を前提にしたPMプラクティス",
      techStack: ["Next.js", "Tailwind", "Axum"],
      coreFeatures: ["打刻キュー", "同期リトライ", "通知"],
    },
    mode: "freeform",
    kickoffPrompt: "フィールド環境での確実な打刻体験をPMとして設計してください。オフライン前提で課題とリスクを洗い出してください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pm-mobile-m1", title: "オフライン要件と同期方針を決める", order: 1 },
      { id: "pm-mobile-m2", title: "通知/失敗リカバリ設計を固める", order: 2 },
      { id: "pm-mobile-m3", title: "リスクとテレメトリ計画を整理する", order: 3 },
    ],
    supplementalInfo: "電波不安定環境での再送/リトライ、位置情報の取り扱い、管理者通知を考慮してください。",
  },
  {
    id: "pm-shift-visibility",
    title: "シフト可視化とアラート (PM)",
    discipline: "PM",
    description: "シフト欠員を早期に検知し、現場へのリマインドを自動化する。",
    product: {
      name: "シフト可視化ダッシュボード",
      summary: "欠員や被りを早期に検知し、現場と管理者へ通知する。",
      audience: "シフト管理者、店長、スタッフ",
      problems: ["欠員が当日まで気づかれない", "通知が属人的", "優先度の判断が遅い"],
      goals: ["欠員検知の前倒し", "通知自動化", "優先度付きリマインド"],
      differentiators: ["優先度ロジック", "シンプルな通知UI"],
      scope: ["欠員検知", "通知", "簡易ダッシュボード"],
      constraints: ["個人情報を最小限に", "モバイル閲覧最適化"],
      timeline: "2ヶ月でパイロット",
      successCriteria: ["欠員対応リードタイム30%短縮", "通知到達率95%"],
      uniqueEdge: "シンプルなUIと優先度ロジックの両立",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["通知", "優先度", "ダッシュボード"],
    },
    mode: "freeform",
    kickoffPrompt: "シフト欠員を早期に検知し通知するシステムをPMとして設計してください。優先度と通知設計に着目してください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pm-shift-m1", title: "欠員検知ロジックとデータ要件を定義する", order: 1 },
      { id: "pm-shift-m2", title: "通知優先度と運用ルールを設計する", order: 2 },
      { id: "pm-shift-m3", title: "ダッシュボード最小機能を決める", order: 3 },
    ],
    supplementalInfo: "モバイル閲覧最適化と個人情報最小化を意識してください。",
  },
  {
    id: "pmo-portfolio-hygiene",
    title: "プロジェクト運営ガバナンス (PMO)",
    discipline: "PMO",
    description: "複数プロジェクトの健全性を可視化し、リスクと前提を統制する。",
    product: {
      name: "PMO ハブ",
      summary: "ポートフォリオ横断の進行状況とリスクを共通フォーマットで集約する。",
      audience: "経営層、PM、PMOチーム",
      problems: ["プロジェクト間で報告粒度がバラバラ", "リスク共有が遅い", "優先度衝突の調整遅延"],
      goals: ["共通フォーマット定着", "リスク検知の前倒し", "判断材料の即時化"],
      differentiators: ["評価カテゴリと連動したレビュー指標", "オンライン/オフライン両対応の記録"],
      scope: ["ステータス更新テンプレート", "リスク/課題トラッキング", "エスカレーション導線"],
      constraints: ["HTTPS必須", "個別プロジェクトの機密保持", "更新頻度を週次で固定"],
      timeline: "3ヶ月で全プロジェクトに展開",
      successCriteria: ["週次レポート遵守率90%", "重大リスクの報告リードタイム50%短縮"],
      uniqueEdge: "PMOらしい統制と透明性を両立する仕組み",
      techStack: ["Next.js", "Axum", "TanStack Query"],
      coreFeatures: ["ステータス入力", "リスク/前提整理", "評価サマリ"],
    },
    mode: "freeform",
    kickoffPrompt:
      "あなたはPMOとして複数プロジェクトをレビューします。リスクと前提を整理し、判断材料を揃えてください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pmo-hygiene-m1", title: "共通フォーマットと更新リズムを定義する", order: 1 },
      { id: "pmo-hygiene-m2", title: "リスク/前提の収集とエスカレーション基準をまとめる", order: 2 },
      { id: "pmo-hygiene-m3", title: "レビュー指標と可視化要件を決める", order: 3 },
    ],
    supplementalInfo: "HTTPS必須・機密保持に留意しつつ、週次遵守とリスク検知前倒しを狙ってください。",
  },
  {
    id: "pmo-risk-register",
    title: "リスク・前提レジスター整備 (PMO)",
    discipline: "PMO",
    description: "全プロジェクト共通のリスク/前提管理を標準化し、早期エスカレーションを仕組み化する。",
    product: {
      name: "PMO リスクレジスター",
      summary: "リスクと前提を一元管理し、重大度に応じて自動エスカレーションする。",
      audience: "PMOチーム、PM、経営層",
      problems: ["重大リスクの報告遅れ", "前提の共有不足", "対応優先度が不明確"],
      goals: ["重大リスクの即時共有", "前提の明文化", "エスカレーション基準統一"],
      differentiators: ["重大度評価ロジック", "通知と履歴の一元管理"],
      scope: ["登録/更新", "重大度評価", "通知/エスカレーション"],
      constraints: ["HTTPS必須", "監査ログ保持"],
      timeline: "6週間で標準版リリース",
      successCriteria: ["重大リスク報告リードタイム50%短縮", "前提共有率向上"],
      uniqueEdge: "PMO観点の標準化と透明性の両立",
      techStack: ["Next.js", "Axum"],
      coreFeatures: ["リスク登録", "前提共有", "通知"],
    },
    mode: "freeform",
    kickoffPrompt: "PMOとしてリスク/前提を標準化するレジスターを設計してください。重大度評価とエスカレーション基準に焦点を当ててください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pmo-register-m1", title: "重大度評価ロジックを定義する", order: 1 },
      { id: "pmo-register-m2", title: "通知/エスカレーション導線を設計する", order: 2 },
      { id: "pmo-register-m3", title: "監査ログとデータ保持方針を整理する", order: 3 },
    ],
    supplementalInfo: "HTTPSと監査ログ保持を前提に、重大リスク即時共有を実現してください。",
  },
  {
    id: "pmo-portfolio-ops",
    title: "ポートフォリオ運営リズム (PMO)",
    discipline: "PMO",
    description: "全プロジェクトのステータス更新を週次で揃え、レビュー材料を共通化する。",
    product: {
      name: "ポートフォリオ運営ハブ",
      summary: "週次のステータス、リスク、意思決定を共通フォーマットで収集する。",
      audience: "経営層、PMO、PM",
      problems: ["報告の粒度が不揃い", "レビュー材料が不足", "更新が遅れる"],
      goals: ["週次更新の遵守", "レビュー材料の即時化", "リスク/決定の可視化"],
      differentiators: ["共通フォーマット", "自動リマインド", "軽量ダッシュボード"],
      scope: ["週次入力", "リマインド通知", "レビュー用ダッシュボード"],
      constraints: ["HTTPS必須", "プロジェクト別アクセス制御は後続"],
      timeline: "1ヶ月で試行開始",
      successCriteria: ["週次遵守率90%", "レビュー準備時間30%削減"],
      uniqueEdge: "PMOらしい運営リズムを素早く定着させる",
      techStack: ["Next.js", "Tailwind"],
      coreFeatures: ["入力テンプレ", "通知", "ダッシュボード"],
    },
    mode: "freeform",
    kickoffPrompt: "PMOとして週次のポートフォリオ運営リズムを設計してください。共通フォーマットと通知を意識してください。",
    evaluationCriteria: evaluationCriteria.map((c) => ({ ...c })),
    passingScore: 70,
    missions: [
      { id: "pmo-ops-m1", title: "週次入力テンプレと必須項目を決める", order: 1 },
      { id: "pmo-ops-m2", title: "リマインド通知と遅延検知の設計を行う", order: 2 },
      { id: "pmo-ops-m3", title: "ダッシュボード表示要件とアクセス制御方針を整理する", order: 3 },
    ],
    supplementalInfo: "HTTPS必須・アクセス制御後続を意識しつつ、更新遵守率を上げる仕組みを優先してください。",
  },
];

export const scenarioCatalog: ScenarioCatalogSection[] = [
  {
    discipline: "PM",
    title: "PM シナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "PM")
      .map<ScenarioSummary>(({ id, title, description, discipline }) => ({
        id,
        title,
        description,
        discipline,
      })),
  },
  {
    discipline: "PMO",
    title: "PMO シナリオ",
    scenarios: scenarioList
      .filter((s) => s.discipline === "PMO")
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
