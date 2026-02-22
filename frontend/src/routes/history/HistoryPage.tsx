import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";
import { useScenarios, buildHomeScenarioCatalog } from "@/queries/scenarios";
import type { HistoryItem, ScenarioCatalogCategory, ScenarioSummary } from "@/types";
import { Link } from "react-router-dom";
import { useMemo } from "react";

// ---- Helpers from current HistoryPage ----

const formatStartedAt = (value?: string) => {
  if (!value) return "開始日不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "開始日不明";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
  });
};

const resolveStartedAt = (item: HistoryItem) => {
  if (item.metadata?.startedAt) return item.metadata.startedAt;
  const actionTimes = (item.actions ?? [])
    .map((action) => action.createdAt)
    .filter((value) => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .map((value) => value.getTime());
  if (actionTimes.length === 0) return undefined;
  return new Date(Math.min(...actionTimes)).toISOString();
};

// ---- Helpers from HomePage ----

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

// ---- Visual constants (inlined from HomePage) ----

type MilestoneTone = {
  dotIdle: string;
  dotActive: string;
  dotReached: string;
  chipIdle: string;
  chipActive: string;
  chipReached: string;
};

type RoadmapMilestone = {
  id: string;
  title: string;
  categoryId?: string;
};

const roadmapMilestones: RoadmapMilestone[] = [
  { id: "milestone-1", title: "基礎ソフトスキル", categoryId: "soft-skills" },
  { id: "milestone-2", title: "テスト設計", categoryId: "test-cases" },
  { id: "milestone-3", title: "要件定義", categoryId: "requirement-definition" },
  { id: "milestone-4", title: "障害対応", categoryId: "incident-response" },
  { id: "milestone-5", title: "事業推進", categoryId: "business-execution" },
];

const milestoneTones: MilestoneTone[] = [
  {
    dotIdle: "bg-orange-200", dotActive: "bg-orange-500", dotReached: "bg-orange-600",
    chipIdle: "bg-orange-50 text-orange-700", chipActive: "bg-orange-100 text-orange-800", chipReached: "bg-orange-600 text-white",
  },
  {
    dotIdle: "bg-sky-200", dotActive: "bg-sky-500", dotReached: "bg-sky-600",
    chipIdle: "bg-sky-50 text-sky-700", chipActive: "bg-sky-100 text-sky-800", chipReached: "bg-sky-600 text-white",
  },
  {
    dotIdle: "bg-rose-200", dotActive: "bg-rose-500", dotReached: "bg-rose-600",
    chipIdle: "bg-rose-50 text-rose-700", chipActive: "bg-rose-100 text-rose-800", chipReached: "bg-rose-600 text-white",
  },
  {
    dotIdle: "bg-emerald-200", dotActive: "bg-emerald-500", dotReached: "bg-emerald-600",
    chipIdle: "bg-emerald-50 text-emerald-700", chipActive: "bg-emerald-100 text-emerald-800", chipReached: "bg-emerald-600 text-white",
  },
  {
    dotIdle: "bg-indigo-200", dotActive: "bg-indigo-500", dotReached: "bg-indigo-600",
    chipIdle: "bg-indigo-50 text-indigo-700", chipActive: "bg-indigo-100 text-indigo-800", chipReached: "bg-indigo-600 text-white",
  },
];

const getMilestoneTone = (id: string): MilestoneTone => {
  const numericIndex = Number(id.replace("milestone-", "")) - 1;
  if (Number.isFinite(numericIndex) && numericIndex >= 0) {
    return milestoneTones[numericIndex % milestoneTones.length];
  }
  return milestoneTones[0];
};

type CategoryPalette = {
  timeline: string;
  stepBadge: string;
  cardSurface: string;
  subcategoryLabel: string;
  incompleteScenario: string;
  interruptedBadge: string;
};

const categoryPalettes: CategoryPalette[] = [
  {
    timeline: "bg-gradient-to-b from-orange-300/90 via-amber-300/65 to-orange-200/15",
    stepBadge: "border-orange-300/80 bg-orange-100 text-orange-700 shadow-[0_8px_16px_rgba(176,95,35,0.18)]",
    cardSurface: "border-orange-200/70 bg-gradient-to-br from-orange-50/70 via-white/90 to-amber-50/70",
    subcategoryLabel: "text-orange-700/80",
    incompleteScenario: "border-orange-200/70 bg-white/75",
    interruptedBadge: "bg-amber-100 text-amber-700",
  },
  {
    timeline: "bg-gradient-to-b from-sky-300/90 via-cyan-300/65 to-sky-200/15",
    stepBadge: "border-sky-300/80 bg-sky-100 text-sky-700 shadow-[0_8px_16px_rgba(22,94,179,0.16)]",
    cardSurface: "border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-white/90 to-cyan-50/70",
    subcategoryLabel: "text-sky-700/80",
    incompleteScenario: "border-sky-200/70 bg-white/75",
    interruptedBadge: "bg-amber-100 text-amber-700",
  },
  {
    timeline: "bg-gradient-to-b from-rose-300/90 via-pink-300/65 to-rose-200/15",
    stepBadge: "border-rose-300/80 bg-rose-100 text-rose-700 shadow-[0_8px_16px_rgba(190,24,93,0.15)]",
    cardSurface: "border-rose-200/70 bg-gradient-to-br from-rose-50/70 via-white/90 to-pink-50/70",
    subcategoryLabel: "text-rose-700/80",
    incompleteScenario: "border-rose-200/70 bg-white/75",
    interruptedBadge: "bg-amber-100 text-amber-700",
  },
  {
    timeline: "bg-gradient-to-b from-emerald-300/90 via-green-300/65 to-emerald-200/15",
    stepBadge: "border-emerald-300/80 bg-emerald-100 text-emerald-700 shadow-[0_8px_16px_rgba(16,122,87,0.15)]",
    cardSurface: "border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white/90 to-green-50/70",
    subcategoryLabel: "text-emerald-700/80",
    incompleteScenario: "border-emerald-200/70 bg-white/75",
    interruptedBadge: "bg-amber-100 text-amber-700",
  },
  {
    timeline: "bg-gradient-to-b from-indigo-300/90 via-violet-300/65 to-indigo-200/15",
    stepBadge: "border-indigo-300/80 bg-indigo-100 text-indigo-700 shadow-[0_8px_16px_rgba(67,56,202,0.15)]",
    cardSurface: "border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 via-white/90 to-violet-50/70",
    subcategoryLabel: "text-indigo-700/80",
    incompleteScenario: "border-indigo-200/70 bg-white/75",
    interruptedBadge: "bg-amber-100 text-amber-700",
  },
];

type ScenarioStatus = "completed" | "in-progress" | "not-started";

export function HistoryPage() {
  const { data: scenarios = [] } = useScenarios();
  const { data: historyItems = [], isLoading, isError, error } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });

  const homeScenarioCatalog = useMemo(() => buildHomeScenarioCatalog(scenarios), [scenarios]);

  const completedItemByScenario = useMemo(() => {
    const map = new Map<string, HistoryItem>();
    historyItems.forEach((item) => {
      if (!item.scenarioId || !item.evaluation) return;
      const timestamp = resolveHistoryTimestamp(item);
      const existing = map.get(item.scenarioId);
      const existingTimestamp = existing ? resolveHistoryTimestamp(existing) : -1;
      if (timestamp > existingTimestamp) {
        map.set(item.scenarioId, item);
      }
    });
    return map;
  }, [historyItems]);

  const inProgressItemByScenario = useMemo(() => {
    const map = new Map<string, HistoryItem>();
    historyItems.forEach((item) => {
      if (!item.scenarioId || item.evaluation) return;
      if (completedItemByScenario.has(item.scenarioId)) return;
      const timestamp = resolveHistoryTimestamp(item);
      const existing = map.get(item.scenarioId);
      const existingTimestamp = existing ? resolveHistoryTimestamp(existing) : -1;
      if (timestamp > existingTimestamp) {
        map.set(item.scenarioId, item);
      }
    });
    return map;
  }, [historyItems, completedItemByScenario]);

  const getStatus = (scenarioId: string): ScenarioStatus => {
    if (completedItemByScenario.has(scenarioId)) return "completed";
    if (inProgressItemByScenario.has(scenarioId)) return "in-progress";
    return "not-started";
  };

  const totalScenarios = useMemo(
    () => homeScenarioCatalog.reduce((sum, category) => sum + getCategoryScenarios(category).length, 0),
    [homeScenarioCatalog]
  );

  const completedCount = completedItemByScenario.size;

  const categoryById = useMemo(() => {
    const map = new Map<string, ScenarioCatalogCategory>();
    homeScenarioCatalog.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [homeScenarioCatalog]);

  const milestoneProgress = useMemo(() => {
    return roadmapMilestones.map((milestone) => {
      const linkedCategory = milestone.categoryId ? categoryById.get(milestone.categoryId) : undefined;
      const scenariosInCategory = linkedCategory ? getCategoryScenarios(linkedCategory) : [];
      const totalCount = scenariosInCategory.length;
      const completedInCategory = scenariosInCategory.filter((s) => completedItemByScenario.has(s.id)).length;
      const ratio = totalCount > 0 ? completedInCategory / totalCount : 0;
      return {
        id: milestone.id,
        title: milestone.title,
        hasScenarios: totalCount > 0,
        ratio,
        reached: ratio >= 1,
      };
    });
  }, [categoryById, completedItemByScenario]);

  const overallProgress = useMemo(
    () => (totalScenarios === 0 ? 0 : Math.round((completedCount / totalScenarios) * 100)),
    [completedCount, totalScenarios]
  );

  const currentMilestone = useMemo(
    () =>
      milestoneProgress.find((m) => m.hasScenarios && m.ratio > 0 && m.ratio < 1) ??
      milestoneProgress.find((m) => m.hasScenarios && m.ratio === 0) ??
      milestoneProgress.find((m) => !m.reached) ??
      milestoneProgress[milestoneProgress.length - 1],
    [milestoneProgress]
  );

  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "エラーが発生しました"
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Progress</p>
          <h1 className="font-display text-2xl text-slate-900">進捗マップ</h1>
        </div>
        <span className="text-xs text-slate-500">
          {completedCount} / {totalScenarios} シナリオ完了
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200/60 bg-red-50/70 p-6 text-sm text-red-700">
          <p className="font-semibold">エラーが発生しました</p>
          <p className="mt-1 text-slate-600">{errorMessage}</p>
        </div>
      ) : (
        <>
          {/* Milestone progress strip */}
          <div className="rounded-2xl border border-orange-200/70 bg-white/80 px-4 py-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Overall Progress</p>
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
                        <span className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold leading-snug ${chipClass}`}>
                          {milestone.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Category sections */}
          <div className="space-y-6">
            {homeScenarioCatalog.map((category, categoryIndex) => {
              const hasNext = categoryIndex < homeScenarioCatalog.length - 1;
              const palette = categoryPalettes[categoryIndex % categoryPalettes.length];
              const categoryTitle = getCategoryTitle(category, categoryIndex);
              return (
                <article key={category.id} className="relative pl-12">
                  {hasNext ? (
                    <div
                      aria-hidden="true"
                      className={`absolute left-[1.05rem] top-10 h-[calc(100%+1.5rem)] w-px ${palette.timeline}`}
                    />
                  ) : null}

                  <div className={`absolute left-0 top-5 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${palette.stepBadge}`}>
                    {categoryIndex + 1}
                  </div>

                  <div className={`card space-y-4 border p-5 sm:p-6 ${palette.cardSurface}`}>
                    <h3 className="font-display text-xl text-slate-900">{categoryTitle}</h3>

                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory.id} className="space-y-2">
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${palette.subcategoryLabel}`}>
                          {subcategory.title}
                        </p>
                        <ul className="space-y-2">
                          {subcategory.scenarios.map((scenario) => {
                            const status = getStatus(scenario.id);
                            const completedItem = completedItemByScenario.get(scenario.id);
                            const inProgressItem = inProgressItemByScenario.get(scenario.id);
                            return (
                              <li
                                key={scenario.id}
                                className={`rounded-xl border px-3 py-3 sm:px-4 ${
                                  status === "completed"
                                    ? "border-emerald-200/80 bg-emerald-50/60"
                                    : palette.incompleteScenario
                                }`}
                              >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="flex items-center gap-3">
                                    {status === "completed" ? (
                                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                                        ✓
                                      </span>
                                    ) : status === "in-progress" ? (
                                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm text-white">
                                        ●
                                      </span>
                                    ) : (
                                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-300" />
                                    )}
                                    <p className="text-sm font-semibold text-slate-900">{scenario.title}</p>
                                  </div>

                                  <div className="flex items-center gap-2 pl-9 sm:pl-0">
                                    {status === "completed" && completedItem ? (
                                      <>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 tabular-nums">
                                          {completedItem.evaluation?.overallScore != null
                                            ? `${completedItem.evaluation.overallScore} / 100`
                                            : "採点なし"}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                          {formatStartedAt(resolveStartedAt(completedItem))}
                                        </span>
                                        <Link
                                          to={`/history/${completedItem.sessionId}`}
                                          className="btn-secondary !px-3 !py-1.5 !text-xs"
                                        >
                                          詳細
                                        </Link>
                                      </>
                                    ) : status === "in-progress" && inProgressItem ? (
                                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${palette.interruptedBadge}`}>
                                        進行中
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
