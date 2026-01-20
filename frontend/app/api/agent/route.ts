import { getScenarioById } from "@/config/scenarios";
import type { Message } from "@/types/session";
import { NextResponse } from "next/server";

type AgentRequest = {
  scenarioId?: string;
  prompt?: string;
  messages?: Message[];
};

const DEFAULT_MODEL = "gemini-2.5-flash";
const DEFAULT_INSTRUCTION =
  "あなたはPM/PMOとしてユーザーと対話し、要件とリスクを整理しながら建設的にサポートします。";

const toAgentMessages = (messages: Message[] = []) =>
  messages.map((m) => ({
    role: m.role === "agent" ? "assistant" : m.role,
    content: m.content,
  }));

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 400 });
    }

    const scenario = getScenarioById(body.scenarioId ?? null);
    const instructions = body.prompt ?? scenario?.kickoffPrompt ?? DEFAULT_INSTRUCTION;

    const { Agent } = await import("@mastra/core/agent");
    const agent = new Agent({
      name: `agent-${body.scenarioId ?? "default"}`,
      instructions,
      model: {
        providerId: "google",
        modelId: DEFAULT_MODEL,
        apiKey: geminiKey,
      },
    });

    const response = await agent.generate(toAgentMessages(body.messages) as any);
    const text = await response.text;
    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Agent generation failed", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
