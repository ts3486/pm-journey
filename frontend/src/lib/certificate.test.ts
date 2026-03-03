import { describe, it, expect } from "vitest";
import type { HistoryItem, ScenarioCatalogCategory } from "@/types";
import {
  resolveHistoryTimestamp,
  computePassedScenarioIds,
  computeCertificateStatus,
} from "./certificate";

// ---- Test helpers ----

const makeItem = (
  overrides: Partial<HistoryItem> & { sessionId: string; scenarioId?: string }
): HistoryItem => ({
  metadata: {},
  actions: [],
  ...overrides,
});

const makeCatalog = (
  categories: Array<{
    id: string;
    title: string;
    scenarioIds: string[];
  }>
): ScenarioCatalogCategory[] =>
  categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    subcategories: [
      {
        id: `${cat.id}-sub`,
        title: cat.title,
        scenarios: cat.scenarioIds.map((id) => ({ id, title: id, description: "" })),
      },
    ],
  }));

// ---- Tests ----

describe("resolveHistoryTimestamp", () => {
  it("returns 0 when no timestamps exist", () => {
    expect(resolveHistoryTimestamp(makeItem({ sessionId: "s1" }))).toBe(0);
  });

  it("uses metadata.startedAt when available", () => {
    const item = makeItem({
      sessionId: "s1",
      metadata: { startedAt: "2025-01-15T10:00:00Z" },
    });
    expect(resolveHistoryTimestamp(item)).toBe(Date.parse("2025-01-15T10:00:00Z"));
  });

  it("uses action timestamps", () => {
    const item = makeItem({
      sessionId: "s1",
      actions: [
        { id: "m1", sessionId: "s1", role: "user", content: "hi", createdAt: "2025-01-15T11:00:00Z" },
        { id: "m2", sessionId: "s1", role: "agent", content: "hello", createdAt: "2025-01-15T12:00:00Z" },
      ],
    });
    expect(resolveHistoryTimestamp(item)).toBe(Date.parse("2025-01-15T12:00:00Z"));
  });

  it("returns the maximum of all timestamps", () => {
    const item = makeItem({
      sessionId: "s1",
      metadata: { startedAt: "2025-01-15T13:00:00Z" },
      actions: [
        { id: "m1", sessionId: "s1", role: "user", content: "hi", createdAt: "2025-01-15T11:00:00Z" },
      ],
    });
    expect(resolveHistoryTimestamp(item)).toBe(Date.parse("2025-01-15T13:00:00Z"));
  });
});

describe("computePassedScenarioIds", () => {
  it("returns empty set for empty history", () => {
    expect(computePassedScenarioIds([])).toEqual(new Set());
  });

  it("includes scenario when evaluation.passing is true", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: { sessionId: "s1", categories: [], passing: true },
      }),
    ];
    expect(computePassedScenarioIds(items)).toEqual(new Set(["sc-1"]));
  });

  it("excludes scenario when evaluation exists but passing is false", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: { sessionId: "s1", categories: [], passing: false },
      }),
    ];
    expect(computePassedScenarioIds(items)).toEqual(new Set());
  });

  it("excludes scenario when evaluation exists but passing is undefined", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: { sessionId: "s1", categories: [] },
      }),
    ];
    expect(computePassedScenarioIds(items)).toEqual(new Set());
  });

  it("excludes items without scenarioId", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        evaluation: { sessionId: "s1", categories: [], passing: true },
      }),
    ];
    expect(computePassedScenarioIds(items)).toEqual(new Set());
  });

  it("deduplicates across multiple passing sessions for the same scenario", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: { sessionId: "s1", categories: [], passing: true },
      }),
      makeItem({
        sessionId: "s2",
        scenarioId: "sc-1",
        evaluation: { sessionId: "s2", categories: [], passing: true },
      }),
    ];
    expect(computePassedScenarioIds(items)).toEqual(new Set(["sc-1"]));
  });
});

