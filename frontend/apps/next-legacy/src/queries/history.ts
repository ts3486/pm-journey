import { useQuery } from "@tanstack/react-query";
import { getHistoryItem, listHistory } from "@/services/history";
import { queryKeys } from "@/queries/keys";

export const useHistoryList = () =>
  useQuery({
    queryKey: queryKeys.history.list(),
    queryFn: listHistory,
  });

export const useHistoryItem = (sessionId?: string) =>
  useQuery({
    queryKey: queryKeys.history.detail(sessionId ?? "unknown"),
    queryFn: () => getHistoryItem(sessionId ?? ""),
    enabled: Boolean(sessionId),
  });
