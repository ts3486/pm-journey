import { api } from "@/services/api";
import type { ManagerComment } from "@/types/session";

export async function listComments(sessionId: string): Promise<ManagerComment[]> {
  return api.listComments(sessionId);
}

export async function addComment(sessionId: string, content: string, authorName?: string): Promise<ManagerComment> {
  return api.createComment(sessionId, { content, authorName });
}
