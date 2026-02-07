const isBrowser = typeof window !== "undefined";

type StorageOptions = {
  keyPrefix: string;
};

const keyBuilder = (prefix: string, suffix: string) => `${prefix}:${suffix}`;

export type SessionPointerStorage = ReturnType<typeof createSessionPointerStorage>;

export function createSessionPointerStorage({ keyPrefix }: StorageOptions) {
  const lastScenarioKey = () => keyBuilder(keyPrefix, "lastScenarioId");
  const lastSessionKey = (scenarioId: string) => keyBuilder(keyPrefix, `session:last:${scenarioId}`);

  return {
    setLastSession(sessionId: string, scenarioId: string) {
      if (!isBrowser) return;
      localStorage.setItem(lastSessionKey(scenarioId), sessionId);
      localStorage.setItem(lastScenarioKey(), scenarioId);
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
      }
    },
  };
}
