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
