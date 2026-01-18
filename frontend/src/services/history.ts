import type { HistoryItem, SessionSnapshot } from "@/services/storage";
import { storage } from "@/services/storage";
import { loadHistory } from "@/services/sessions";

export async function listHistory(): Promise<HistoryItem[]> {
  return loadHistory();
}

export function saveHistory(snapshot: SessionSnapshot): void {
  storage.saveSession(snapshot);
}

export function getHistoryItem(sessionId: string): HistoryItem | null {
  const snap = storage.loadSession(sessionId);
  if (!snap) return null;
  return {
    sessionId,
    metadata: {
      duration: undefined,
      messageCount: snap.messages.length,
    },
    actions: snap.messages.filter((m) => m.tags && m.tags.length > 0),
    evaluation: snap.evaluation,
    storageLocation: "local",
  };
}
