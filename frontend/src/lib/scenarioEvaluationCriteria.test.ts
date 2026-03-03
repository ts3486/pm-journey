import { describe, it, expect } from "vitest";
import type { Scenario, RatingCriterion } from "@/types";
import {
  resolveScenarioEvaluationCategoryKey,
  buildScenarioEvaluationCriteria,
  normalizeScenarioEvaluationCriteriaConfig,
  parseScenarioCriteriaTextareaValue,
  createDefaultScenarioEvaluationCriteriaConfig,
  scenarioCriteriaListToTextareaValue,
  serializeScenarioEvaluationCriteriaConfig,
} from "./scenarioEvaluationCriteria";

// ---- Helpers ----

const makeScenario = (
  id: string,
  scenarioType: Scenario["scenarioType"]
): Pick<Scenario, "id" | "scenarioType"> => ({ id, scenarioType });

const makeFallbackCriteria = (): RatingCriterion[] => [
  {
    name: "Fallback",
    weight: 100,
    description: "Fallback criterion",
    scoringGuidelines: {
      excellent: "excellent",
      good: "good",
      needsImprovement: "needs improvement",
      poor: "poor",
    },
  },
];

// ---- distributeWeights (tested indirectly through buildScenarioEvaluationCriteria) ----

describe("resolveScenarioEvaluationCategoryKey", () => {
  it("maps test-cases scenarioType to testCases", () => {
    expect(resolveScenarioEvaluationCategoryKey(makeScenario("x", "test-cases"))).toBe("testCases");
  });

  it("maps requirement-definition scenarioType to requirementDefinition", () => {
    expect(resolveScenarioEvaluationCategoryKey(makeScenario("x", "requirement-definition"))).toBe("requirementDefinition");
  });

  it("maps incident-response scenarioType to incidentResponse", () => {
    expect(resolveScenarioEvaluationCategoryKey(makeScenario("x", "incident-response"))).toBe("incidentResponse");
  });

  it("maps business-execution scenarioType to businessExecution", () => {
    expect(resolveScenarioEvaluationCategoryKey(makeScenario("x", "business-execution"))).toBe("businessExecution");
  });

  it("maps soft-skills scenarioType to softSkills by default", () => {
    expect(resolveScenarioEvaluationCategoryKey(makeScenario("x", "soft-skills"))).toBe("softSkills");
  });

  it("overrides soft-skills for requirement-definition scenario IDs", () => {
    expect(
      resolveScenarioEvaluationCategoryKey(makeScenario("basic-requirement-definition-doc", "soft-skills"))
    ).toBe("requirementDefinition");
  });

  it("overrides soft-skills for incident-response scenario IDs", () => {
    expect(
      resolveScenarioEvaluationCategoryKey(makeScenario("coming-incident-response", "soft-skills"))
    ).toBe("incidentResponse");
  });

  it("overrides soft-skills for business-execution scenario IDs", () => {
    expect(
      resolveScenarioEvaluationCategoryKey(makeScenario("adv-data-roi", "soft-skills"))
    ).toBe("businessExecution");
  });
});

describe("buildScenarioEvaluationCriteria", () => {
  it("returns criteria with correct IDs and distributed weights", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result.length).toBe(4); // default testCases has 4 criteria
    expect(result[0].id).toBe("test-login-testCases-criterion-1");
    expect(result[3].id).toBe("test-login-testCases-criterion-4");
    // Weights should sum to 100
    const totalWeight = result.reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBe(100);
  });

  it("uses custom criteria from config when provided", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      scenarioEvaluationCriteria: {
        testCases: ["Custom A", "Custom B"],
      },
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result.length).toBe(2);
    expect(result[0].name).toBe("Custom A");
    expect(result[1].name).toBe("Custom B");
    expect(result[0].weight).toBe(50);
    expect(result[1].weight).toBe(50);
  });

  it("distributes weights evenly for 3 criteria (34, 33, 33)", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      scenarioEvaluationCriteria: {
        testCases: ["A", "B", "C"],
      },
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result.map((c) => c.weight)).toEqual([34, 33, 33]);
  });

  it("distributes weights for single criterion as 100", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      scenarioEvaluationCriteria: {
        testCases: ["Only one"],
      },
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result[0].weight).toBe(100);
  });

  it("includes scoring guidelines from the template", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result[0].scoringGuidelines.excellent).toBeTruthy();
    expect(result[0].scoringGuidelines.poor).toBeTruthy();
  });

  it("includes description referencing the criterion name", () => {
    const result = buildScenarioEvaluationCriteria({
      scenario: makeScenario("test-login", "test-cases"),
      scenarioEvaluationCriteria: {
        testCases: ["テスト観点の網羅"],
      },
      fallbackCriteria: makeFallbackCriteria(),
    });
    expect(result[0].description).toContain("テスト観点の網羅");
  });
});

