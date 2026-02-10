import { comingSoonScenarioCatalog, homeScenarioCatalog } from "@/config";
import type {
  HistoryItem,
  ScenarioCatalogCategory,
  ScenarioCatalogSubcategory,
  ScenarioSummary,
} from "@/types";
import { useStorage } from "@/hooks/useStorage";
import { Link } from "react-router-dom";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";

const revealDelay = (delay: number): CSSProperties => ({ "--delay": `${delay}ms` } as CSSProperties);

const homeScenarioIds = homeScenarioCatalog.flatMap((category: ScenarioCatalogCategory) =>
  category.subcategories.flatMap((subcategory: ScenarioCatalogSubcategory) =>
    subcategory.scenarios.map((scenario: ScenarioSummary) => scenario.id)
  )
);
const scrollableSubcategoryIds = new Set(["test-case-creation"]);

type JourneyStage = {
  role: string;
  goal: string;
};

type RoadmapMilestone = {
  id: string;
  title: string;
  categoryId?: string;
};

type CategoryPalette = {
  timeline: string;
  stepBadge: string;
  cardSurface: string;
  stageLabel: string;
  metricPill: string;
  progressTrack: string;
  progressFill: string;
  subcategoryLabel: string;
  incompleteScenario: string;
  interruptedBadge: string;
};

type MilestoneTone = {
  dotIdle: string;
  dotActive: string;
  dotReached: string;
  chipIdle: string;
  chipActive: string;
  chipReached: string;
};

const journeyStages: JourneyStage[] = [
  {
    role: "Novice PM",
    goal: "対話と段取りの基礎を固める",
  },
  {
    role: "Developing PM",
    goal: "品質視点で仕様を検証できるようになる",
  },
  {
    role: "Trained PM",
    goal: "複雑な調整を主導して価値に繋げる",
  },
];

const roadmapMilestones: RoadmapMilestone[] = [
  { id: "milestone-1", title: "基礎ソフトスキル", categoryId: "soft-skills" },
  { id: "milestone-2", title: "テスト設計", categoryId: "test-cases" },
  { id: "milestone-3", title: "要件定義" },
  { id: "milestone-4", title: "計画立案" },
  { id: "milestone-5", title: "合意形成" },
  { id: "milestone-6", title: "事業推進" },
];

const categoryPalettes: CategoryPalette[] = [
  {
    timeline: "bg-gradient-to-b from-orange-300/90 via-amber-300/65 to-orange-200/15",
    stepBadge:
      "border-orange-300/80 bg-orange-100 text-orange-700 shadow-[0_8px_16px_rgba(176,95,35,0.18)]",
    cardSurface: "border-orange-200/70 bg-gradient-to-br from-orange-50/70 via-white/90 to-amber-50/70",
    stageLabel: "text-orange-700/85",
    metricPill: "border-orange-200/70 bg-orange-50/80",
    progressTrack: "bg-orange-100/70",
    progressFill: "bg-gradient-to-r from-orange-500 to-amber-400",
    subcategoryLabel: "text-orange-700/80",
    incompleteScenario: "border-orange-200/70 bg-white/75",
    interruptedBadge: "bg-orange-100 text-orange-700",
  },
  {
    timeline: "bg-gradient-to-b from-sky-300/90 via-cyan-300/65 to-sky-200/15",
    stepBadge:
      "border-sky-300/80 bg-sky-100 text-sky-700 shadow-[0_8px_16px_rgba(22,94,179,0.16)]",
    cardSurface: "border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-white/90 to-cyan-50/70",
    stageLabel: "text-sky-700/85",
    metricPill: "border-sky-200/70 bg-sky-50/80",
    progressTrack: "bg-sky-100/70",
    progressFill: "bg-gradient-to-r from-sky-500 to-cyan-400",
    subcategoryLabel: "text-sky-700/80",
    incompleteScenario: "border-sky-200/70 bg-white/75",
    interruptedBadge: "bg-sky-100 text-sky-700",
  },
  {
    timeline: "bg-gradient-to-b from-rose-300/90 via-pink-300/65 to-rose-200/15",
    stepBadge:
      "border-rose-300/80 bg-rose-100 text-rose-700 shadow-[0_8px_16px_rgba(190,24,93,0.15)]",
    cardSurface: "border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-white/90 to-pink-50/70",
    stageLabel: "text-rose-700/85",
    metricPill: "border-rose-200/70 bg-rose-50/80",
    progressTrack: "bg-rose-100/70",
    progressFill: "bg-gradient-to-r from-rose-500 to-pink-400",
    subcategoryLabel: "text-rose-700/80",
    incompleteScenario: "border-rose-200/70 bg-white/75",
    interruptedBadge: "bg-rose-100 text-rose-700",
  },
];

