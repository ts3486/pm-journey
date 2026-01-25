import { env } from "@/config/env";

const isBrowser = typeof window !== "undefined";

const key = (suffix: string) => `${env.storageKeyPrefix}:${suffix}`;
const lastScenarioKey = () => key("lastScenarioId");
const lastSessionKey = (scenarioId: string) => key(`session:last:${scenarioId}`);

/**
 * Minimal localStorage service for session pointers only.
 * All actual session data is stored in the backend API.
 */
export const storage = {
  /**
   * Set the last active session for a scenario.
   */
  setLastSession(sessionId: string, scenarioId: string): void {
    if (!isBrowser) return;
    localStorage.setItem(lastSessionKey(scenarioId), sessionId);
    localStorage.setItem(lastScenarioKey(), scenarioId);
  },

  /**
   * Load the last session ID for a scenario.
   */
  async loadLastSessionId(scenarioId?: string): Promise<string | null> {
    if (!isBrowser) return null;
    const targetScenario = scenarioId ?? localStorage.getItem(lastScenarioKey());
    if (!targetScenario) return null;
    return localStorage.getItem(lastSessionKey(targetScenario));
  },

  /**
   * Load the last scenario ID.
   */
  async loadLastScenarioId(): Promise<string | null> {
    if (!isBrowser) return null;
    return localStorage.getItem(lastScenarioKey());
  },

  /**
   * Clear the session pointer for a scenario.
   */
  async clearLastSessionPointer(scenarioId: string, sessionId?: string): Promise<void> {
    if (!isBrowser) return;
    const stored = localStorage.getItem(lastSessionKey(scenarioId));
    if (!sessionId || stored === sessionId) localStorage.removeItem(lastSessionKey(scenarioId));
  },
};
