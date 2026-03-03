import { describe, it, expect } from "vitest";
import type { ScenarioCatalogCategory } from "@/types";
import {
  resolveJourneyStage,
  getCategoryScenarios,
  getCategoryTitle,
  computeCategoryProgress,
  computeOverallProgress,
} from "./homeHelpers";

// ---- Test helpers ----

const makeCategory = (
  overrides: Partial<ScenarioCatalogCategory> & { id: string }
): ScenarioCatalogCategory => ({
  title: "",
  subcategories: [],
  ...overrides,
});

const makeSubcategory = (
  id: string,
  title: string,
  scenarioIds: string[]
) => ({
  id,
  title,
  scenarios: scenarioIds.map((sid) => ({ id: sid, title: sid, description: "" })),
});

// ---- resolveJourneyStage ----

describe("resolveJourneyStage", () => {
  it("returns PM Assistant for index 0", () => {
    expect(resolveJourneyStage(0, 5).role).toBe("PM Assistant");
  });

  it("returns PM Assistant for index 1", () => {
    expect(resolveJourneyStage(1, 5).role).toBe("PM Assistant");
  });

  it("returns Developing PM for a middle index", () => {
    expect(resolveJourneyStage(2, 5).role).toBe("Developing PM");
  });

  it("returns Developing PM for index 3 in a 5-category set", () => {
    expect(resolveJourneyStage(3, 5).role).toBe("Developing PM");
  });

  it("returns Trained PM for the last index (totalCategories - 1)", () => {
    expect(resolveJourneyStage(4, 5).role).toBe("Trained PM");
  });

  it("returns PM Assistant when there are only 2 categories (index 1 is the last)", () => {
    // With 2 categories, index 1 is both <= 1 AND === totalCategories - 1.
    // The index <= 1 guard fires first, so the result is PM Assistant.
    expect(resolveJourneyStage(1, 2).role).toBe("PM Assistant");
  });

  it("returns Trained PM for last index in a 3-category set", () => {
    expect(resolveJourneyStage(2, 3).role).toBe("Trained PM");
  });

  it("returns the correct goal strings for each stage", () => {
    expect(resolveJourneyStage(0, 5).goal).toBe("対話と段取りの基礎を固める");
    expect(resolveJourneyStage(2, 5).goal).toBe("品質視点で仕様を検証できるようになる");
    expect(resolveJourneyStage(4, 5).goal).toBe("複雑な調整を主導して価値に繋げる");
  });
});

// ---- getCategoryScenarios ----

