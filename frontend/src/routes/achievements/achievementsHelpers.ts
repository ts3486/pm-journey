import type { HistoryItem } from "@/types";

export type AchievementStats = {
  totalSessions: number;
  uniqueScenarios: number;
  evaluatedSessions: number;
  passingSessions: number;
  highScoreSessions: number;
  averageScore: number | null;
  bestScore: number | null;
  passRate: number;
};

export function computeAchievementStats(items: HistoryItem[]): AchievementStats {
  const scenarioIds = new Set<string>();
  const scores: number[] = [];
  let evaluatedSessions = 0;
  let passingSessions = 0;

  items.forEach((item) => {
    if (item.scenarioId) {
      scenarioIds.add(item.scenarioId);
    }

    if (item.evaluation) {
      evaluatedSessions += 1;
      if (item.evaluation.passing) {
        passingSessions += 1;
      }
    }

    if (typeof item.evaluation?.overallScore === "number") {
      scores.push(item.evaluation.overallScore);
    }
  });

  const highScoreSessions = scores.filter((score) => score >= 80).length;
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : null;
  const bestScore = scores.length > 0 ? Math.max(...scores) : null;
  const passRate =
    evaluatedSessions > 0
      ? Math.round((passingSessions / evaluatedSessions) * 100)
      : 0;

  return {
    totalSessions: items.length,
    uniqueScenarios: scenarioIds.size,
    evaluatedSessions,
    passingSessions,
    highScoreSessions,
    averageScore,
    bestScore,
    passRate,
  };
}
