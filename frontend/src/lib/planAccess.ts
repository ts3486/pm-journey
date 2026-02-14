import type { PlanCode, ScenarioDiscipline } from "@/types";

const freeScenarioIds = new Set([
  "basic-intro-alignment",
  "basic-meeting-minutes",
  "basic-schedule-share",
  "test-login",
  "test-form",
  "test-file-upload",
]);

export function canAccessScenario(
  planCode: PlanCode,
  scenarioId: string,
  _discipline?: ScenarioDiscipline
): boolean {
  if (planCode === "TEAM") return true;
  return freeScenarioIds.has(scenarioId);
}
