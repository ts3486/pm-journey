const isBrowser = typeof window !== "undefined";
export const SESSION_POINTER_CHANGED_EVENT = "pm-journey:session-pointer-changed";

type StorageOptions = {
  keyPrefix: string;
  userId?: string;
};

const keyBuilder = (prefix: string, suffix: string) => `${prefix}:${suffix}`;

export type SessionPointerStorage = ReturnType<typeof createSessionPointerStorage>;

export function createSessionPointerStorage({ keyPrefix, userId }: StorageOptions) {
  const userPrefix = userId ? `${keyPrefix}:user:${userId}` : keyPrefix;
  const lastScenarioKey = () => keyBuilder(userPrefix, "lastScenarioId");
  const lastSessionKey = (scenarioId: string) => keyBuilder(userPrefix, `session:last:${scenarioId}`);
  const notifySessionPointerChange = () => {
    if (!isBrowser) return;
    window.dispatchEvent(new Event(SESSION_POINTER_CHANGED_EVENT));
  };

  return {
    setLastSession(sessionId: string, scenarioId: string) {
      if (!isBrowser) return;
      localStorage.setItem(lastSessionKey(scenarioId), sessionId);
      localStorage.setItem(lastScenarioKey(), scenarioId);
      notifySessionPointerChange();
    },
    async loadLastSessionId(scenarioId?: string): Promise<string | null> {
      if (!isBrowser) return null;
      const targetScenario = scenarioId ?? localStorage.getItem(lastScenarioKey());
      if (!targetScenario) return null;
      return localStorage.getItem(lastSessionKey(targetScenario));
    },
    async loadLastScenarioId(): Promise<string | null> {
      if (!isBrowser) return null;
      return localStorage.getItem(lastScenarioKey());
    },
    async clearLastSessionPointer(scenarioId: string, sessionId?: string): Promise<void> {
      if (!isBrowser) return;
      const stored = localStorage.getItem(lastSessionKey(scenarioId));
      if (!sessionId || stored === sessionId) {
        localStorage.removeItem(lastSessionKey(scenarioId));
        notifySessionPointerChange();
      }
    },
  };
}
