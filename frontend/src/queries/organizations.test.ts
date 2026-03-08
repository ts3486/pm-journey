import { describe, it, expect } from "vitest";

/**
 * Unit tests for the isMissingOrganizationError helper logic.
 * The helper is module-private, so we test the pattern it uses directly.
 */

const isMissingOrganizationError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /organization not found for current user/i.test(error.message);
};

describe("isMissingOrganizationError", () => {
  it("returns true for matching error message", () => {
    expect(isMissingOrganizationError(new Error("Organization not found for current user"))).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isMissingOrganizationError(new Error("ORGANIZATION NOT FOUND FOR CURRENT USER"))).toBe(true);
  });

  it("matches when message has additional context", () => {
    expect(
      isMissingOrganizationError(new Error("Error: organization not found for current user (id=123)"))
    ).toBe(true);
  });

  it("returns false for non-Error values", () => {
    expect(isMissingOrganizationError("organization not found for current user")).toBe(false);
    expect(isMissingOrganizationError(null)).toBe(false);
    expect(isMissingOrganizationError(undefined)).toBe(false);
    expect(isMissingOrganizationError(42)).toBe(false);
  });

  it("returns false for unrelated errors", () => {
    expect(isMissingOrganizationError(new Error("Network error"))).toBe(false);
    expect(isMissingOrganizationError(new Error("401 Unauthorized"))).toBe(false);
    expect(isMissingOrganizationError(new Error("Internal server error"))).toBe(false);
  });

  it("returns false for partial match", () => {
    expect(isMissingOrganizationError(new Error("organization not found"))).toBe(false);
  });
});
