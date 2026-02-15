import { api } from "@/services/api";
import type { HistoryItem } from "@/types";

const isSessionNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return /session not found/i.test(error.message) || /request failed:\s*404/i.test(error.message);
};

export async function listHistory(): Promise<HistoryItem[]> {
  return api.listSessions();
}

export async function getHistoryItem(sessionId: string): Promise<HistoryItem | null> {
  try {
    return await api.getSession(sessionId);
  } catch (error) {
    if (isSessionNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}
