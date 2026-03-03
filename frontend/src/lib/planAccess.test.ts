import { describe, expect, it, vi } from "vitest";
import { env } from "@/config/env";
import { canAccessScenario } from "@/lib/planAccess";

describe("canAccessScenario", () => {
  it("allows all scenarios for TEAM plans", () => {
    expect(canAccessScenario("TEAM", "any-scenario", "CHALLENGE")).toBe(true);
    expect(canAccessScenario("TEAM", "any-scenario", "BASIC")).toBe(true);
  });

  it("allows only free allowlist scenarios for FREE plans", () => {
    expect(canAccessScenario("FREE", "basic-intro-alignment", "BASIC")).toBe(true);
    expect(canAccessScenario("FREE", "test-file-upload", "CHALLENGE")).toBe(true);
    expect(canAccessScenario("FREE", "advanced-priority-tradeoff", "BASIC")).toBe(
      env.billingEnabled ? false : true,
    );
  });

  it("allows all 6 free scenario IDs for FREE plan", () => {
    const freeScenarioIds = [
      "basic-intro-alignment",
      "basic-meeting-minutes",
      "basic-schedule-share",
      "test-login",
      "test-form",
      "test-file-upload",
    ];
    for (const id of freeScenarioIds) {
      expect(canAccessScenario("FREE", id)).toBe(true);
    }
  });

  it("blocks a premium scenario for FREE plan when billing is enabled", () => {
    if (!env.billingEnabled) return;
    expect(canAccessScenario("FREE", "advanced-priority-tradeoff")).toBe(false);
    expect(canAccessScenario("FREE", "premium-stakeholder-alignment")).toBe(false);
    expect(canAccessScenario("FREE", "challenge-incident-triage")).toBe(false);
  });

  it("allows TEAM plan to access premium scenarios", () => {
    expect(canAccessScenario("TEAM", "advanced-priority-tradeoff")).toBe(true);
    expect(canAccessScenario("TEAM", "premium-stakeholder-alignment")).toBe(true);
    expect(canAccessScenario("TEAM", "challenge-incident-triage")).toBe(true);
  });

  it("discipline parameter does not affect access decision", () => {
    // Same scenario ID with discipline provided vs omitted should return identical results
    expect(canAccessScenario("FREE", "basic-intro-alignment", "BASIC")).toBe(
      canAccessScenario("FREE", "basic-intro-alignment"),
    );
    expect(canAccessScenario("FREE", "basic-intro-alignment", "CHALLENGE")).toBe(
      canAccessScenario("FREE", "basic-intro-alignment"),
    );
    expect(canAccessScenario("FREE", "advanced-priority-tradeoff", "BASIC")).toBe(
      canAccessScenario("FREE", "advanced-priority-tradeoff"),
    );
    expect(canAccessScenario("TEAM", "any-scenario", "BASIC")).toBe(
      canAccessScenario("TEAM", "any-scenario"),
    );
  });
});

describe("canAccessScenario — billing disabled", () => {
  vi.mock("@/config/env", () => ({
    env: { billingEnabled: false },
  }));

  it("allows all scenarios for FREE plan when billing is disabled", async () => {
    const { canAccessScenario: canAccess } = await import("@/lib/planAccess");
    expect(canAccess("FREE", "advanced-priority-tradeoff")).toBe(true);
    expect(canAccess("FREE", "premium-stakeholder-alignment")).toBe(true);
    expect(canAccess("FREE", "basic-intro-alignment")).toBe(true);
  });

  it("allows all scenarios for TEAM plan when billing is disabled", async () => {
    const { canAccessScenario: canAccess } = await import("@/lib/planAccess");
    expect(canAccess("TEAM", "any-scenario")).toBe(true);
    expect(canAccess("TEAM", "advanced-priority-tradeoff")).toBe(true);
  });
});
