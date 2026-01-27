import { api } from "@/services/api";
import type { HistoryItem } from "@/types/session";

export async function listHistory(): Promise<HistoryItem[]> {
  return api.listSessions();
}

export async function getHistoryItem(sessionId: string): Promise<HistoryItem | null> {
  try {
    return await api.getSession(sessionId);
  } catch {
    return null;
  }
}
