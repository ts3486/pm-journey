import type { PlanCode, ScenarioDiscipline } from "@/types";
import { env } from "@/config/env";

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
  if (!env.billingEnabled) return true;
  if (planCode === "TEAM") return true;
  return freeScenarioIds.has(scenarioId);
}
