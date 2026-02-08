import { createSessionPointerStorage } from "@/storage";
import { env } from "@/config/env";
import type { SessionPointerStorage } from "@/storage/sessionPointer";

let activeStorage: SessionPointerStorage = createSessionPointerStorage({
  keyPrefix: env.storageKeyPrefix,
});

export function setSessionPointerStorage(nextStorage: SessionPointerStorage) {
  activeStorage = nextStorage;
}

export const storage: SessionPointerStorage = {
  setLastSession: (...args) => activeStorage.setLastSession(...args),
  loadLastSessionId: (...args) => activeStorage.loadLastSessionId(...args),
  loadLastScenarioId: (...args) => activeStorage.loadLastScenarioId(...args),
  clearLastSessionPointer: (...args) => activeStorage.clearLastSessionPointer(...args),
};
