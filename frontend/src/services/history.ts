import { env } from "@/config/env";
import type { SessionSnapshot } from "@/services/storage";
import type { HistoryItem } from "@/types/session";
import { storage } from "@/services/storage";
import { loadHistory } from "@/services/sessions";

async function listHistoryFromLocalStorage(): Promise<HistoryItem[]> {
  if (typeof window === "undefined") return [];

  const prefix = `${env.storageKeyPrefix}:session:`;
  const items: HistoryItem[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix) || key.includes(":last:")) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const snap = JSON.parse(raw) as SessionSnapshot;
      const sessionId = snap.session.id;

      items.push({
        sessionId,
        scenarioId: snap.session.scenarioId,
        scenarioDiscipline: snap.session.scenarioDiscipline,
        metadata: {
          duration: undefined,
          messageCount: snap.messages.length,
        },
        actions: snap.messages.filter((m) => m.tags && m.tags.length > 0),
        evaluation: snap.evaluation,
        storageLocation: "local",
        comments: await storage.loadComments(sessionId),
      });
    } catch {
      // Skip invalid entries
    }
  }

  // Sort by lastActivityAt descending
  return items.sort((a, b) => {
    const timeA = new Date(a.metadata?.duration ?? 0).getTime();
    const timeB = new Date(b.metadata?.duration ?? 0).getTime();
    return timeB - timeA;
  });
}

export async function listHistory(): Promise<HistoryItem[]> {
  // If API is configured, use it
  if (env.apiBase) {
    try {
      return await loadHistory();
    } catch {
      // Fall back to localStorage if API fails
      return listHistoryFromLocalStorage();
    }
  }

  // No API configured, use localStorage
  return listHistoryFromLocalStorage();
}

export function saveHistory(snapshot: SessionSnapshot): void {
  storage.saveSession(snapshot);
}

export async function getHistoryItem(sessionId: string): Promise<HistoryItem | null> {
  const snap = await storage.loadSession(sessionId);
  if (!snap) return null;
  return {
    sessionId,
    scenarioId: snap.session.scenarioId,
    scenarioDiscipline: snap.session.scenarioDiscipline,
    metadata: {
      duration: undefined,
      messageCount: snap.messages.length,
    },
    actions: snap.messages.filter((m) => m.tags && m.tags.length > 0),
    evaluation: snap.evaluation,
    storageLocation: "local",
    comments: await storage.loadComments(sessionId),
  };
}
