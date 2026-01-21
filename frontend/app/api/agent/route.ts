import { resolveAgentProfile } from "@/config/agentProfiles";
import { getScenarioById } from "@/config/scenarios";
import type { Message } from "@/types/session";
import { NextResponse } from "next/server";

type AgentRequest = {
  scenarioId?: string;
  prompt?: string;
  messages?: Message[];
};

const DEFAULT_INSTRUCTION =
  "あなたはPMとしてユーザーと対話し、要件・リスク・次アクションを整理します。簡潔に、敬語で答えてください。";

const toParts = (messages: Message[] = []) =>
  messages.map((m) => ({
    role: m.role === "agent" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentRequest;
    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 400 });
    }

    const scenario = getScenarioById(body.scenarioId ?? null);
    const profile = resolveAgentProfile(body.scenarioId);

    const scenarioPrompt = scenario?.kickoffPrompt ?? DEFAULT_INSTRUCTION;
    const userPrompt = body.prompt;
    const mergedSystem = [profile.systemPrompt, scenarioPrompt, userPrompt]
      .filter(Boolean)
      .join("\n\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${profile.modelId}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: toParts(body.messages ?? []),
          systemInstruction: { parts: [{ text: mergedSystem }] },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Gemini API error", res.status, text);
      return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ??
      "（応答を生成できませんでした）";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Agent generation failed", error);
    return NextResponse.json({ error: "Failed to generate reply" }, { status: 500 });
  }
}
