import type { OutputSubmission, OutputSubmissionType } from "@/types";
import { api } from "@/services/api";

export async function listOutputs(sessionId: string): Promise<OutputSubmission[]> {
  return api.listOutputs(sessionId);
}

export async function addOutput(
  sessionId: string,
  kind: OutputSubmissionType,
  value: string,
  note?: string,
): Promise<OutputSubmission> {
  return api.createOutput(sessionId, {
    kind,
    value,
    note,
  });
}

export async function deleteOutput(sessionId: string, outputId: string): Promise<void> {
  await api.deleteOutput(sessionId, outputId);
}
