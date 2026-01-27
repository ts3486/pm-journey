import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addComment } from "@/services/comments";
import { queryKeys } from "@/queries/keys";
import type { HistoryItem } from "@/types/session";

type AddCommentInput = {
  content: string;
  authorName?: string;
};

export const useAddComment = (sessionId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddCommentInput) => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }
      return addComment(sessionId, input.content, input.authorName);
    },
    onSuccess: (comment) => {
      if (!sessionId) return;
      queryClient.setQueryData<HistoryItem | null>(
        queryKeys.history.detail(sessionId),
        (prev) => {
          if (!prev) return prev;
          const nextComments = [...(prev.comments ?? []), comment];
          return { ...prev, comments: nextComments };
        },
      );
    },
  });
};
