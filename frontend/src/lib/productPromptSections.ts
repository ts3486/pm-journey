import { getScenarioDiscipline } from "@/config/scenarios";
import type { ProductConfig, Scenario } from "@/types";

export type PromptSectionKey =
  | "context"
  | "usersAndProblems"
  | "goalsAndSuccess"
  | "scopeAndFeatures"
  | "constraintsAndTimeline"
  | "differentiation";

export type PromptSections = Record<PromptSectionKey, string>;

export type PromptSectionConfig = {
  key: PromptSectionKey;
  heading: string;
  label: string;
  hint: string;
  placeholder: string;
  aliases: string[];
};

export const promptSectionConfigs: PromptSectionConfig[] = [
  {
    key: "context",
    heading: "プロジェクト背景",
    label: "1. プロジェクト背景",
    hint: "product.name / product.summary / product.audience の前提をここにまとめます。",
    placeholder: "- このプロダクトが解く領域\n- 主な対象ユーザー\n- 今回の文脈",
    aliases: ["プロジェクトコンテキスト", "背景", "Project Context"],
  },
  {
    key: "usersAndProblems",
    heading: "対象ユーザーと課題",
    label: "2. 対象ユーザーと課題",
    hint: "product.audience / product.problems に対応する内容を書きます。",
    placeholder: "- 誰のどの課題が中心か\n- いま困っている業務や状況",
    aliases: ["ターゲットと課題", "Users & Problems"],
  },
  {
    key: "goalsAndSuccess",
    heading: "目標と成功条件",
    label: "3. 目標と成功条件",
    hint: "product.goals / product.successCriteria を中心に記載します。",
    placeholder: "- 何を達成したいか\n- 成功をどう判断するか",
    aliases: ["ゴールと成功条件", "Goals & Success"],
  },
  {
    key: "scopeAndFeatures",
    heading: "スコープと主要機能",
    label: "4. スコープと主要機能",
    hint: "product.scope / product.coreFeatures をざっくり整理します。",
    placeholder: "- 今回扱う範囲\n- 重要な機能や観点",
    aliases: ["範囲と機能", "Scope & Features"],
  },
  {
    key: "constraintsAndTimeline",
    heading: "制約とタイムライン",
    label: "5. 制約とタイムライン",
    hint: "product.constraints / product.timeline を簡潔に書きます。",
    placeholder: "- 守るべき制約\n- 期限やマイルストーン",
    aliases: ["制約とスケジュール", "Constraints & Timeline"],
  },
  {
    key: "differentiation",
    heading: "差別化ポイントと補足",
    label: "6. 差別化ポイントと補足",
    hint: "product.differentiators / product.uniqueEdge + 追加メモを記載します。",
    placeholder: "- 競合との差別化\n- 議論で重視したい追加情報",
    aliases: ["差別化要素", "補足", "Differentiation & Notes", "追加メモ"],
  },
];

const listToBullets = (items: string[]) =>
  items
    .filter((item) => item.trim().length > 0)
    .map((item) => `- ${item}`)
    .join("\n");

const nonEmpty = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const normalizeList = (items?: string[]) =>
  (items ?? [])
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const choose = (primary?: string, fallback?: string) => nonEmpty(primary) ?? nonEmpty(fallback) ?? "";

const chooseList = (primary?: string[], fallback?: string[]) => {
  const normalizedPrimary = normalizeList(primary);
  if (normalizedPrimary.length > 0) return normalizedPrimary;
  return normalizeList(fallback);
};

export const createEmptyPromptSections = (): PromptSections => ({
  context: "",
  usersAndProblems: "",
  goalsAndSuccess: "",
  scopeAndFeatures: "",
  constraintsAndTimeline: "",
  differentiation: "",
});

export const normalizePrompt = (value?: string) => (value ?? "").trim();