const milestoneTones: MilestoneTone[] = [
  {
    dotIdle: "bg-orange-200",
    dotActive: "bg-orange-500",
    dotReached: "bg-orange-600",
    chipIdle: "bg-orange-50 text-orange-700",
    chipActive: "bg-orange-100 text-orange-800",
    chipReached: "bg-orange-600 text-white",
  },
  {
    dotIdle: "bg-sky-200",
    dotActive: "bg-sky-500",
    dotReached: "bg-sky-600",
    chipIdle: "bg-sky-50 text-sky-700",
    chipActive: "bg-sky-100 text-sky-800",
    chipReached: "bg-sky-600 text-white",
  },
  {
    dotIdle: "bg-rose-200",
    dotActive: "bg-rose-500",
    dotReached: "bg-rose-600",
    chipIdle: "bg-rose-50 text-rose-700",
    chipActive: "bg-rose-100 text-rose-800",
    chipReached: "bg-rose-600 text-white",
  },
  {
    dotIdle: "bg-emerald-200",
    dotActive: "bg-emerald-500",
    dotReached: "bg-emerald-600",
    chipIdle: "bg-emerald-50 text-emerald-700",
    chipActive: "bg-emerald-100 text-emerald-800",
    chipReached: "bg-emerald-600 text-white",
  },
  {
    dotIdle: "bg-indigo-200",
    dotActive: "bg-indigo-500",
    dotReached: "bg-indigo-600",
    chipIdle: "bg-indigo-50 text-indigo-700",
    chipActive: "bg-indigo-100 text-indigo-800",
    chipReached: "bg-indigo-600 text-white",
  },
  {
    dotIdle: "bg-amber-200",
    dotActive: "bg-amber-500",
    dotReached: "bg-amber-600",
    chipIdle: "bg-amber-50 text-amber-700",
    chipActive: "bg-amber-100 text-amber-800",
    chipReached: "bg-amber-600 text-white",
  },
];

const getCategoryScenarios = (category: ScenarioCatalogCategory): ScenarioSummary[] => {
  const uniqueById = new Map<string, ScenarioSummary>();
  category.subcategories.forEach((subcategory) => {
    subcategory.scenarios.forEach((scenario) => {
      uniqueById.set(scenario.id, scenario);
    });
  });
  return Array.from(uniqueById.values());
};

const getCategoryTitle = (category: ScenarioCatalogCategory, index: number): string => {
  if (category.title.trim().length > 0) return category.title;
  if (category.subcategories.length === 1) return category.subcategories[0].title;
  return `ステージ ${index + 1}`;
};

const getMilestoneTone = (id: string): MilestoneTone => {
  const numericIndex = Number(id.replace("milestone-", "")) - 1;
  if (Number.isFinite(numericIndex) && numericIndex >= 0) {
    return milestoneTones[numericIndex % milestoneTones.length];
  }
  return milestoneTones[0];
};

const resolveHistoryTimestamp = (item: HistoryItem): number => {
  const candidates: number[] = [];
  if (item.metadata?.startedAt) {
    const startedAt = Date.parse(item.metadata.startedAt);
    if (!Number.isNaN(startedAt)) candidates.push(startedAt);
  }
  (item.actions ?? []).forEach((action) => {
    const actionTimestamp = Date.parse(action.createdAt);
    if (!Number.isNaN(actionTimestamp)) candidates.push(actionTimestamp);
  });
  return candidates.length > 0 ? Math.max(...candidates) : 0;
};

