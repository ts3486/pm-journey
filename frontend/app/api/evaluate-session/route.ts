import { getScenarioById } from "@/config/scenarios";
import type { Evaluation, EvaluationCategory, Message, RatingCriterion } from "@/types/session";
import { NextResponse } from "next/server";

type EvaluateSessionRequest = {
  sessionId: string;
  scenarioId: string;
  messages?: Message[];
};

type AIEvaluationResponse = {
  categories: {
    criterionId: string;
    score: number;
    feedback: string;
    evidence: string[];
  }[];
  summary: string;
  improvementAdvice: string;
};

const buildSystemPrompt = (
  scenarioTitle: string,
  scenarioDescription: string,
  productSummary: string,
  criteria: RatingCriterion[]
): string => {
  const criteriaSection = criteria
    .map(
      (c) => `
### ${c.name} (Weight: ${c.weight}%, ID: ${c.id})
${c.description}

Scoring Guide:
- Excellent (90-100): ${c.scoringGuidelines.excellent}
- Good (70-89): ${c.scoringGuidelines.good}
- Needs Improvement (50-69): ${c.scoringGuidelines.needsImprovement}
- Poor (0-49): ${c.scoringGuidelines.poor}`
    )
    .join("\n");

  return `You are an expert PM/PMO evaluator. Evaluate the user's performance in this PM scenario based on the conversation history.

## Scenario Context
Title: ${scenarioTitle}
Description: ${scenarioDescription}
Product Context: ${productSummary}

## Evaluation Criteria
For each criterion, provide:
1. A score from 0-100 based on the scoring guide
2. Specific feedback based on the conversation (in Japanese)
3. Evidence: 1-3 direct quotes from the user's messages that support your score

${criteriaSection}

## Output Format
Return JSON only with this exact structure (no markdown code blocks):
{
  "categories": [
    {
      "criterionId": "criterion-id",
      "score": 85,
      "feedback": "具体的なフィードバック（日本語）",
      "evidence": ["ユーザーの発言からの引用1", "引用2"]
    }
  ],
  "summary": "全体的な評価サマリー（日本語、2-3文）",
  "improvementAdvice": "具体的な改善アドバイス（日本語、箇条書き3-4点）"
}

Important:
- Evaluate based ONLY on the user's messages, not the agent's responses
- Be strict but fair in scoring
- Provide actionable, specific feedback in Japanese
- If the user didn't address a criterion at all, score it 0-30
- Evidence must be actual quotes from the conversation`;
};

const formatMessages = (messages: Message[]): string => {
  return messages
    .slice(-30) // Last 30 messages for context
    .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");
};

const extractJson = (text: string): AIEvaluationResponse | null => {
  // Try to extract JSON from the response (handle markdown code blocks)
  let jsonStr = text;
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  } else {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
  }

  try {
    return JSON.parse(jsonStr) as AIEvaluationResponse;
  } catch {
    console.error("Failed to parse AI response as JSON:", text);
    return null;
  }
};

const clampScore = (score: number): number => {
  return Math.max(0, Math.min(100, Math.round(score)));
};

const calculateOverallScore = (categories: EvaluationCategory[]): number => {
  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = categories.reduce((sum, c) => sum + (c.score ?? 0) * c.weight, 0);
  return Math.round(weightedSum / totalWeight);
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EvaluateSessionRequest;
    const { sessionId, scenarioId, messages = [] } = body;

    if (!sessionId || !scenarioId) {
      return NextResponse.json({ error: "sessionId and scenarioId are required" }, { status: 400 });
    }

    const scenario = getScenarioById(scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });
    }

    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500 });
    }

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages to evaluate" }, { status: 400 });
    }

    const criteria = scenario.evaluationCriteria;
    const systemPrompt = buildSystemPrompt(
      scenario.title,
      scenario.description,
      scenario.product.summary,
      criteria
    );

    const conversationText = formatMessages(messages);
    const userPrompt = `## Conversation to Evaluate\n\n${conversationText}\n\nPlease evaluate the user's performance based on the criteria above and return your evaluation as JSON.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.3, // Lower temperature for more consistent scoring
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Gemini API error:", res.status, errorText);
      return NextResponse.json({ error: "Failed to generate evaluation" }, { status: 500 });
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const rawResponse =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";

    const aiResult = extractJson(rawResponse);
    if (!aiResult) {
      console.error("Failed to parse AI evaluation response");
      return NextResponse.json({ error: "Failed to parse evaluation" }, { status: 500 });
    }

    // Map AI response to EvaluationCategory format
    const criteriaMap = new Map(criteria.map((c) => [c.id, c]));
    const categories: EvaluationCategory[] = aiResult.categories
      .filter((cat) => criteriaMap.has(cat.criterionId))
      .map((cat) => {
        const criterion = criteriaMap.get(cat.criterionId)!;
        return {
          criterionId: cat.criterionId,
          name: criterion.name,
          weight: criterion.weight,
          score: clampScore(cat.score),
          feedback: cat.feedback,
          evidence: cat.evidence,
        };
      });

    // Ensure all criteria are represented (in case AI missed some)
    for (const criterion of criteria) {
      if (!categories.find((c) => c.criterionId === criterion.id)) {
        categories.push({
          criterionId: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          score: 0,
          feedback: "この項目は会話の中で十分に扱われていませんでした。",
          evidence: [],
        });
      }
    }

    // Sort categories by original criteria order
    const criteriaOrder = new Map(criteria.map((c, i) => [c.id, i]));
    categories.sort((a, b) => {
      const orderA = criteriaOrder.get(a.criterionId ?? "") ?? 999;
      const orderB = criteriaOrder.get(b.criterionId ?? "") ?? 999;
      return orderA - orderB;
    });

    const overallScore = calculateOverallScore(categories);
    const passingScore = scenario.passingScore ?? 70;

    const evaluation: Evaluation = {
      sessionId,
      overallScore,
      passing: overallScore >= passingScore,
      categories,
      summary: aiResult.summary,
      improvementAdvice: aiResult.improvementAdvice,
    };

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error("Evaluation failed:", error);
    return NextResponse.json({ error: "Failed to evaluate session" }, { status: 500 });
  }
}
