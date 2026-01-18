import { env } from "@/config/env";
import type { Evaluation, Message, ProgressFlags, Session } from "@/types/session";

const isBrowser = typeof window !== "undefined";

const key = (suffix: string) => `${env.storageKeyPrefix}:${suffix}`;

export type SessionSnapshot = {
  session: Session;
  messages: Message[];
  evaluation?: Evaluation;
  progressFlags?: ProgressFlags;
};

export const storage = {
  saveSession(snapshot: SessionSnapshot) {
    if (!isBrowser) return;
    localStorage.setItem(key(`session:${snapshot.session.id}`), JSON.stringify(snapshot));
    localStorage.setItem(key("lastSessionId"), snapshot.session.id);
  },
  loadSession(sessionId: string): SessionSnapshot | null {
    if (!isBrowser) return null;
    const raw = localStorage.getItem(key(`session:${sessionId}`));
    return raw ? (JSON.parse(raw) as SessionSnapshot) : null;
  },
  loadLastSessionId(): string | null {
    if (!isBrowser) return null;
    return localStorage.getItem(key("lastSessionId"));
  },
  clearSession(sessionId: string) {
    if (!isBrowser) return;
    localStorage.removeItem(key(`session:${sessionId}`));
    const lastId = localStorage.getItem(key("lastSessionId"));
    if (lastId === sessionId) {
      localStorage.removeItem(key("lastSessionId"));
    }
  },
};
