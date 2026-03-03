import { describe, it, expect } from "vitest";
import type { HistoryItem } from "@/types";
import { formatStartedAt, resolveStartedAt, normalizeOptionalText } from "./teamMemberHelpers";

// ---- Test helpers ----

const makeItem = (
  overrides: Partial<HistoryItem> & { sessionId: string }
): HistoryItem => ({
  metadata: {},
  actions: [],
  ...overrides,
});

const makeMessage = (id: string, createdAt: string) => ({
  id,
  sessionId: "s1",
  role: "user" as const,
  content: "msg",
  createdAt,
});

// ---- formatStartedAt ----

describe("formatStartedAt", () => {
  it("returns 開始日不明 when value is undefined", () => {
    expect(formatStartedAt(undefined)).toBe("開始日不明");
  });

  it("returns 開始日不明 when value is empty string", () => {
    expect(formatStartedAt("")).toBe("開始日不明");
  });

  it("returns 開始日不明 when value is an invalid date string", () => {
    expect(formatStartedAt("not-a-date")).toBe("開始日不明");
  });

  it("returns a string containing the year for a valid ISO string", () => {
    const result = formatStartedAt("2026-02-14T10:00:00Z");
    expect(result).toContain("2026");
  });
});

// ---- resolveStartedAt ----

describe("resolveStartedAt", () => {
  it("returns metadata.startedAt when present", () => {
    const item = makeItem({
      sessionId: "s1",
      metadata: { startedAt: "2026-02-14T10:00:00Z" },
    });
    expect(resolveStartedAt(item)).toBe("2026-02-14T10:00:00Z");
  });

  it("returns earliest action createdAt as ISO string when metadata.startedAt is absent", () => {
    const item = makeItem({
      sessionId: "s1",
      actions: [
        makeMessage("m1", "2026-02-14T12:00:00Z"),
        makeMessage("m2", "2026-02-14T10:00:00Z"),
        makeMessage("m3", "2026-02-14T11:00:00Z"),
      ],
    });
    const result = resolveStartedAt(item);
    expect(result).toBe(new Date("2026-02-14T10:00:00Z").toISOString());
  });

  it("returns undefined when metadata.startedAt is absent and actions is empty", () => {
    const item = makeItem({ sessionId: "s1" });
    expect(resolveStartedAt(item)).toBeUndefined();
  });

  it("returns undefined when all action createdAt values are invalid dates", () => {
    const item = makeItem({
      sessionId: "s1",
      actions: [
        makeMessage("m1", "not-a-date"),
        makeMessage("m2", "also-invalid"),
      ],
    });
    expect(resolveStartedAt(item)).toBeUndefined();
  });

  it("returns the minimum (earliest) timestamp across multiple actions", () => {
    const item = makeItem({
      sessionId: "s1",
      actions: [
        makeMessage("m1", "2026-03-01T08:00:00Z"),
        makeMessage("m2", "2026-01-15T08:00:00Z"),
        makeMessage("m3", "2026-02-20T08:00:00Z"),
      ],
    });
    const result = resolveStartedAt(item);
    expect(result).toBe(new Date("2026-01-15T08:00:00Z").toISOString());
  });
});

// ---- normalizeOptionalText ----

describe("normalizeOptionalText", () => {
  it("returns null when value is undefined", () => {
    expect(normalizeOptionalText(undefined)).toBeNull();
  });

  it("returns null when value is null", () => {
    expect(normalizeOptionalText(null)).toBeNull();
  });

  it("returns null when value is empty string", () => {
    expect(normalizeOptionalText("")).toBeNull();
  });

  it("returns null when value is whitespace-only", () => {
    expect(normalizeOptionalText("   ")).toBeNull();
  });

  it("returns trimmed string for a value with surrounding whitespace", () => {
    expect(normalizeOptionalText("  hello  ")).toBe("hello");
  });

  it("returns the value unchanged when there is no surrounding whitespace", () => {
    expect(normalizeOptionalText("hello")).toBe("hello");
  });
});