describe("computeCertificateStatus", () => {
  const catalog = makeCatalog([
    { id: "cat-a", title: "Category A", scenarioIds: ["a1", "a2", "a3"] },
    { id: "cat-b", title: "Category B", scenarioIds: ["b1", "b2", "b3"] },
  ]);

  it("returns zero progress for empty history", () => {
    const result = computeCertificateStatus([], catalog);
    expect(result.totalRequired).toBe(6);
    expect(result.totalPassed).toBe(0);
    expect(result.allPassed).toBe(false);
    expect(result.earnedAt).toBeUndefined();
    expect(result.categories).toHaveLength(2);
    expect(result.categories[0].passedCount).toBe(0);
    expect(result.categories[0].allPassed).toBe(false);
  });

  it("counts passing scenarios per category", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "a1",
        evaluation: { sessionId: "s1", categories: [], passing: true },
      }),
      makeItem({
        sessionId: "s2",
        scenarioId: "a2",
        evaluation: { sessionId: "s2", categories: [], passing: true },
      }),
      makeItem({
        sessionId: "s3",
        scenarioId: "b1",
        evaluation: { sessionId: "s3", categories: [], passing: false },
      }),
    ];
    const result = computeCertificateStatus(items, catalog);
    expect(result.totalPassed).toBe(2);
    expect(result.categories[0].passedCount).toBe(2);
    expect(result.categories[0].allPassed).toBe(false);
    expect(result.categories[1].passedCount).toBe(0);
  });

  it("marks category as allPassed when all scenarios pass", () => {
    const items: HistoryItem[] = [
      makeItem({ sessionId: "s1", scenarioId: "a1", evaluation: { sessionId: "s1", categories: [], passing: true } }),
      makeItem({ sessionId: "s2", scenarioId: "a2", evaluation: { sessionId: "s2", categories: [], passing: true } }),
      makeItem({ sessionId: "s3", scenarioId: "a3", evaluation: { sessionId: "s3", categories: [], passing: true } }),
    ];
    const result = computeCertificateStatus(items, catalog);
    expect(result.categories[0].allPassed).toBe(true);
    expect(result.categories[1].allPassed).toBe(false);
    expect(result.allPassed).toBe(false);
  });

  it("marks allPassed and computes earnedAt when all scenarios pass", () => {
    const items: HistoryItem[] = [
      makeItem({ sessionId: "s1", scenarioId: "a1", metadata: { startedAt: "2025-01-10T10:00:00Z" }, evaluation: { sessionId: "s1", categories: [], passing: true } }),
      makeItem({ sessionId: "s2", scenarioId: "a2", metadata: { startedAt: "2025-01-11T10:00:00Z" }, evaluation: { sessionId: "s2", categories: [], passing: true } }),
      makeItem({ sessionId: "s3", scenarioId: "a3", metadata: { startedAt: "2025-01-12T10:00:00Z" }, evaluation: { sessionId: "s3", categories: [], passing: true } }),
      makeItem({ sessionId: "s4", scenarioId: "b1", metadata: { startedAt: "2025-01-13T10:00:00Z" }, evaluation: { sessionId: "s4", categories: [], passing: true } }),
      makeItem({ sessionId: "s5", scenarioId: "b2", metadata: { startedAt: "2025-01-14T10:00:00Z" }, evaluation: { sessionId: "s5", categories: [], passing: true } }),
      makeItem({ sessionId: "s6", scenarioId: "b3", metadata: { startedAt: "2025-01-15T10:00:00Z" }, evaluation: { sessionId: "s6", categories: [], passing: true } }),
    ];
    const result = computeCertificateStatus(items, catalog);
    expect(result.allPassed).toBe(true);
    expect(result.totalPassed).toBe(6);
    // earnedAt is the latest "first-pass" across all scenarios (the last one to be passed)
    expect(result.earnedAt).toBe(new Date("2025-01-15T10:00:00Z").toISOString());
  });

  it("handles empty catalog", () => {
    const result = computeCertificateStatus([], []);
    expect(result.totalRequired).toBe(0);
    expect(result.totalPassed).toBe(0);
    expect(result.allPassed).toBe(false);
  });
});
