import type { HistoryItem } from "@/types";

export const formatStartedAt = (value?: string): string => {
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

export const resolveStartedAt = (item: HistoryItem): string | undefined => {
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

export const normalizeOptionalText = (value?: string | null): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};
