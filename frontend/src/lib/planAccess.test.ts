import { describe, expect, it } from "vitest";
import { canAccessScenario } from "@/lib/planAccess";

describe("canAccessScenario", () => {
  it("allows all scenarios for TEAM plans", () => {
    expect(canAccessScenario("TEAM", "any-scenario", "CHALLENGE")).toBe(true);
    expect(canAccessScenario("TEAM", "any-scenario", "BASIC")).toBe(true);
  });

  it("allows all scenarios for INDIVIDUAL plans", () => {
    expect(canAccessScenario("INDIVIDUAL", "challenge-case", "CHALLENGE")).toBe(true);
    expect(canAccessScenario("INDIVIDUAL", "basic-case", "BASIC")).toBe(true);
  });

  it("allows only free allowlist scenarios for FREE plans", () => {
    expect(canAccessScenario("FREE", "basic-intro-alignment", "BASIC")).toBe(true);
    expect(canAccessScenario("FREE", "test-file-upload", "CHALLENGE")).toBe(true);
    expect(canAccessScenario("FREE", "advanced-priority-tradeoff", "BASIC")).toBe(false);
  });
});
