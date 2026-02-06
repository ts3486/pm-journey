import { env } from "@/config/env";
import type { OutputSubmission, OutputSubmissionType } from "@pm-journey/types";

const isBrowser = typeof window !== "undefined";

const key = (sessionId: string) => `${env.storageKeyPrefix}:outputs:${sessionId}`;

const loadAll = (sessionId: string): OutputSubmission[] => {
  if (!isBrowser) return [];
  const raw = localStorage.getItem(key(sessionId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OutputSubmission[];
  } catch {
    return [];
  }
};

const saveAll = (sessionId: string, outputs: OutputSubmission[]) => {
  if (!isBrowser) return;
  localStorage.setItem(key(sessionId), JSON.stringify(outputs));
};

export async function listOutputs(sessionId: string): Promise<OutputSubmission[]> {
  return loadAll(sessionId);
}

export async function addOutput(
  sessionId: string,
  kind: OutputSubmissionType,
  value: string,
  note?: string,
): Promise<OutputSubmission> {
  const outputs = loadAll(sessionId);
  const entry: OutputSubmission = {
    id: `out-${Math.random().toString(36).slice(2, 10)}`,
    sessionId,
    kind,
    value,
    note: note?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  outputs.unshift(entry);
  saveAll(sessionId, outputs);
  return entry;
}

export async function deleteOutput(sessionId: string, outputId: string): Promise<void> {
  const outputs = loadAll(sessionId).filter((o) => o.id !== outputId);
  saveAll(sessionId, outputs);
}
