import { describe, expect, it } from "vitest";
import { resolveAgentProfile } from "@/config/agentProfiles";

describe("resolveAgentProfile", () => {
  it("returns profile with support assistant identity", () => {
    const profile = resolveAgentProfile();

    expect(profile.systemPrompt).toContain("PMスキル学習の支援アシスタント");
    expect(profile.tonePrompt).toContain("メンター");
  });

  it("returns a valid modelId", () => {
    const profile = resolveAgentProfile();

    expect(profile.modelId).toBeDefined();
    expect(profile.modelId).toBeTruthy();
  });

  it("does not contain legacy role-play identity", () => {
    const profile = resolveAgentProfile();

    expect(profile.systemPrompt).not.toContain("エンジニア兼デザイナー");
  });
});
