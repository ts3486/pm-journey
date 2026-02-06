import type { ScenarioDiscipline } from "@pm-journey/types";

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
  // Placeholder: send to console or hook into analytics endpoint.
  // Designed to be swapped with real logging later.
  console.info("[telemetry]", event);
}
