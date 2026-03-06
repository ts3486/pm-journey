import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";
import { computeAchievementStats } from "@/routes/achievements/achievementsHelpers";
import { LoadingIndicator } from "@/components/LoadingIndicator";

type Achievement = {
  id: string;
  title: string;
  current: number;
  target: number;
};

export function AchievementWidget() {
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });

  const stats = useMemo(() => computeAchievementStats(items), [items]);

  const achievements = useMemo<Achievement[]>(
    () => [
      {
        id: "first-session",
        title: "はじめの一歩",
        current: stats.totalSessions,
        target: 1,
      },
      {
        id: "steady-practice",
        title: "継続トレーニー",
        current: stats.totalSessions,
        target: 5,
      },
      {
        id: "evaluator",
        title: "評価チャレンジャー",
        current: stats.evaluatedSessions,
        target: 3,
      },
      {
        id: "high-score",
        title: "ハイスコア",
        current: stats.highScoreSessions,
        target: 1,
      },
      {
        id: "consistent-pass",
        title: "安定した成果",
        current: stats.evaluatedSessions >= 3 ? stats.passRate : 0,
        target: 70,
      },
    ],
    [stats]
  );

  const unlockedCount = achievements.filter((a) => a.current >= a.target).length;

  if (isLoading) {
    return (
      <div className="card p-5">
        <LoadingIndicator size="sm" />
      </div>
    );
  }

  if (isError) {
    return null;
  }

  const topThree = achievements.slice(0, 3);

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold text-slate-900">実績</p>
        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
          {unlockedCount} / {achievements.length} 達成
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-orange-100/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
          style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {topThree.map((achievement) => {
          const unlocked = achievement.current >= achievement.target;
          const progressRatio = Math.min(achievement.current / achievement.target, 1);
          return (
            <div key={achievement.id} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-slate-700">{achievement.title}</p>
                {unlocked ? (
                  <span className="text-xs text-emerald-600 font-semibold">✓</span>
                ) : null}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    unlocked ? "bg-emerald-500" : "bg-orange-400"
                  }`}
                  style={{ width: `${progressRatio * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/achievements"
        className="block text-sm font-semibold text-orange-600 hover:text-orange-700"
      >
        すべて見る →
      </Link>
    </div>
  );
}
