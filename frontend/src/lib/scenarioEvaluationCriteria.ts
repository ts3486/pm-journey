import type { RatingCriterion, Scenario, ScenarioEvaluationCriteriaConfig } from "@/types";

export type ScenarioEvaluationCategoryKey = keyof ScenarioEvaluationCriteriaConfig;

type ScenarioEvaluationCategoryTemplate = {
  key: ScenarioEvaluationCategoryKey;
  label: string;
  hint: string;
  evaluationFocus: string;
  scoringGuidelines: RatingCriterion["scoringGuidelines"];
  defaultCriteria: string[];
};

const categoryTemplates: ScenarioEvaluationCategoryTemplate[] = [
  {
    key: "softSkills",
    label: "基礎ソフトスキル",
    hint: "日常的なPMコミュニケーション、合意形成、実行計画の品質を評価します。",
    evaluationFocus: "基本的なコミュニケーション品質（明確さ・配慮・合意形成）が担保されているか",
    scoringGuidelines: {
      excellent: "要点を構造化し、合意事項と次アクションまで具体化している",
      good: "主要な要点は明確で実務に使えるが、具体性に一部不足がある",
      needsImprovement: "方向性はあるが、説明の明確さや合意形成が不足している",
      poor: "説明が曖昧で、必要な合意や実行計画につながっていない",
    },
    defaultCriteria: ["論点整理の明確さ", "相手視点のコミュニケーション", "合意形成と意思決定", "次アクションの具体性"],
  },
  {
    key: "testCases",
    label: "テストケース作成",
    hint: "テスト観点の網羅性・再現性・優先順位付けの品質を評価します。",
    evaluationFocus: "再現可能で抜け漏れのないテスト観点を示せているか",
    scoringGuidelines: {
      excellent: "正常系・異常系・境界値・前提条件まで含めて具体化している",
      good: "主要なテスト観点を網羅しているが、一部の条件詳細が不足している",
      needsImprovement: "観点はあるが、網羅性または再現性に不足がある",
      poor: "観点整理が不十分で、抜け漏れが多い",
    },
    defaultCriteria: [
      "正常系シナリオの網羅性",
      "異常系・境界値の網羅性",
      "前提条件・テストデータの明確さ",
      "優先順位と実行効率",
    ],
  },
  {
    key: "requirementDefinition",
    label: "要件定義",
    hint: "要件の明確性、検証可能性、スコープ境界の定義品質を評価します。",
    evaluationFocus: "要件の明確性・検証可能性・スコープ境界を定義できているか",
    scoringGuidelines: {
      excellent: "目的・受入条件・非対象・制約を整合的に整理し、検証可能な要件になっている",
      good: "主要要件は整理されているが、検証性または境界定義に一部不足がある",
      needsImprovement: "要件には触れているが曖昧さや抜け漏れが残る",
      poor: "要件定義として必要な構造が不足し、実装可能な形になっていない",
    },
    defaultCriteria: [
      "要件の目的・背景の明確さ",
      "受入条件の検証可能性",
      "スコープ境界と制約の整理",
      "不明点・リスクと確認計画",
    ],
  },
  {
    key: "incidentResponse",
    label: "障害対応",
    hint: "初動品質、影響評価、連絡体制、復旧計画の実行可能性を評価します。",
    evaluationFocus: "障害対応の初動品質（影響評価・優先度判断・連絡体制）が適切か",
    scoringGuidelines: {
      excellent: "影響範囲、重大度、初動、連絡、復旧計画まで一貫して整理されている",
      good: "主要要素は整理されているが、判断根拠や連絡の具体性に一部不足がある",
      needsImprovement: "対応方針はあるが、影響評価・優先度・連絡体制のいずれかが曖昧",
      poor: "初動整理が不足し、優先度判断や連絡方針が不明確",
    },
    defaultCriteria: [
      "影響範囲と重大度の評価",
      "初動対応と優先度判断",
      "連絡・エスカレーションの適切さ",
      "復旧計画と再発防止の具体性",
    ],
  },
  {
    key: "businessExecution",
    label: "事業推進",
    hint: "意思決定の妥当性、トレードオフ整理、合意形成、実行計画を評価します。",
    evaluationFocus: "事業推進に必要な意思決定品質（トレードオフ整理・根拠・合意）が担保されているか",
    scoringGuidelines: {
      excellent: "比較軸と根拠が明確で、合意事項と次アクションまで実行可能な形で整理されている",
      good: "意思決定の方向性と合意は明確だが、比較根拠またはフォローアップが不足している",
      needsImprovement: "意思決定には触れているが、比較軸や根拠が弱く合意内容が曖昧",
      poor: "トレードオフ整理や合意形成が不十分で実行計画につながらない",
    },
    defaultCriteria: [
      "目的に対する意思決定の妥当性",
      "トレードオフと根拠の明確さ",
      "ステークホルダー合意形成",
      "実行計画とフォローアップ",
    ],
  },
];

const categoryTemplateMap = new Map(categoryTemplates.map((template) => [template.key, template]));

const requirementDefinitionScenarioIds = new Set([
  "basic-requirement-definition-doc",
  "basic-requirement-hearing-plan",
  "basic-requirement-user-story",
  "basic-requirement-nfr",
  "basic-requirement-priority-matrix",
  "basic-requirement-risk-check",
  "basic-requirement-consensus",
]);

