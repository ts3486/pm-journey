import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addOutput, deleteOutput, listOutputs } from "@/services/outputs";
import { queryKeys } from "@/queries/keys";
import type { OutputSubmission, OutputSubmissionType } from "@pm-journey/types";

type AddOutputInput = {
  kind: OutputSubmissionType;
  value: string;
  note?: string;
};

export const useOutputs = (sessionId?: string) =>
  useQuery({
    queryKey: queryKeys.outputs.list(sessionId ?? "unknown"),
    queryFn: () => listOutputs(sessionId ?? ""),
    enabled: Boolean(sessionId),
  });

export const useAddOutput = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddOutputInput) => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      return addOutput(sessionId, input.kind, input.value, input.note);
    },
    onSuccess: (created) => {
      if (!sessionId) return;
      queryClient.setQueryData<OutputSubmission[]>(
        queryKeys.outputs.list(sessionId),
        (prev) => (prev ? [created, ...prev] : [created]),
      );
    },
  });
};

export const useDeleteOutput = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (outputId: string) => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      return deleteOutput(sessionId, outputId);
    },
    onMutate: async (outputId) => {
      if (!sessionId) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: queryKeys.outputs.list(sessionId) });
      const previous = queryClient.getQueryData<OutputSubmission[]>(
        queryKeys.outputs.list(sessionId),
      );
      queryClient.setQueryData<OutputSubmission[]>(
        queryKeys.outputs.list(sessionId),
        (prev) => (prev ? prev.filter((output) => output.id !== outputId) : prev),
      );
      return { previous };
    },
    onError: (_error, _outputId, context) => {
      if (!sessionId) return;
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.outputs.list(sessionId), context.previous);
      }
    },
  });
};
