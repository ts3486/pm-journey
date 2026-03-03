import { describe, it, expect } from "vitest";
import { canViewTeamManagement } from "./teamAccess";

describe("canViewTeamManagement", () => {
  it.each([
    ["owner", true],
    ["admin", true],
    ["manager", true],
    ["member", false],
    ["reviewer", false],
  ] as const)('returns %s for role "%s"', (role, expected) => {
    expect(canViewTeamManagement(role)).toBe(expected);
  });

  it("returns false for null", () => {
    expect(canViewTeamManagement(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(canViewTeamManagement(undefined)).toBe(false);
  });

  it("returns false for an unrecognized string role", () => {
    expect(canViewTeamManagement("guest")).toBe(false);
    expect(canViewTeamManagement("")).toBe(false);
  });
});
