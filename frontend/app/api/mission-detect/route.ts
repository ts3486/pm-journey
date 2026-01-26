import { getScenarioById } from "@/config/scenarios";
import type { Message, Mission } from "@/types/session";
import { NextResponse } from "next/server";

type MissionDetectRequest = {
  scenarioId?: string;
  missions?: Mission[];
  messages?: Message[];
  existingMissionStatus?: { missionId: string }[];
};

const SYSTEM_INSTRUCTION =
  "You are a strict evaluator. Identify which missions are clearly completed based on the conversation. " +
  "Only mark a mission complete when the user has explicitly covered the goal; if uncertain, omit it. " +
  "Return JSON only with this exact shape: {\"completedMissionIds\": [\"...\"]}.";

const formatMissions = (missions: Mission[]) =>
  missions
    .map((m) => `- ${m.id}: ${m.title}${m.description ? ` (${m.description})` : ""}`)
    .join("\n");

const formatMessages = (messages: Message[]) =>
  messages
    .slice(-14)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

const extractJson = (text: string): { completedMissionIds?: string[] } | null => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as { completedMissionIds?: string[] };
  } catch {
    return null;
  }
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MissionDetectRequest;
    const scenario = getScenarioById(body.scenarioId ?? null);
    const missions = body.missions ?? scenario?.missions ?? [];
    const messages = body.messages ?? [];

    if (missions.length === 0 || messages.length === 0) {
      return NextResponse.json({ completedMissionIds: [] });
    }

    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ completedMissionIds: [] });
    }

    const prompt = [
      "Missions:",
      formatMissions(missions),
      "",
      "Conversation:",
      formatMessages(messages),
    ].join("\n");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        }),
      },
    );

    if (!res.ok) {
      return NextResponse.json({ completedMissionIds: [] });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
    const parsed = extractJson(raw);

    const missionIds = new Set(missions.map((m) => m.id));
    const completedMissionIds =
      parsed?.completedMissionIds?.filter((id) => typeof id === "string" && missionIds.has(id)) ??
      [];

    return NextResponse.json({ completedMissionIds });
  } catch (error) {
    console.error("Mission detection failed", error);
    return NextResponse.json({ completedMissionIds: [] });
  }
}
