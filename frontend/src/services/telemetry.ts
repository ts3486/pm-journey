export type TelemetryEvent =
  | { type: "session_start"; sessionId: string }
  | { type: "session_resume"; sessionId: string }
  | { type: "evaluation"; sessionId: string; score?: number };

export function logEvent(event: TelemetryEvent) {
  // Placeholder: send to console or hook into analytics endpoint.
  // Designed to be swapped with real logging later.
  console.info("[telemetry]", event);
}