const resolveSectionKey = (heading: string): PromptSectionKey | undefined => {
  const normalizedHeading = heading.trim().toLowerCase();
  return promptSectionConfigs.find(
    (section) =>
      section.heading.toLowerCase() === normalizedHeading ||
      section.aliases.some((alias) => alias.toLowerCase() === normalizedHeading)
  )?.key;
};

export const parsePromptSections = (prompt: string): PromptSections => {
  const sections = createEmptyPromptSections();
  const buckets: Record<PromptSectionKey, string[]> = {
    context: [],
    usersAndProblems: [],
    goalsAndSuccess: [],
    scopeAndFeatures: [],
    constraintsAndTimeline: [],
    differentiation: [],
  };
  const fallbackLines: string[] = [];
  let currentSection: PromptSectionKey | null = null;

  for (const line of prompt.split(/\r?\n/)) {
    const headingMatch = line.match(/^##\s+(.+?)\s*$/);
    if (headingMatch) {
      const nextSection = resolveSectionKey(headingMatch[1]);
      if (nextSection) {
        currentSection = nextSection;
        continue;
      }
      currentSection = null;
      fallbackLines.push(line);
      continue;
    }

    if (currentSection) {
      buckets[currentSection].push(line);
      continue;
    }
    fallbackLines.push(line);
  }

  for (const section of promptSectionConfigs) {
    sections[section.key] = buckets[section.key].join("\n").trim();
  }

  const fallback = fallbackLines.join("\n").trim();
  if (fallback) {
    sections.differentiation = sections.differentiation
      ? `${sections.differentiation}\n\n${fallback}`.trim()
      : fallback;
  }

  return sections;
};

export const buildPromptFromSections = (sections: PromptSections): string =>
  promptSectionConfigs
    .map((section) => {
      const body = sections[section.key].trim();
      if (!body) return null;
      return `## ${section.heading}\n${body}`;
    })
    .filter((section): section is string => Boolean(section))
    .join("\n\n");

type ProductSnapshot = Pick<
  ProductConfig,
  | "name"
  | "summary"
  | "audience"
  | "problems"
  | "goals"
  | "differentiators"
  | "scope"
  | "constraints"
  | "timeline"
  | "successCriteria"
  | "uniqueEdge"
  | "techStack"
  | "coreFeatures"
  | "productPrompt"
>;

export const buildDefaultSectionsFromConfig = (config: ProductSnapshot): PromptSections => {
  const contextLines = [
    nonEmpty(config.name) ? `- プロダクト名: ${config.name.trim()}` : "",
    nonEmpty(config.summary) ? `- 概要: ${config.summary.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const usersAndProblemsLines = [
    nonEmpty(config.audience) ? `- 対象ユーザー: ${config.audience.trim()}` : "",
    listToBullets(config.problems ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  const goalsAndSuccessLines = [
    listToBullets(config.goals ?? []),
    listToBullets(config.successCriteria ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  const scopeAndFeaturesLines = [
    listToBullets(config.scope ?? []),
    listToBullets(config.coreFeatures ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  const constraintsAndTimelineLines = [
    nonEmpty(config.timeline) ? `- タイムライン: ${config.timeline}` : "",
    listToBullets(config.constraints ?? []),
  ]
    .filter(Boolean)
    .join("\n");

  const differentiationLines = [
    listToBullets(config.differentiators ?? []),
    nonEmpty(config.uniqueEdge) ? `- ユニークポイント: ${config.uniqueEdge}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    context: contextLines,
    usersAndProblems: usersAndProblemsLines,
    goalsAndSuccess: goalsAndSuccessLines,
    scopeAndFeatures: scopeAndFeaturesLines,
    constraintsAndTimeline: constraintsAndTimelineLines,
    differentiation: differentiationLines,
  };
};

export const getInitialSections = (config: ProductSnapshot): PromptSections => {
  const savedPrompt = config.productPrompt?.trim();
  if (savedPrompt) {
    return parsePromptSections(savedPrompt);
  }
  return buildDefaultSectionsFromConfig(config);
};

export const getBaselinePrompt = (config?: ProductSnapshot): string => {
  if (!config) return "";
  const savedPrompt = config.productPrompt?.trim();
  if (savedPrompt) return savedPrompt;
  return buildPromptFromSections(buildDefaultSectionsFromConfig(config)).trim();
};

const formatOverviewLine = (line: string) =>
  line
    .trim()
    .replace(/^[-*+]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .replace(/^>\s*/, "");

const toOverviewLines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => formatOverviewLine(line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

type PromptTemplateVariables = {
  scenarioTitle: string;
  scenarioDescription: string;
  scenarioDiscipline: string;
  productName: string;
  productSummary: string;
  productAudience: string;
  productTimeline: string;
};

const promptTemplatePattern = /\{\{\s*(\w+)\s*\}\}/g;

const renderPromptTemplate = (template: string, variables: PromptTemplateVariables): string =>
  template.replace(promptTemplatePattern, (_, token: string) => {
    const key = token as keyof PromptTemplateVariables;
    return variables[key] ?? "";
  });

export type ProjectOverviewSection = {
  key: PromptSectionKey;
  heading: string;
  lines: string[];
};

export type ProjectOverviewData = {
  productName: string;
  summary: string;
  audience: string;
  timeline: string;
  configuredSectionCount: number;
  sections: ProjectOverviewSection[];
};

type ScenarioOverviewSource = Pick<Scenario, "title" | "description" | "discipline" | "product">;

export const buildProjectOverviewData = ({
  scenario,
  productConfig,
}: {
  scenario: ScenarioOverviewSource;
  productConfig?: ProductConfig;
}): ProjectOverviewData => {
  const merged: ProductSnapshot = {
    name: choose(productConfig?.name, scenario.product.name),
    summary: choose(productConfig?.summary, scenario.product.summary),
    audience: choose(productConfig?.audience, scenario.product.audience),
    problems: chooseList(productConfig?.problems, scenario.product.problems),
    goals: chooseList(productConfig?.goals, scenario.product.goals),
    differentiators: chooseList(productConfig?.differentiators, scenario.product.differentiators),
    scope: chooseList(productConfig?.scope, scenario.product.scope),
    constraints: chooseList(productConfig?.constraints, scenario.product.constraints),
    timeline: choose(productConfig?.timeline, scenario.product.timeline),
    successCriteria: chooseList(productConfig?.successCriteria, scenario.product.successCriteria),
    uniqueEdge: choose(productConfig?.uniqueEdge, scenario.product.uniqueEdge),
    techStack: chooseList(productConfig?.techStack, scenario.product.techStack),
    coreFeatures: chooseList(productConfig?.coreFeatures, scenario.product.coreFeatures),
    productPrompt: nonEmpty(productConfig?.productPrompt),
  };

  const promptTemplate = merged.productPrompt?.trim();
  const renderedPrompt = promptTemplate
    ? renderPromptTemplate(promptTemplate, {
        scenarioTitle: scenario.title,
        scenarioDescription: scenario.description,
        scenarioDiscipline: getScenarioDiscipline(scenario),
        productName: merged.name,
        productSummary: merged.summary,
        productAudience: merged.audience,
        productTimeline: merged.timeline ?? "",
      })
    : undefined;

  const resolvedSections = renderedPrompt ? parsePromptSections(renderedPrompt) : buildDefaultSectionsFromConfig(merged);

  const sections = promptSectionConfigs.map<ProjectOverviewSection>((section) => ({
    key: section.key,
    heading: section.heading,
    lines: toOverviewLines(resolvedSections[section.key]),
  }));

  return {
    productName: merged.name,
    summary: merged.summary,
    audience: merged.audience,
    timeline: merged.timeline ?? "",
    configuredSectionCount: sections.filter((section) => section.lines.length > 0).length,
    sections,
  };
};