describe("normalizeScenarioEvaluationCriteriaConfig", () => {
  it("returns defaults when config is undefined", () => {
    const result = normalizeScenarioEvaluationCriteriaConfig(undefined);
    expect(result.softSkills.length).toBeGreaterThan(0);
    expect(result.testCases.length).toBeGreaterThan(0);
    expect(result.requirementDefinition.length).toBeGreaterThan(0);
    expect(result.incidentResponse.length).toBeGreaterThan(0);
    expect(result.businessExecution.length).toBeGreaterThan(0);
  });

  it("returns defaults when config has empty arrays", () => {
    const result = normalizeScenarioEvaluationCriteriaConfig({
      softSkills: [],
      testCases: [],
    });
    // Should fall back to defaults when empty
    expect(result.softSkills.length).toBeGreaterThan(0);
    expect(result.testCases.length).toBeGreaterThan(0);
  });

  it("strips bullet prefixes from criteria lines", () => {
    const result = normalizeScenarioEvaluationCriteriaConfig({
      softSkills: ["- 明確さ", "* 配慮", "+ 合意", "1. 具体性", "2) 論理性"],
    });
    expect(result.softSkills).toEqual(["明確さ", "配慮", "合意", "具体性", "論理性"]);
  });

  it("deduplicates criteria", () => {
    const result = normalizeScenarioEvaluationCriteriaConfig({
      softSkills: ["明確さ", "明確さ", "配慮"],
    });
    expect(result.softSkills).toEqual(["明確さ", "配慮"]);
  });

  it("filters out empty lines", () => {
    const result = normalizeScenarioEvaluationCriteriaConfig({
      softSkills: ["明確さ", "", "  ", "配慮"],
    });
    expect(result.softSkills).toEqual(["明確さ", "配慮"]);
  });
});

describe("parseScenarioCriteriaTextareaValue", () => {
  it("splits lines and normalizes bullet prefixes", () => {
    const result = parseScenarioCriteriaTextareaValue("- Line 1\n* Line 2\nLine 3");
    expect(result).toEqual(["Line 1", "Line 2", "Line 3"]);
  });

  it("filters out empty lines", () => {
    const result = parseScenarioCriteriaTextareaValue("A\n\nB\n  \nC");
    expect(result).toEqual(["A", "B", "C"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseScenarioCriteriaTextareaValue("")).toEqual([]);
    expect(parseScenarioCriteriaTextareaValue("   ")).toEqual([]);
  });

  it("handles CRLF line endings", () => {
    const result = parseScenarioCriteriaTextareaValue("A\r\nB\r\nC");
    expect(result).toEqual(["A", "B", "C"]);
  });
});

describe("createDefaultScenarioEvaluationCriteriaConfig", () => {
  it("returns a config with all 5 category keys populated", () => {
    const config = createDefaultScenarioEvaluationCriteriaConfig();
    expect(config.softSkills.length).toBe(4);
    expect(config.testCases.length).toBe(4);
    expect(config.requirementDefinition.length).toBe(4);
    expect(config.incidentResponse.length).toBe(4);
    expect(config.businessExecution.length).toBe(4);
  });
});

describe("scenarioCriteriaListToTextareaValue", () => {
  it("joins criteria with newlines", () => {
    expect(scenarioCriteriaListToTextareaValue(["A", "B", "C"])).toBe("A\nB\nC");
  });

  it("returns empty string for empty array", () => {
    expect(scenarioCriteriaListToTextareaValue([])).toBe("");
  });
});

describe("serializeScenarioEvaluationCriteriaConfig", () => {
  it("produces valid JSON", () => {
    const config = createDefaultScenarioEvaluationCriteriaConfig();
    const json = serializeScenarioEvaluationCriteriaConfig(config);
    const parsed = JSON.parse(json);
    expect(parsed.softSkills).toEqual(config.softSkills);
  });
});