describe("getCategoryScenarios", () => {
  it("returns an empty array for a category with no subcategories", () => {
    const category = makeCategory({ id: "cat-1" });
    expect(getCategoryScenarios(category)).toEqual([]);
  });

  it("returns scenarios from a single subcategory", () => {
    const category = makeCategory({
      id: "cat-1",
      subcategories: [makeSubcategory("sub-1", "Sub", ["a", "b", "c"])],
    });
    const result = getCategoryScenarios(category);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("concatenates scenarios from multiple subcategories", () => {
    const category = makeCategory({
      id: "cat-1",
      subcategories: [
        makeSubcategory("sub-1", "Sub 1", ["a", "b"]),
        makeSubcategory("sub-2", "Sub 2", ["c", "d"]),
      ],
    });
    const result = getCategoryScenarios(category);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("deduplicates scenarios that appear in more than one subcategory", () => {
    const category = makeCategory({
      id: "cat-1",
      subcategories: [
        makeSubcategory("sub-1", "Sub 1", ["a", "b"]),
        makeSubcategory("sub-2", "Sub 2", ["b", "c"]),
      ],
    });
    const result = getCategoryScenarios(category);
    expect(result.map((s) => s.id)).toEqual(["a", "b", "c"]);
  });

  it("keeps the last occurrence when there are duplicate IDs (Map.set overwrites)", () => {
    const category: ScenarioCatalogCategory = {
      id: "cat-1",
      title: "",
      subcategories: [
        {
          id: "sub-1",
          title: "Sub 1",
          scenarios: [{ id: "x", title: "First", description: "first" }],
        },
        {
          id: "sub-2",
          title: "Sub 2",
          scenarios: [{ id: "x", title: "Second", description: "second" }],
        },
      ],
    };
    const result = getCategoryScenarios(category);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Second");
  });

  it("returns scenarios from an empty subcategory list", () => {
    const category = makeCategory({
      id: "cat-1",
      subcategories: [makeSubcategory("sub-1", "Sub", [])],
    });
    expect(getCategoryScenarios(category)).toEqual([]);
  });
});

// ---- getCategoryTitle ----

describe("getCategoryTitle", () => {
  it("returns category.title when it is non-empty", () => {
    const category = makeCategory({
      id: "cat-1",
      title: "ソフトスキル",
      subcategories: [makeSubcategory("sub-1", "コミュニケーション", [])],
    });
    expect(getCategoryTitle(category, 0)).toBe("ソフトスキル");
  });

  it("trims whitespace before checking if the title is empty", () => {
    const category = makeCategory({
      id: "cat-1",
      title: "   ",
      subcategories: [makeSubcategory("sub-1", "Subcategory Title", [])],
    });
    // title is only whitespace → treated as empty → falls back to subcategory title
    expect(getCategoryTitle(category, 0)).toBe("Subcategory Title");
  });

  it("falls back to subcategories[0].title when category.title is empty and there is exactly one subcategory", () => {
    const category = makeCategory({
      id: "cat-1",
      title: "",
      subcategories: [makeSubcategory("sub-1", "テスト設計", [])],
    });
    expect(getCategoryTitle(category, 2)).toBe("テスト設計");
  });

  it("falls back to 'ステージ N' (1-based) when category.title is empty and there are multiple subcategories", () => {
    const category = makeCategory({
      id: "cat-1",
      title: "",
      subcategories: [
        makeSubcategory("sub-1", "Sub A", []),
        makeSubcategory("sub-2", "Sub B", []),
      ],
    });
    expect(getCategoryTitle(category, 0)).toBe("ステージ 1");
    expect(getCategoryTitle(category, 2)).toBe("ステージ 3");
  });

  it("falls back to 'ステージ N' when category.title is empty and there are no subcategories", () => {
    const category = makeCategory({ id: "cat-1", title: "" });
    expect(getCategoryTitle(category, 3)).toBe("ステージ 4");
  });
});

// ---- computeCategoryProgress ----

describe("computeCategoryProgress", () => {
  it("returns 0 when totalCount is 0 (avoid division by zero)", () => {
    expect(computeCategoryProgress(0, 0)).toBe(0);
  });

  it("returns 0 when no scenarios are completed", () => {
    expect(computeCategoryProgress(0, 5)).toBe(0);
  });

  it("returns 100 when all scenarios are completed", () => {
    expect(computeCategoryProgress(5, 5)).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    // 1/3 ≈ 33.33 → rounds to 33
    expect(computeCategoryProgress(1, 3)).toBe(33);
    // 2/3 ≈ 66.67 → rounds to 67
    expect(computeCategoryProgress(2, 3)).toBe(67);
  });

  it("returns 50 for exactly half completed", () => {
    expect(computeCategoryProgress(2, 4)).toBe(50);
  });

  it("returns 0 when completedCount is 0 regardless of totalCount", () => {
    expect(computeCategoryProgress(0, 10)).toBe(0);
  });
});

// ---- computeOverallProgress ----

describe("computeOverallProgress", () => {
  it("returns 0 for an empty milestones array", () => {
    expect(computeOverallProgress([])).toBe(0);
  });

  it("returns 0 when all milestone ratios are 0", () => {
    expect(computeOverallProgress([0, 0, 0])).toBe(0);
  });

  it("returns 100 when all milestone ratios are 1", () => {
    expect(computeOverallProgress([1, 1, 1])).toBe(100);
  });

  it("returns the correct average for mixed ratios", () => {
    // (1 + 0.5 + 0) / 3 = 0.5 → 50%
    expect(computeOverallProgress([1, 0.5, 0])).toBe(50);
  });

  it("rounds to the nearest integer", () => {
    // (1 + 0) / 3 ≈ 0.333 → 33%
    expect(computeOverallProgress([1, 0, 0])).toBe(33);
    // (1 + 1 + 0) / 3 ≈ 0.667 → 67%
    expect(computeOverallProgress([1, 1, 0])).toBe(67);
  });

  it("handles a single fully-completed milestone", () => {
    expect(computeOverallProgress([1])).toBe(100);
  });

  it("handles a single partially-completed milestone", () => {
    // 0.5 / 1 = 50%
    expect(computeOverallProgress([0.5])).toBe(50);
  });
});
