import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { queryKeys } from "@/queries/keys";

export function useTestCases(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.testCases.list(sessionId!),
    queryFn: () => api.listTestCases(sessionId!),
    enabled: !!sessionId,
  });
}
