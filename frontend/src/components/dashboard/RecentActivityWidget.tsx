import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listHistory } from "@/services/history";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import type { HistoryItem } from "@/types";

const formatDate = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveItemDate = (item: HistoryItem): string | undefined => {
  if (item.metadata?.startedAt) return item.metadata.startedAt;
  const times = (item.actions ?? [])
    .map((a) => a.createdAt)
    .filter(Boolean)
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t));
  if (times.length === 0) return undefined;
  return new Date(Math.min(...times)).toISOString();
};

export function RecentActivityWidget() {
  const { data: items = [], isLoading, isError } = useQuery({
    queryKey: ["history", "list"],
    queryFn: listHistory,
  });

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

  const recentItems = items.slice(0, 3);

  return (
    <div className="card p-5 space-y-3">
      <p className="text-base font-semibold text-slate-900">最近のアクティビティ</p>

      {recentItems.length === 0 ? (
        <p className="text-sm text-slate-500">まだアクティビティがありません</p>
      ) : (
        <ul className="space-y-0">
          {recentItems.map((item) => {
            const title =
              (item as HistoryItem & { scenarioTitle?: string }).scenarioTitle ??
              item.scenarioId ??
              "不明";
            const score = item.evaluation?.overallScore;
            const date = formatDate(resolveItemDate(item));
            return (
              <li
                key={item.sessionId}
                className="border-b border-[rgba(138,96,61,0.12)] pb-2 last:border-0 last:pb-0"
              >
                <p className="text-sm font-medium text-slate-800">{title}</p>
                <p className="text-xs text-slate-500">
                  {score != null ? `スコア: ${score} / 100` : null}
                  {score != null && date ? " · " : null}
                  {date || null}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/history"
        className="block text-sm font-semibold text-orange-600 hover:text-orange-700"
      >
        すべて見る →
      </Link>
    </div>
  );
}
