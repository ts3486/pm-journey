import { describe, expect, it, vi } from "vitest";
import { resolveAgentProfile } from "@/config/agentProfiles";

/**
 * Tests for resolveAgentProfile() with the new SUPPORT profile.
 *
 * Task #5 (Phase 0.6) added the SUPPORT profile and updated routing:
 * - Scenarios with a `task` field get the SUPPORT profile
 * - Legacy BASIC/CHALLENGE scenarios keep their existing profiles
 */

// Mock getScenarioById used internally by resolveAgentProfile
vi.mock("@/config/scenarios", () => ({
  getScenarioById: vi.fn(),
}));

import { getScenarioById } from "@/config/scenarios";

const getScenarioByIdMock = vi.mocked(getScenarioById);

describe("resolveAgentProfile", () => {
  it("returns SUPPORT profile when scenario has task field", () => {
    getScenarioByIdMock.mockReturnValueOnce({
      id: "test-task-scenario",
      title: "Test",
      description: "Test",
      discipline: "BASIC",
      product: {
        name: "", summary: "", audience: "",
        problems: [], goals: [], differentiators: [],
        scope: [], constraints: [], timeline: "",
        successCriteria: [],
      },
      mode: "guided",
      kickoffPrompt: "",
      evaluationCriteria: [],
      task: {
        instruction: "Do something",
        deliverableFormat: "free-text",
      },
    } as any);

    const profile = resolveAgentProfile("test-task-scenario");

    expect(profile.systemPrompt).toContain("PMスキル学習の支援アシスタント");
    expect(profile.tonePrompt).toContain("メンター");
  });

  it("returns BASIC profile for legacy BASIC scenario without task", () => {
    getScenarioByIdMock.mockReturnValueOnce({
      id: "legacy-basic",
      title: "Legacy",
      description: "Legacy",
      discipline: "BASIC",
      product: {
        name: "", summary: "", audience: "",
        problems: [], goals: [], differentiators: [],
        scope: [], constraints: [], timeline: "",
        successCriteria: [],
      },
      mode: "guided",
      kickoffPrompt: "",
      evaluationCriteria: [],
      // No task field
    } as any);

    const profile = resolveAgentProfile("legacy-basic");

    expect(profile.systemPrompt).toContain("エンジニア兼デザイナー");
    expect(profile.tonePrompt).toContain("PMさん");
  });

  it("returns CHALLENGE profile for legacy CHALLENGE scenario without task", () => {
    getScenarioByIdMock.mockReturnValueOnce({
      id: "legacy-challenge",
      title: "Challenge",
      description: "Challenge",
      discipline: "CHALLENGE",
      product: {
        name: "", summary: "", audience: "",
        problems: [], goals: [], differentiators: [],
        scope: [], constraints: [], timeline: "",
        successCriteria: [],
      },
      mode: "guided",
      kickoffPrompt: "",
      evaluationCriteria: [],
    } as any);

    const profile = resolveAgentProfile("legacy-challenge");

    expect(profile.systemPrompt).toContain("エンジニア兼デザイナー");
  });

  it("returns DEFAULT profile when scenario is not found", () => {
    getScenarioByIdMock.mockReturnValueOnce(undefined as any);

    const profile = resolveAgentProfile("non-existent");

    expect(profile).toBeDefined();
    expect(profile.systemPrompt).toBeDefined();
    expect(profile.modelId).toBeDefined();
  });

  it("returns DEFAULT profile when scenarioId is null", () => {
    const profile = resolveAgentProfile(null);

    expect(profile).toBeDefined();
    expect(profile.modelId).toBeDefined();
  });
});