export function HomePage() {
  const storage = useStorage();
  const [savedByScenario, setSavedByScenario] = useState<Record<string, boolean>>({});

  const { data: historyItems = [], isLoading: isHistoryLoading, isError, error } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });

  useEffect(() => {
    async function loadSavedSessions() {
      const entries = await Promise.all(
        homeScenarioIds.map(async (scenarioId) => {
          const lastSessionId = await storage.loadLastSessionId(scenarioId);
          return [scenarioId, !!lastSessionId] as const;
        })
      );
      setSavedByScenario(Object.fromEntries(entries));
    }
    void loadSavedSessions();
  }, [storage]);

  const completedSessionIdsByScenario = useMemo(() => {
    const latestByScenario = new Map<string, { sessionId: string; timestamp: number }>();
    historyItems.forEach((item) => {
      if (!item.scenarioId || !item.evaluation) return;
      const timestamp = resolveHistoryTimestamp(item);
      const existing = latestByScenario.get(item.scenarioId);
      if (!existing || timestamp > existing.timestamp) {
        latestByScenario.set(item.scenarioId, { sessionId: item.sessionId, timestamp });
      }
    });
    return new Map(
      Array.from(latestByScenario.entries()).map(([scenarioId, value]) => [scenarioId, value.sessionId])
    );
  }, [historyItems]);
  const completedScenarioIds = useMemo(
    () => new Set<string>(completedSessionIdsByScenario.keys()),
    [completedSessionIdsByScenario]
  );

  const roadmap = useMemo(
    () =>
      homeScenarioCatalog.map((category, index) => {
        const scenarios = getCategoryScenarios(category);
        const completedCount = scenarios.filter((scenario) => completedScenarioIds.has(scenario.id)).length;
        const totalCount = scenarios.length;
        return {
          ...category,
          stepNumber: index + 1,
          stage: journeyStages[index] ?? journeyStages[journeyStages.length - 1],
          title: getCategoryTitle(category, index),
          completedCount,
          totalCount,
          progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      }),
    [completedScenarioIds]
  );

  const comingSoonRoadmap = useMemo(
    () =>
      comingSoonScenarioCatalog.map((category, index) => {
        const scenarios = getCategoryScenarios(category);
        const absoluteIndex = roadmap.length + index;
        return {
          ...category,
          stepNumber: absoluteIndex + 1,
          stage: journeyStages[absoluteIndex] ?? journeyStages[journeyStages.length - 1],
          title: getCategoryTitle(category, absoluteIndex),
          totalCount: scenarios.length,
        };
      }),
    [roadmap.length]
  );

  const totalScenarios = useMemo(
    () =>
      roadmap.reduce((sum, category) => {
        return sum + category.totalCount;
      }, 0),
    [roadmap]
  );

  const completedScenarios = useMemo(
    () =>
      roadmap.reduce((sum, category) => {
        return sum + category.completedCount;
      }, 0),
    [roadmap]
  );

  const categoryById = useMemo(() => new Map(roadmap.map((category) => [category.id, category])), [roadmap]);
  const milestoneProgress = useMemo(() => {
    return roadmapMilestones.map((milestone) => {
      const linkedCategory = milestone.categoryId ? categoryById.get(milestone.categoryId) : undefined;
      const totalCount = linkedCategory?.totalCount ?? 0;
      const completedCount = linkedCategory?.completedCount ?? 0;
      const ratio = totalCount > 0 ? completedCount / totalCount : 0;
      const hasScenarios = totalCount > 0;

      return {
        id: milestone.id,
        title: milestone.title,
        hasScenarios,
        ratio,
        reached: ratio >= 1,
      };
    });
  }, [categoryById]);

  const overallProgress = useMemo(() => {
    if (milestoneProgress.length === 0) return 0;
    const totalRatio = milestoneProgress.reduce((sum, milestone) => sum + milestone.ratio, 0);
    return Math.round((totalRatio / milestoneProgress.length) * 100);
  }, [milestoneProgress]);

  const currentMilestone = useMemo(
    () =>
      milestoneProgress.find((milestone) => milestone.hasScenarios && milestone.ratio > 0 && milestone.ratio < 1) ??
      milestoneProgress.find((milestone) => milestone.hasScenarios && milestone.ratio === 0) ??
      milestoneProgress.find((milestone) => !milestone.reached) ??
      milestoneProgress[milestoneProgress.length - 1],
    [milestoneProgress]
  );

  return (
    <div className="space-y-8">
      <section
        className="card relative overflow-hidden border-orange-200/70 bg-gradient-to-br from-orange-50/80 via-white/92 to-sky-50/70 p-6 reveal sm:p-8"
        style={revealDelay(120)}
      >
        <div
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-orange-200/50 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-12 bottom-8 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute left-1/3 top-8 h-32 w-32 rounded-full bg-rose-200/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative space-y-5">
          <div className="space-y-2">
            <p className="bg-gradient-to-r from-orange-700 via-sky-700 to-emerald-700 bg-clip-text text-xs font-semibold uppercase tracking-[0.28em] text-transparent">
              PM Roadmap
            </p>
            <h1 className="font-display text-2xl text-slate-900 sm:text-3xl">学習ロードマップ</h1>
            <p className="max-w-3xl text-sm text-slate-600">
              カテゴリ順に進めることで、基礎スキルから実践力まで段階的に伸ばせます。各カテゴリの完了状況を見ながら次の一歩を選んでください。
            </p>
          </div>

          <div className="rounded-2xl border border-orange-200/70 bg-white/80 px-4 py-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Progress</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 tabular-nums">{overallProgress}%</p>
              </div>
              <p className="text-xs text-slate-600">
                現在地: {currentMilestone ? currentMilestone.title : "未開始"}
              </p>
            </div>

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="relative min-w-[38rem] sm:min-w-full">
                <div className="pointer-events-none absolute left-0 right-0 top-2 h-2 rounded-full bg-orange-100/80" />
                <div
                  className="pointer-events-none absolute left-0 top-2 h-2 rounded-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />

                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${Math.max(milestoneProgress.length, 1)}, minmax(0, 1fr))` }}
                >
                  {milestoneProgress.map((milestone) => {
                    const tone = getMilestoneTone(milestone.id);
                    const dotClass = milestone.reached
                      ? tone.dotReached
                      : currentMilestone?.id === milestone.id
                        ? tone.dotActive
                        : tone.dotIdle;
                    const chipClass = milestone.reached
                      ? tone.chipReached
                      : currentMilestone?.id === milestone.id
                        ? tone.chipActive
                        : tone.chipIdle;
                    return (
                      <div key={milestone.id} className="relative flex flex-col items-center gap-2 text-center">
                        <span className={`z-10 h-4 w-4 rounded-full border-2 border-white shadow-sm ${dotClass}`} />
                        <span
                          className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold leading-snug ${chipClass}`}
                        >
                          {milestone.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isError ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 p-4 text-sm text-rose-700 reveal" style={revealDelay(180)}>
          履歴の読み込みに失敗したため、完了件数は最新ではない可能性があります。{error instanceof Error ? ` ${error.message}` : ""}
        </div>
      ) : null}

      <section className="space-y-6 reveal" style={revealDelay(220)}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Learning Journey</p>
            <h2 className="font-display text-xl text-slate-900 sm:text-2xl">シナリオ学習ロードマップ</h2>
          </div>
          {isHistoryLoading ? (
            <span className="text-xs text-slate-500">進捗を集計中...</span>
          ) : (
            <span className="text-xs text-slate-500">カテゴリ {roadmap.length} ステップ</span>
          )}
        </div>

        <div className="space-y-6">
          {roadmap.map((category, categoryIndex) => {
            const hasNext = categoryIndex < roadmap.length - 1;
            const palette = categoryPalettes[categoryIndex % categoryPalettes.length];
            return (
              <article key={category.id} className="relative pl-12">
                {hasNext ? (
                  <div
                    aria-hidden="true"
                    className={`absolute left-[1.05rem] top-10 h-[calc(100%+1.5rem)] w-px ${palette.timeline}`}
                  />
                ) : null}

                <div className={`absolute left-0 top-5 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${palette.stepBadge}`}>
                  {category.stepNumber}
                </div>

                <div className={`card space-y-4 border p-5 sm:p-6 ${palette.cardSurface}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${palette.stageLabel}`}>{category.stage.role}</p>
                      <h3 className="font-display text-xl text-slate-900">{category.title}</h3>
                      <p className="text-sm text-slate-600">{category.stage.goal}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-right ${palette.metricPill}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">完了数</p>
                      <p className="text-lg font-semibold text-slate-900 tabular-nums">
                        {category.completedCount} / {category.totalCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>カテゴリ進捗</span>
                      <span>{category.progress}%</span>
                    </div>
                    <div className={`h-2 overflow-hidden rounded-full ${palette.progressTrack}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${palette.progressFill}`}
                        style={{ width: `${category.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.subcategories.map((subcategory) => {
                      const isScrollableSubcategory = scrollableSubcategoryIds.has(subcategory.id);
                      return (
                        <div key={subcategory.id} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.subcategoryLabel}`}>{subcategory.title}</p>
                            {isScrollableSubcategory ? (
                              <span className="text-[11px] text-slate-500">スクロールで表示</span>
                            ) : null}
                          </div>
                          <div className={isScrollableSubcategory ? "max-h-[27rem] overflow-y-auto pr-1 no-scrollbar" : undefined}>
                            <ul className="space-y-2">
                              {subcategory.scenarios.map((scenario) => {
                                const completedSessionId = completedSessionIdsByScenario.get(scenario.id);
                                const completed = Boolean(completedSessionId);
                                const interrupted = savedByScenario[scenario.id] && !completed;
                                return (
                                  <li
                                    key={scenario.id}
                                    className={`rounded-xl border px-3 py-3 transition sm:px-4 ${
                                      completed
                                        ? "border-emerald-200/80 bg-emerald-50/60"
                                        : palette.incompleteScenario
                                    }`}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                                        <p className="text-xs text-slate-600">{scenario.description}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {completed ? (
                                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            完了
                                          </span>
                                        ) : null}
                                        {interrupted ? (
                                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette.interruptedBadge}`}>
                                            中断中
                                          </span>
                                        ) : null}
                                        <Link
                                          className="btn-secondary !px-3 !py-1.5 !text-xs"
                                          to={
                                            completedSessionId
                                              ? `/history/${completedSessionId}`
                                              : `/scenario?scenarioId=${scenario.id}&restart=1`
                                          }
                                        >
                                          {completed ? "詳細" : interrupted ? "再開" : "開始"}
                                        </Link>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="space-y-6 reveal" style={revealDelay(360)}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Next Milestones</p>
          <h2 className="font-display text-xl text-slate-900 sm:text-2xl">Coming Soon</h2>
          <p className="text-sm text-slate-600">今後ロードマップに追加予定のシナリオ</p>
        </div>

        <div className="space-y-6">
          {comingSoonRoadmap.map((category, categoryIndex) => {
            const hasNext = categoryIndex < comingSoonRoadmap.length - 1;
            const palette = categoryPalettes[(roadmap.length + categoryIndex) % categoryPalettes.length];

            return (
              <article key={category.id} className="relative pl-12">
                {hasNext ? (
                  <div
                    aria-hidden="true"
                    className={`absolute left-[1.05rem] top-10 h-[calc(100%+1.5rem)] w-px ${palette.timeline}`}
                  />
                ) : null}

                <div
                  className={`absolute left-0 top-5 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${palette.stepBadge}`}
                >
                  {category.stepNumber}
                </div>

                <div className={`card space-y-4 border p-5 sm:p-6 ${palette.cardSurface}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${palette.stageLabel}`}>
                        {category.stage.role}
                      </p>
                      <h3 className="font-display text-xl text-slate-900">{category.title}</h3>
                      <p className="text-sm text-slate-600">{category.stage.goal}</p>
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-right ${palette.metricPill}`}>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">公開予定</p>
                      <p className="text-lg font-semibold text-slate-900 tabular-nums">{category.totalCount} 件</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {category.subcategories.map((subcategory, subcategoryIndex) => {
                      const tone = milestoneTones[(roadmap.length + categoryIndex + subcategoryIndex) % milestoneTones.length];
                      return (
                        <div key={subcategory.id} className="space-y-2">
                          <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.subcategoryLabel}`}>
                            {subcategory.title}
                          </p>
                          <ul className="space-y-2">
                            {subcategory.scenarios.map((scenario) => (
                              <li key={scenario.id} className={`rounded-xl border px-3 py-3 transition sm:px-4 ${palette.incompleteScenario}`}>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                                    <p className="text-xs text-slate-600">{scenario.description}</p>
                                  </div>
                                  <span
                                    className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${tone.chipIdle}`}
                                  >
                                    Soon
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
