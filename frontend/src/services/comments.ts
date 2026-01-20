import { env } from "@/config/env";
import { api } from "@/services/api";
import { storage } from "@/services/storage";
import type { ManagerComment } from "@/types/session";

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export async function listComments(sessionId: string): Promise<ManagerComment[]> {
  if (env.apiBase) {
    return api.listComments(sessionId);
  }
  return storage.loadComments(sessionId);
}

export async function addComment(sessionId: string, content: string, authorName?: string): Promise<ManagerComment> {
  if (env.apiBase) {
    return api.createComment(sessionId, { content, authorName });
  }
  const comment: ManagerComment = {
    id: randomId("comment"),
    sessionId,
    authorName,
    content,
    createdAt: new Date().toISOString(),
  };
  storage.saveComment(sessionId, comment);
  return comment;
}