const incidentResponseScenarioIds = new Set([
  "coming-incident-response",
  "coming-incident-triage-escalation",
  "coming-postmortem-followup",
]);

const businessExecutionScenarioIds = new Set([
  "coming-priority-tradeoff-workshop",
  "coming-stakeholder-negotiation",
  "coming-decision-log-alignment",
]);

const normalizeCriteriaLine = (line: string) =>
  line
    .trim()
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();

const normalizeCriteriaList = (criteria: string[] | undefined, fallback: string[]) => {
  const cleaned = (criteria ?? [])
    .map((criterion) => normalizeCriteriaLine(criterion))
    .filter((criterion) => criterion.length > 0);
  const unique = cleaned.filter((criterion, index) => cleaned.indexOf(criterion) === index);
  return unique.length > 0 ? unique : [...fallback];
};

const distributeWeights = (count: number): number[] => {
  if (count <= 0) return [];
  const base = Math.floor(100 / count);
  const weights = Array(count).fill(base);
  let remainder = 100 - base * count;
  let index = 0;
  while (remainder > 0 && index < weights.length) {
    weights[index] += 1;
    remainder -= 1;
    index += 1;
  }
  return weights;
};

const buildDefaultScenarioEvaluationCriteriaConfig = (): ScenarioEvaluationCriteriaConfig => ({
  softSkills: [...(categoryTemplateMap.get("softSkills")?.defaultCriteria ?? [])],
  testCases: [...(categoryTemplateMap.get("testCases")?.defaultCriteria ?? [])],
  requirementDefinition: [...(categoryTemplateMap.get("requirementDefinition")?.defaultCriteria ?? [])],
  incidentResponse: [...(categoryTemplateMap.get("incidentResponse")?.defaultCriteria ?? [])],
  businessExecution: [...(categoryTemplateMap.get("businessExecution")?.defaultCriteria ?? [])],
});

export const scenarioEvaluationCategorySections = categoryTemplates.map((template) => ({
  key: template.key,
  label: template.label,
  hint: template.hint,
  placeholder: template.defaultCriteria.join("\n"),
}));

export const createDefaultScenarioEvaluationCriteriaConfig = (): ScenarioEvaluationCriteriaConfig =>
  buildDefaultScenarioEvaluationCriteriaConfig();

export const normalizeScenarioEvaluationCriteriaConfig = (
  config?: Partial<ScenarioEvaluationCriteriaConfig>
): ScenarioEvaluationCriteriaConfig => {
  const defaults = buildDefaultScenarioEvaluationCriteriaConfig();
  return {
    softSkills: normalizeCriteriaList(config?.softSkills, defaults.softSkills),
    testCases: normalizeCriteriaList(config?.testCases, defaults.testCases),
    requirementDefinition: normalizeCriteriaList(config?.requirementDefinition, defaults.requirementDefinition),
    incidentResponse: normalizeCriteriaList(config?.incidentResponse, defaults.incidentResponse),
    businessExecution: normalizeCriteriaList(config?.businessExecution, defaults.businessExecution),
  };
};

export const scenarioCriteriaListToTextareaValue = (criteria: string[]): string => criteria.join("\n");

export const parseScenarioCriteriaTextareaValue = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => normalizeCriteriaLine(line))
    .filter((line) => line.length > 0);

export const serializeScenarioEvaluationCriteriaConfig = (
  config: ScenarioEvaluationCriteriaConfig
): string => JSON.stringify(config);

export const resolveScenarioEvaluationCategoryKey = (
  scenario: Pick<Scenario, "id" | "scenarioType">
): ScenarioEvaluationCategoryKey => {
  if (scenario.scenarioType === "test-cases") return "testCases";
  if (requirementDefinitionScenarioIds.has(scenario.id)) return "requirementDefinition";
  if (incidentResponseScenarioIds.has(scenario.id)) return "incidentResponse";
  if (businessExecutionScenarioIds.has(scenario.id)) return "businessExecution";
  return "softSkills";
};

export const buildScenarioEvaluationCriteria = ({
  scenario,
  scenarioEvaluationCriteria,
  fallbackCriteria,
}: {
  scenario: Pick<Scenario, "id" | "scenarioType">;
  scenarioEvaluationCriteria?: Partial<ScenarioEvaluationCriteriaConfig>;
  fallbackCriteria: RatingCriterion[];
}): RatingCriterion[] => {
  const normalizedConfig = normalizeScenarioEvaluationCriteriaConfig(scenarioEvaluationCriteria);
  const categoryKey = resolveScenarioEvaluationCategoryKey(scenario);
  const template = categoryTemplateMap.get(categoryKey);
  const criteriaNames = normalizedConfig[categoryKey];
  if (!template || criteriaNames.length === 0) {
    return fallbackCriteria;
  }

  const weights = distributeWeights(criteriaNames.length);
  return criteriaNames.map((name, index) => ({
    id: `${scenario.id}-${categoryKey}-criterion-${index + 1}`,
    name,
    weight: weights[index] ?? 100,
    description: `${name}について、${template.evaluationFocus}を評価します。`,
    scoringGuidelines: template.scoringGuidelines,
  }));
};
