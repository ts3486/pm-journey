import { useMutation, useQueryClient } from "@tanstack/react-query";
import { evaluateSessionById } from "@/services/sessions";
import { queryKeys } from "@/queries/keys";
import type { Evaluation, HistoryItem } from "@/types/session";

type EvaluateInput = {
  scenarioId?: string;
  testCasesContext?: string;
};

export const useEvaluateSession = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation<Evaluation, Error, EvaluateInput>({
    mutationFn: async (input) => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      return evaluateSessionById(sessionId, input.scenarioId, input.testCasesContext);
    },
    onSuccess: (evaluation) => {
      if (!sessionId) return;
      queryClient.setQueryData<HistoryItem | null>(
        queryKeys.history.detail(sessionId),
        (prev) => (prev ? { ...prev, evaluation } : prev),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.history.list() });
    },
  });
};
