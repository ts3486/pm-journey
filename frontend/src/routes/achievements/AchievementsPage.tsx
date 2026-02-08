import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";

type Achievement = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit?: string;
};

type StatCardProps = {
  label: string;
  value: string;
  sublabel: string;
};

function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="card space-y-2 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}

export function AchievementsPage() {
  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });

  const stats = useMemo(() => {
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
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
    const bestScore = scores.length > 0 ? Math.max(...scores) : null;
    const passRate = evaluatedSessions > 0 ? Math.round((passingSessions / evaluatedSessions) * 100) : 0;

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
  }, [items]);

  const achievements = useMemo<Achievement[]>(
    () => [
      {
        id: "first-session",
        title: "はじめの一歩",
        description: "1つ目のセッションを完了",
        current: stats.totalSessions,
        target: 1,
        unit: "セッション",
      },
      {
        id: "steady-practice",
        title: "継続トレーニー",
        description: "5セッションを完了",
        current: stats.totalSessions,
        target: 5,
        unit: "セッション",
      },
      {
        id: "evaluator",
        title: "評価チャレンジャー",
        description: "3セッションで評価を取得",
        current: stats.evaluatedSessions,
        target: 3,
        unit: "評価",
      },
      {
        id: "high-score",
        title: "ハイスコア",
        description: "80点以上を1回達成",
        current: stats.highScoreSessions,
        target: 1,
        unit: "回",
      },
      {
        id: "consistent-pass",
        title: "安定した成果",
        description: "評価3件以上で合格率70%以上を達成",
        current: stats.evaluatedSessions >= 3 ? stats.passRate : 0,
        target: 70,
        unit: "%",
      },
    ],
    [stats]
  );

  const unlockedCount = achievements.filter((achievement) => achievement.current >= achievement.target).length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Achievements</p>
        <h1 className="font-display text-2xl text-slate-900">実績</h1>
        <p className="text-sm text-slate-600">これまでのセッションと評価結果から達成状況を確認できます。</p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-600">読み込み中...</div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 p-6 text-sm text-rose-700">
          {error instanceof Error ? error.message : "実績の取得に失敗しました"}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="総セッション" value={String(stats.totalSessions)} sublabel="完了したシナリオ数" />
            <StatCard label="評価取得" value={String(stats.evaluatedSessions)} sublabel="フィードバック済みの回数" />
            <StatCard
              label="平均スコア"
              value={stats.averageScore != null ? String(stats.averageScore) : "--"}
              sublabel="評価があるセッションのみ"
            />
            <StatCard
              label="合格率"
              value={`${stats.passRate}%`}
              sublabel={stats.evaluatedSessions > 0 ? `${stats.passingSessions} / ${stats.evaluatedSessions}` : "評価データなし"}
            />
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-slate-900">達成一覧</h2>
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                {unlockedCount} / {achievements.length} 達成
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {achievements.map((achievement) => {
                const unlocked = achievement.current >= achievement.target;
                const progressRatio = Math.min(achievement.current / achievement.target, 1);
                const progressPercent = Math.round(progressRatio * 100);
                const progressValue = achievement.unit === "%" ? achievement.current : `${achievement.current} / ${achievement.target}`;

                return (
                  <article
                    key={achievement.id}
                    className={`rounded-2xl border p-4 shadow-sm ${
                      unlocked
                        ? "border-emerald-200/80 bg-emerald-50/70"
                        : "border-slate-200/80 bg-white/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">{achievement.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{achievement.description}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          unlocked ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {unlocked ? "達成済み" : "進行中"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            unlocked ? "bg-emerald-500" : "bg-orange-500"
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        進捗: {progressValue}
                        {achievement.unit === "%" ? " / 70%" : ""}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-slate-900">プレイ状況メモ</h2>
            <p className="mt-2 text-sm text-slate-600">挑戦したシナリオ数: {stats.uniqueScenarios}</p>
            <p className="text-sm text-slate-600">
              最高スコア: {stats.bestScore != null ? `${stats.bestScore} / 100` : "まだ評価がありません"}
            </p>
          </section>
        </>
      )}
    </div>
  );
}
