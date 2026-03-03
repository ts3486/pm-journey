import { describe, it, expect } from "vitest";
import type { Scenario } from "@/types";
import {
  getScenarioDiscipline,
  findScenarioById,
  getDefaultScenario,
  buildHomeScenarioCatalog,
} from "./scenarios";

// ---- Helpers ----

const makeScenario = (overrides: Partial<Scenario> & { id: string }): Scenario => ({
  title: overrides.id,
  description: "",
  scenarioType: "soft-skills",
  kickoffPrompt: "",
  evaluationCriteria: [],
  ...overrides,
});

// ---- getScenarioDiscipline ----

describe("getScenarioDiscipline", () => {
  it("returns CHALLENGE for incident-response", () => {
    expect(getScenarioDiscipline(makeScenario({ id: "x", scenarioType: "incident-response" }))).toBe("CHALLENGE");
  });

  it("returns CHALLENGE for business-execution", () => {
    expect(getScenarioDiscipline(makeScenario({ id: "x", scenarioType: "business-execution" }))).toBe("CHALLENGE");
  });

  it("returns BASIC for soft-skills", () => {
    expect(getScenarioDiscipline(makeScenario({ id: "x", scenarioType: "soft-skills" }))).toBe("BASIC");
  });

  it("returns BASIC for test-cases", () => {
    expect(getScenarioDiscipline(makeScenario({ id: "x", scenarioType: "test-cases" }))).toBe("BASIC");
  });

  it("returns BASIC for requirement-definition", () => {
    expect(getScenarioDiscipline(makeScenario({ id: "x", scenarioType: "requirement-definition" }))).toBe("BASIC");
  });
});

// ---- findScenarioById ----

describe("findScenarioById", () => {
  const scenarios = [
    makeScenario({ id: "a" }),
    makeScenario({ id: "b" }),
  ];

  it("finds a scenario by id", () => {
    const result = findScenarioById(scenarios, "b");
    expect(result?.id).toBe("b");
  });

  it("returns undefined for non-existent id", () => {
    expect(findScenarioById(scenarios, "z")).toBeUndefined();
  });

  it("returns undefined when id is null", () => {
    expect(findScenarioById(scenarios, null)).toBeUndefined();
  });

  it("returns undefined when id is empty string", () => {
    expect(findScenarioById(scenarios, "")).toBeUndefined();
  });

  it("returns undefined when scenarios is undefined", () => {
    expect(findScenarioById(undefined, "a")).toBeUndefined();
  });
});

// ---- getDefaultScenario ----

describe("getDefaultScenario", () => {
  it("returns the first scenario", () => {
    const scenarios = [makeScenario({ id: "first" }), makeScenario({ id: "second" })];
    expect(getDefaultScenario(scenarios)?.id).toBe("first");
  });

  it("returns undefined for empty array", () => {
    expect(getDefaultScenario([])).toBeUndefined();
  });

  it("returns undefined for undefined", () => {
    expect(getDefaultScenario(undefined)).toBeUndefined();
  });
});

// ---- buildHomeScenarioCatalog ----

describe("buildHomeScenarioCatalog", () => {
  // Build a minimal set of scenarios matching the catalog's hardcoded IDs
  const allScenarioIds = [
    "basic-intro-alignment",
    "basic-product-understanding",
    "basic-meeting-minutes",
    "test-login",
    "test-form",
    "test-file-upload",
    "basic-requirement-definition-doc",
    "basic-requirement-hearing-plan",
    "basic-requirement-user-story",
    "coming-incident-response",
    "coming-incident-triage-escalation",
    "coming-postmortem-followup",
    "coming-priority-tradeoff-workshop",
    "adv-data-roi",
    "adv-strategy-diagnosis",
  ];

  const scenarios = allScenarioIds.map((id) =>
    makeScenario({ id, title: `Title for ${id}`, description: `Desc for ${id}` })
  );

  it("returns exactly 5 categories", () => {
    const catalog = buildHomeScenarioCatalog(scenarios);
    expect(catalog).toHaveLength(5);
  });

  it("assigns correct category IDs", () => {
    const catalog = buildHomeScenarioCatalog(scenarios);
    expect(catalog.map((c) => c.id)).toEqual([
      "soft-skills",
      "test-cases",
      "requirement-definition",
      "incident-response",
      "business-execution",
    ]);
  });

  it("has 3 scenarios per category", () => {
    const catalog = buildHomeScenarioCatalog(scenarios);
    catalog.forEach((category) => {
      const allScenarios = category.subcategories.flatMap((sub) => sub.scenarios);
      expect(allScenarios).toHaveLength(3);
    });
  });

  it("total across all categories is 15 scenarios", () => {
    const catalog = buildHomeScenarioCatalog(scenarios);
    const total = catalog.reduce(
      (sum, cat) => sum + cat.subcategories.reduce((s, sub) => s + sub.scenarios.length, 0),
      0
    );
    expect(total).toBe(15);
  });

  it("resolves scenario titles from the input array", () => {
    const catalog = buildHomeScenarioCatalog(scenarios);
    const firstScenario = catalog[0].subcategories[0].scenarios[0];
    expect(firstScenario.title).toBe("Title for basic-intro-alignment");
  });

  it("falls back to ID as title when scenario is not found", () => {
    const catalog = buildHomeScenarioCatalog([]); // no scenarios provided
    const firstScenario = catalog[0].subcategories[0].scenarios[0];
    expect(firstScenario.title).toBe("basic-intro-alignment");
    expect(firstScenario.description).toBe("");
  });
});
