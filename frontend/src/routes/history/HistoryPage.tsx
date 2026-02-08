import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";
import { getScenarioById } from "@/config";
import type { HistoryItem, ScenarioDiscipline } from "@/types";
import { Link } from "react-router-dom";

const disciplineBadge = (discipline?: ScenarioDiscipline) => {
  if (discipline === "CHALLENGE") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
};

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

export function HistoryPage() {
  const { data: items = [], isLoading, isError, error } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });
  const errorMessage = isError
    ? error instanceof Error
      ? error.message
      : "エラーが発生しました"
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">History</p>
          <h1 className="font-display text-2xl text-slate-900">シナリオ履歴</h1>
        </div>
        <span className="text-xs text-slate-500">
          {items.length} session{items.length === 1 ? "" : "s"}
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
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
          履歴がありません。
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const scenarioTitle =
              getScenarioById(item.scenarioId ?? "")?.title ?? item.scenarioId ?? "Scenario";
            const startedAt = formatStartedAt(resolveStartedAt(item));
            return (
              <Link
                key={item.sessionId}
                to={`/history/${item.sessionId}`}
                className="card block w-full text-left transition hover:shadow-[0_18px_40px_rgba(120,71,34,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8efe4]"
              >
                <div className="flex items-start justify-between gap-3 p-5">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{startedAt}</p>
                    <div className="text-base font-semibold text-slate-900">{scenarioTitle}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${disciplineBadge(
                        item.scenarioDiscipline
                      )}`}
                    >
                      {item.scenarioDiscipline ?? "BASIC"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 tabular-nums">
                      {item.evaluation?.overallScore != null ? `${item.evaluation.overallScore} / 100` : "No Score"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
