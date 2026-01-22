import { getScenarioById } from "@/config/scenarios";
import type { Scenario } from "@/types/session";

type AgentProfileKey = "BASIC" | "CHALLENGE" | "DEFAULT";

type AgentProfile = {
  modelId: string;
  systemPrompt: string;
};

const profiles: Record<AgentProfileKey, AgentProfile> = {
  BASIC: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      "あなたは基礎シナリオのPMメンターです。短時間で論点整理を手伝い、次の一手を具体的に示してください。敬意を持ちつつ、簡潔に。"
  },
  CHALLENGE: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      "あなたはチャレンジシナリオのPM/PMOアドバイザーです。難易度の高い状況で、交渉・リスク判断・意思決定を支援します。前提を確認し、根拠を添えて提案してください。"
  },
  DEFAULT: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      "あなたはPMとしてユーザーと対話し、要件・リスク・次アクションを整理します。簡潔で具体的に、敬語で回答してください。"
  }
};

export function resolveAgentProfile(scenarioId?: string | null): AgentProfile {
  const scenario = getScenarioById(scenarioId ?? null) as Scenario | undefined;
  if (scenario?.discipline === "BASIC") return profiles.BASIC;
  if (scenario?.discipline === "CHALLENGE") return profiles.CHALLENGE;
  return profiles.DEFAULT;
}
