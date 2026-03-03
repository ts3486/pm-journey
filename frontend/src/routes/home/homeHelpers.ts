import type { ScenarioCatalogCategory, ScenarioSummary } from "@/types";

// ---- Types ----

export type JourneyStage = {
  role: string;
  goal: string;
};

// ---- Constants ----

const assistantJourneyStage: JourneyStage = {
  role: "PM Assistant",
  goal: "対話と段取りの基礎を固める",
};

const developingJourneyStage: JourneyStage = {
  role: "Developing PM",
  goal: "品質視点で仕様を検証できるようになる",
};

const trainedJourneyStage: JourneyStage = {
  role: "Trained PM",
  goal: "複雑な調整を主導して価値に繋げる",
};

// ---- Pure helpers ----

/**
 * Resolve the journey stage label for a given category index.
 * - index <= 1               → PM Assistant
 * - index === totalCategories - 1 → Trained PM
 * - otherwise               → Developing PM
 */
export const resolveJourneyStage = (index: number, totalCategories: number): JourneyStage => {
  if (index <= 1) return assistantJourneyStage;
  if (index === totalCategories - 1) return trainedJourneyStage;
  return developingJourneyStage;
};

/**
 * Collect all unique scenarios from every subcategory of a catalog category.
 * Deduplication is done by scenario ID; the last occurrence wins.
 */
export const getCategoryScenarios = (category: ScenarioCatalogCategory): ScenarioSummary[] => {
  const uniqueById = new Map<string, ScenarioSummary>();
  category.subcategories.forEach((subcategory) => {
    subcategory.scenarios.forEach((scenario) => {
      uniqueById.set(scenario.id, scenario);
    });
  });
  return Array.from(uniqueById.values());
};

/**
 * Resolve the display title for a catalog category.
 * Priority:
 *   1. category.title when non-empty (after trimming)
 *   2. subcategories[0].title when there is exactly one subcategory
 *   3. "ステージ N" (1-based) as a final fallback
 */
export const getCategoryTitle = (category: ScenarioCatalogCategory, index: number): string => {
  if (category.title.trim().length > 0) return category.title;
  if (category.subcategories.length === 1) return category.subcategories[0].title;
  return `ステージ ${index + 1}`;
};

/**
 * Compute the integer percentage of completed scenarios for a single category.
 * Returns 0 when totalCount is 0 to avoid division by zero.
 */
export const computeCategoryProgress = (completedCount: number, totalCount: number): number => {
  return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
};

/**
 * Compute the integer overall-progress percentage as the average of per-milestone
 * completion ratios (each ratio is in [0, 1]).
 * Returns 0 for an empty milestones array.
 */
export const computeOverallProgress = (milestoneRatios: number[]): number => {
  if (milestoneRatios.length === 0) return 0;
  const totalRatio = milestoneRatios.reduce((sum, ratio) => sum + ratio, 0);
  return Math.round((totalRatio / milestoneRatios.length) * 100);
};
