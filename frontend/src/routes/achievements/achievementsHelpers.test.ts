import { describe, it, expect } from "vitest";
import type { HistoryItem } from "@/types";
import { computeAchievementStats } from "./achievementsHelpers";

// ---- Test helper ----

const makeItem = (
  overrides: Partial<HistoryItem> & { sessionId: string }
): HistoryItem => ({
  metadata: {},
  actions: [],
  ...overrides,
});

// ---- Tests ----

describe("computeAchievementStats", () => {
  it("returns zero/null defaults for empty items array", () => {
    const result = computeAchievementStats([]);
    expect(result.totalSessions).toBe(0);
    expect(result.uniqueScenarios).toBe(0);
    expect(result.evaluatedSessions).toBe(0);
    expect(result.passingSessions).toBe(0);
    expect(result.highScoreSessions).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.bestScore).toBeNull();
    expect(result.passRate).toBe(0);
  });

  it("counts a single session without evaluation correctly", () => {
    const items: HistoryItem[] = [
      makeItem({ sessionId: "s1", scenarioId: "sc-1" }),
    ];
    const result = computeAchievementStats(items);
    expect(result.totalSessions).toBe(1);
    expect(result.evaluatedSessions).toBe(0);
    expect(result.passingSessions).toBe(0);
    expect(result.averageScore).toBeNull();
    expect(result.bestScore).toBeNull();
    expect(result.passRate).toBe(0);
  });

  it("handles a single passing session with score 85", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: {
          sessionId: "s1",
          categories: [],
          passing: true,
          overallScore: 85,
        },
      }),
    ];
    const result = computeAchievementStats(items);
    expect(result.totalSessions).toBe(1);
    expect(result.evaluatedSessions).toBe(1);
    expect(result.passingSessions).toBe(1);
    expect(result.averageScore).toBe(85);
    expect(result.bestScore).toBe(85);
    expect(result.passRate).toBe(100);
    expect(result.highScoreSessions).toBe(1);
  });

  it("computes correct stats for mixed sessions: 3 sessions, 2 evaluated (passing score 90, failing score 60)", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        scenarioId: "sc-1",
        evaluation: {
          sessionId: "s1",
          categories: [],
          passing: true,
          overallScore: 90,
        },
      }),
      makeItem({
        sessionId: "s2",
        scenarioId: "sc-2",
        evaluation: {
          sessionId: "s2",
          categories: [],
          passing: false,
          overallScore: 60,
        },
      }),
      makeItem({ sessionId: "s3", scenarioId: "sc-3" }),
    ];
    const result = computeAchievementStats(items);
    expect(result.totalSessions).toBe(3);
    expect(result.evaluatedSessions).toBe(2);
    expect(result.passingSessions).toBe(1);
    expect(result.averageScore).toBe(75);
    expect(result.bestScore).toBe(90);
    expect(result.passRate).toBe(50);
    expect(result.highScoreSessions).toBe(1);
  });

  it("counts unique scenarioIds correctly when sessions share scenario ids", () => {
    const items: HistoryItem[] = [
      makeItem({ sessionId: "s1", scenarioId: "sc-1" }),
      makeItem({ sessionId: "s2", scenarioId: "sc-2" }),
      makeItem({ sessionId: "s3", scenarioId: "sc-1" }),
    ];
    const result = computeAchievementStats(items);
    expect(result.totalSessions).toBe(3);
    expect(result.uniqueScenarios).toBe(2);
  });

  it("counts evaluatedSessions but not scores when evaluation has no overallScore", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        evaluation: {
          sessionId: "s1",
          categories: [],
          passing: true,
        },
      }),
    ];
    const result = computeAchievementStats(items);
    expect(result.evaluatedSessions).toBe(1);
    expect(result.averageScore).toBeNull();
    expect(result.bestScore).toBeNull();
  });

  it("counts score of exactly 80 as a high score session", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        evaluation: {
          sessionId: "s1",
          categories: [],
          overallScore: 80,
        },
      }),
    ];
    const result = computeAchievementStats(items);
    expect(result.highScoreSessions).toBe(1);
  });

  it("does not count a score of 79 as a high score session", () => {
    const items: HistoryItem[] = [
      makeItem({
        sessionId: "s1",
        evaluation: {
          sessionId: "s1",
          categories: [],
          overallScore: 79,
        },
      }),
    ];
    const result = computeAchievementStats(items);
    expect(result.highScoreSessions).toBe(0);
  });
});
