import type { ScenarioDiscipline } from "@/types";

type SessionMeta = {
  sessionId: string;
  scenarioId?: string;
  scenarioDiscipline?: ScenarioDiscipline;
  storageLocation?: "local" | "api";
};

export type TelemetryEvent =
  | ({ type: "session_start" } & SessionMeta)
  | ({ type: "session_resume" } & SessionMeta)
  | ({ type: "session_reset" } & SessionMeta)
  | ({ type: "evaluation"; score?: number } & SessionMeta)
  | ({ type: "history_view" } & SessionMeta)
  | ({ type: "history_export"; format: "json" | "markdown" } & SessionMeta);

export function logEvent(event: TelemetryEvent) {
  console.info("[telemetry]", event);
}
