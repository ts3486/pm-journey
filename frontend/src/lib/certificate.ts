import type { HistoryItem, ScenarioCatalogCategory, ScenarioSummary } from "@/types";

// ---- Types ----

export type CategoryCertificateStatus = {
  categoryId: string;
  categoryTitle: string;
  totalScenarios: number;
  passedCount: number;
  allPassed: boolean;
};

export type CertificateStatus = {
  categories: CategoryCertificateStatus[];
  totalRequired: number;
  totalPassed: number;
  allPassed: boolean;
  earnedAt?: string;
};

// ---- Helpers ----

const getCategoryScenarios = (category: ScenarioCatalogCategory): ScenarioSummary[] => {
  const uniqueById = new Map<string, ScenarioSummary>();
  category.subcategories.forEach((subcategory) => {
    subcategory.scenarios.forEach((scenario) => {
      uniqueById.set(scenario.id, scenario);
    });
  });
  return Array.from(uniqueById.values());
};

const getCategoryTitle = (category: ScenarioCatalogCategory, index: number): string => {
  if (category.title.trim().length > 0) return category.title;
  if (category.subcategories.length === 1) return category.subcategories[0].title;
  return `ステージ ${index + 1}`;
};

/**
 * Resolve the most-recent timestamp from a history item.
 * Considers both `metadata.startedAt` and individual action timestamps.
 * Returns unix ms or 0 if no valid timestamps exist.
 */
export const resolveHistoryTimestamp = (item: HistoryItem): number => {
  const candidates: number[] = [];
  if (item.metadata?.startedAt) {
    const startedAt = Date.parse(item.metadata.startedAt);
    if (!Number.isNaN(startedAt)) candidates.push(startedAt);
  }
  (item.actions ?? []).forEach((action) => {
    const actionTimestamp = Date.parse(action.createdAt);
    if (!Number.isNaN(actionTimestamp)) candidates.push(actionTimestamp);
  });
  return candidates.length > 0 ? Math.max(...candidates) : 0;
};

// ---- Core computation ----

/**
 * Compute the set of scenario IDs that have at least one history item
 * with `evaluation.passing === true`. When multiple items exist for the same
 * scenario, any single passing evaluation is enough.
 */
export const computePassedScenarioIds = (historyItems: HistoryItem[]): Set<string> => {
  const passed = new Set<string>();
  historyItems.forEach((item) => {
    if (item.scenarioId && item.evaluation?.passing === true) {
      passed.add(item.scenarioId);
    }
  });
  return passed;
};

/**
 * Compute full certificate status from history items and the scenario catalog.
 */
export const computeCertificateStatus = (
  historyItems: HistoryItem[],
  scenarioCatalog: ScenarioCatalogCategory[]
): CertificateStatus => {
  const passedIds = computePassedScenarioIds(historyItems);

  const categories: CategoryCertificateStatus[] = scenarioCatalog.map((category, index) => {
    const scenarios = getCategoryScenarios(category);
    const passedCount = scenarios.filter((s) => passedIds.has(s.id)).length;
    return {
      categoryId: category.id,
      categoryTitle: getCategoryTitle(category, index),
      totalScenarios: scenarios.length,
      passedCount,
      allPassed: scenarios.length > 0 && passedCount === scenarios.length,
    };
  });

  const totalRequired = categories.reduce((sum, c) => sum + c.totalScenarios, 0);
  const totalPassed = categories.reduce((sum, c) => sum + c.passedCount, 0);
  const allPassed = totalRequired > 0 && totalPassed === totalRequired;

  // Determine earliest moment when ALL scenarios became passing.
  // We find the latest "first-pass" time across all required scenarios.
  let earnedAt: string | undefined;
  if (allPassed) {
    const allScenarioIds = new Set(
      scenarioCatalog.flatMap((cat) => getCategoryScenarios(cat).map((s) => s.id))
    );
    // For each scenario, find the earliest passing item's timestamp
    const firstPassTimestamps: number[] = [];
    allScenarioIds.forEach((scenarioId) => {
      let earliest = Infinity;
      historyItems.forEach((item) => {
        if (item.scenarioId === scenarioId && item.evaluation?.passing === true) {
          const ts = resolveHistoryTimestamp(item);
          if (ts > 0 && ts < earliest) earliest = ts;
        }
      });
      if (Number.isFinite(earliest)) firstPassTimestamps.push(earliest);
    });
    if (firstPassTimestamps.length > 0) {
      earnedAt = new Date(Math.max(...firstPassTimestamps)).toISOString();
    }
  }

  return { categories, totalRequired, totalPassed, allPassed, earnedAt };
};
