import { env } from "@/config/env";
import type { Evaluation, ManagerComment, Message, Session } from "@/types/session";

const isBrowser = typeof window !== "undefined";

const key = (suffix: string) => `${env.storageKeyPrefix}:${suffix}`;
const lastScenarioKey = () => key("lastScenarioId");
const lastSessionKey = (scenarioId: string) => key(`session:last:${scenarioId}`);

export type SessionSnapshot = {
  session: Session;
  messages: Message[];
  evaluation?: Evaluation;
};

const applyDefaults = (snapshot: SessionSnapshot): SessionSnapshot => {
  const progressFlags =
    snapshot.session.progressFlags ??
    ({ requirements: false, priorities: false, risks: false, acceptance: false } as const);
  return {
    ...snapshot,
    session: {
      ...snapshot.session,
      progressFlags,
    },
  };
};

export const storage = {
  saveSession(snapshot: SessionSnapshot) {
    if (!isBrowser) return;
    const normalized = applyDefaults(snapshot);
    localStorage.setItem(key(`session:${normalized.session.id}`), JSON.stringify(normalized));
    const scenarioId = normalized.session.scenarioId || "default";
    localStorage.setItem(lastSessionKey(scenarioId), normalized.session.id);
    localStorage.setItem(lastScenarioKey(), scenarioId);
  },
  loadSession(sessionId: string): SessionSnapshot | null {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(key(`session:${sessionId}`));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionSnapshot;
    return applyDefaults(parsed);
  },
  loadLastSessionId(scenarioId?: string): string | null {
    if (!isBrowser) return null;
    const targetScenario = scenarioId ?? localStorage.getItem(lastScenarioKey());
    if (!targetScenario) return null;
    return localStorage.getItem(lastSessionKey(targetScenario));
  },
  loadLastScenarioId(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem(lastScenarioKey());
  },
  clearLastSessionPointer(scenarioId: string, sessionId?: string) {
    if (!isBrowser) return;
    const stored = localStorage.getItem(lastSessionKey(scenarioId));
    if (!sessionId || stored === sessionId) localStorage.removeItem(lastSessionKey(scenarioId));
  },
  loadComments(sessionId: string): ManagerComment[] {
    if (!isBrowser) return [];
    const raw = localStorage.getItem(key(`comments:${sessionId}`));
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ManagerComment[];
    } catch {
      return [];
    }
  },
  saveComment(sessionId: string, comment: ManagerComment) {
    if (!isBrowser) return;
    const existing = this.loadComments(sessionId);
    existing.push(comment);
    localStorage.setItem(key(`comments:${sessionId}`), JSON.stringify(existing));
  },
};
