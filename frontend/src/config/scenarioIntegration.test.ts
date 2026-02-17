/**
 * Integration tests for the support-agent refactor.
 *
 * These tests verify cross-cutting concerns that span scenarios,
 * agentProfiles, and buildSupportPrompt — ensuring the full
 * message-flow pipeline is consistent after migration.
 */
import { describe, expect, it } from "vitest";
import {
  scenarioCatalog,
  getScenarioById,
  resolveAgentProfile,
} from "@/config";
import { buildSupportPrompt, buildAssistanceModeRules } from "@/services/sessions";
import type { Scenario } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect every scenario referenced in the catalog */
const allScenarioIds: string[] = scenarioCatalog.flatMap((section) =>
  section.scenarios.map((s) => s.id),
);

const allScenarios: Scenario[] = allScenarioIds
  .map((id) => getScenarioById(id))
  .filter((s): s is Scenario => s !== undefined);

// ---------------------------------------------------------------------------
// 1. Scenario consistency checks
// ---------------------------------------------------------------------------

describe("scenario consistency", () => {
  it("every scenario with a task field also has forbidRolePlay: true", () => {
    const violations: string[] = [];
    for (const scenario of allScenarios) {
      if (scenario.task && !scenario.behavior?.forbidRolePlay) {
        violations.push(scenario.id);
      }
    }
    expect(violations).toEqual([]);
  });

  it("no scenario with a task field has customPrompt set", () => {
    const violations: string[] = [];
    for (const scenario of allScenarios) {
      if (scenario.task && scenario.customPrompt) {
        violations.push(scenario.id);
      }
    }
    expect(violations).toEqual([]);
  });

  it("every scenario with a task field has assistanceMode set", () => {
    const violations: string[] = [];
    for (const scenario of allScenarios) {
      if (scenario.task && !scenario.assistanceMode && !scenario.behavior?.assistanceMode) {
        violations.push(scenario.id);
      }
    }
    expect(violations).toEqual([]);
  });

  it("all scenarios in the catalog can be resolved by id", () => {
    const missing = allScenarioIds.filter((id) => getScenarioById(id) === undefined);
    expect(missing).toEqual([]);
  });

  it("at least one scenario has a task field (migration did run)", () => {
    const withTask = allScenarios.filter((s) => s.task);
    expect(withTask.length).toBeGreaterThan(0);
  });

  it("all test-case scenarios have task fields", () => {
    const testCaseIds = [
      "test-login",
      "test-form",
      "test-file-upload",
      "test-password-reset",
      "test-search-filter",
      "test-notification-settings",
      "test-profile-edit",
    ];
    for (const id of testCaseIds) {
      const scenario = getScenarioById(id);
      expect(scenario, `scenario ${id} should exist`).toBeDefined();
      expect(scenario!.task, `scenario ${id} should have task`).toBeDefined();
      expect(scenario!.behavior?.forbidRolePlay, `scenario ${id} should forbid role-play`).toBe(true);
      expect(scenario!.customPrompt, `scenario ${id} should not have customPrompt`).toBeUndefined();
      expect(
        scenario!.assistanceMode ?? scenario!.behavior?.assistanceMode,
        `scenario ${id} should have assistanceMode`,
      ).toBeDefined();
    }
  });

  it("all requirement-definition scenarios have task fields", () => {
    const reqIds = [
      "basic-requirement-definition-doc",
      "basic-requirement-hearing-plan",
      "basic-requirement-user-story",
      "basic-requirement-nfr",
      "basic-requirement-priority-matrix",
      "basic-requirement-risk-check",
      "basic-requirement-consensus",
    ];
    for (const id of reqIds) {
      const scenario = getScenarioById(id);
      expect(scenario, `scenario ${id} should exist`).toBeDefined();
      expect(scenario!.task, `scenario ${id} should have task`).toBeDefined();
      expect(scenario!.behavior?.forbidRolePlay, `scenario ${id} should forbid role-play`).toBe(true);
      expect(scenario!.customPrompt, `scenario ${id} should not have customPrompt`).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. buildSupportPrompt output matches backend AgentContext shape
// ---------------------------------------------------------------------------

describe("buildSupportPrompt output matches backend AgentContext", () => {
  /**
   * The backend AgentContext struct expects these camelCase fields:
   * - systemPrompt: String (required)
   * - tonePrompt: Option<String>
   * - scenarioPrompt: String (required)
   * - scenarioTitle: Option<String>
   * - scenarioDescription: Option<String>
   * - productContext: Option<String>
   * - modelId: Option<String>
   * - behavior: Option<AgentBehavior>
   * - customPrompt: Option<String>
   * - task: Option<TaskDefinition>
   *
   * TaskDefinition expects:
   * - instruction: String
   * - deliverableFormat: DeliverableFormat (kebab-case enum)
   * - template: Option<TaskTemplate>
   * - referenceInfo: Option<String>
   * - hints: Option<Vec<String>>
   */
  const backendRequiredFields = ["systemPrompt", "scenarioPrompt"] as const;
  const backendOptionalFields = [
    "tonePrompt",
    "scenarioTitle",
    "scenarioDescription",
    "productContext",
    "modelId",
    "behavior",
    "task",
  ] as const;

  const taskRequiredFields = ["instruction", "deliverableFormat"] as const;
  const taskOptionalFields = ["template", "referenceInfo", "hints"] as const;

  const validDeliverableFormats = ["free-text", "structured", "checklist", "table"];

  // Pick a representative task-based scenario for shape tests
  const taskScenario = getScenarioById("test-login")!;
  const profile = resolveAgentProfile("test-login");

  it("returns all required backend fields", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    for (const field of backendRequiredFields) {
      expect(result).toHaveProperty(field);
      expect((result as Record<string, unknown>)[field]).toBeTruthy();
    }
  });

  it("returns optional backend fields with correct types", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    for (const field of backendOptionalFields) {
      expect(result).toHaveProperty(field);
    }
  });

  it("does not include customPrompt in the output", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    expect(result).not.toHaveProperty("customPrompt");
  });

  it("task field has the correct shape", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    expect(result.task).toBeDefined();
    const task = result.task!;

    for (const field of taskRequiredFields) {
      expect(task).toHaveProperty(field);
      expect((task as Record<string, unknown>)[field]).toBeTruthy();
    }

    for (const field of taskOptionalFields) {
      expect(task).toHaveProperty(field);
    }
  });

  it("task.deliverableFormat is a valid kebab-case enum value", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    expect(validDeliverableFormats).toContain(result.task!.deliverableFormat);
  });

  it("behavior includes forbidRolePlay when scenario has it", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    expect(result.behavior?.forbidRolePlay).toBe(true);
  });

  it("scenarioPrompt includes task instruction", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    expect(result.scenarioPrompt).toContain(taskScenario.task!.instruction);
  });

  it("scenarioPrompt includes assistance mode rules", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    const modeRules = buildAssistanceModeRules(
      taskScenario.assistanceMode ?? taskScenario.behavior?.assistanceMode ?? "on-request",
    );
    expect(result.scenarioPrompt).toContain(modeRules);
  });

  it("scenarioPrompt includes reference info when present", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    if (taskScenario.task!.referenceInfo) {
      expect(result.scenarioPrompt).toContain(taskScenario.task!.referenceInfo);
    }
  });

  it("scenarioPrompt includes template sections when present", () => {
    const result = buildSupportPrompt({ scenario: taskScenario, profile });
    if (taskScenario.task!.template?.sections) {
      for (const section of taskScenario.task!.template!.sections!) {
        expect(result.scenarioPrompt).toContain(section);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 3. agentProfile routing consistency
// ---------------------------------------------------------------------------

describe("agentProfile routing consistency", () => {
  it("all task-based scenarios route to SUPPORT profile", () => {
    const violations: string[] = [];
    for (const scenario of allScenarios) {
      if (scenario.task) {
        const profile = resolveAgentProfile(scenario.id);
        // SUPPORT profile has the supportSystemPrompt which contains "PMスキル学習の支援アシスタント"
        if (!profile.systemPrompt.includes("支援アシスタント")) {
          violations.push(scenario.id);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("SUPPORT profile does not contain role-play instructions", () => {
    const profile = resolveAgentProfile("test-login");
    expect(profile.systemPrompt).not.toContain("エンジニア兼デザイナー");
    expect(profile.systemPrompt).toContain("支援アシスタント");
  });

  it("buildSupportPrompt uses the profile systemPrompt", () => {
    const scenario = getScenarioById("test-login")!;
    const profile = resolveAgentProfile("test-login");
    const result = buildSupportPrompt({ scenario, profile });
    expect(result.systemPrompt).toBe(profile.systemPrompt);
  });

  it("buildSupportPrompt uses the profile tonePrompt", () => {
    const scenario = getScenarioById("test-login")!;
    const profile = resolveAgentProfile("test-login");
    const result = buildSupportPrompt({ scenario, profile });
    expect(result.tonePrompt).toBe(profile.tonePrompt);
  });

  it("buildSupportPrompt uses the profile modelId", () => {
    const scenario = getScenarioById("test-login")!;
    const profile = resolveAgentProfile("test-login");
    const result = buildSupportPrompt({ scenario, profile });
    expect(result.modelId).toBe(profile.modelId);
  });
});

// ---------------------------------------------------------------------------
// 4. Cross-scenario buildSupportPrompt consistency
// ---------------------------------------------------------------------------

describe("no scenario should have customPrompt anywhere", () => {
  it("no scenario has customPrompt set (even without task)", () => {
    const violations: string[] = [];
    for (const scenario of allScenarios) {
      if (scenario.customPrompt) {
        violations.push(scenario.id);
      }
    }
    expect(violations).toEqual([]);
  });

  it("every scenario in the catalog has a task field (full migration)", () => {
    const missing: string[] = [];
    for (const scenario of allScenarios) {
      if (!scenario.task) {
        missing.push(scenario.id);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 5. Cross-scenario buildSupportPrompt consistency
// ---------------------------------------------------------------------------

describe("buildSupportPrompt works for all task-based scenarios", () => {
  const taskScenarios = allScenarios.filter((s) => s.task);

  it("all scenarios have task fields (count matches catalog size)", () => {
    expect(taskScenarios.length).toBe(allScenarios.length);
  });

  it.each(
    taskScenarios.map((s) => [s.id, s] as const),
  )("buildSupportPrompt succeeds for %s", (_id, scenario) => {
    const profile = resolveAgentProfile(scenario.id);
    const result = buildSupportPrompt({ scenario, profile });

    // Required fields exist and are non-empty
    expect(result.systemPrompt).toBeTruthy();
    expect(result.scenarioPrompt).toBeTruthy();
    expect(result.scenarioTitle).toBe(scenario.title);
    expect(result.scenarioDescription).toBe(scenario.description);

    // Task is forwarded correctly
    expect(result.task).toBeDefined();
    expect(result.task!.instruction).toBe(scenario.task!.instruction);
    expect(result.task!.deliverableFormat).toBe(scenario.task!.deliverableFormat);
  });
});
