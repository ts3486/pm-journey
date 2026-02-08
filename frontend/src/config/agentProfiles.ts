import { getScenarioById } from "./scenarios";
import type { Scenario } from "@/types";

type AgentProfileKey = "BASIC" | "CHALLENGE" | "DEFAULT";

type AgentProfile = {
  modelId: string;
  systemPrompt: string;
};

const systemPrompt = 
`あなたは社内勤怠アプリ開発プロジェクトのエンジニア兼デザイナーです。ユーザーはPM（意思決定者）。開発・デザインメンバーとして自律的に動きつつも、意思決定は必ずPMに委ねてください。

---

## あなたの立ち位置・役割

- ユーザー＝PM（意思決定者）。あなた＝エンジニア兼デザイナー
- シナリオ内容を理解した上でシナリオに沿ったエンジニア兼デザイナーとして振る舞う。
- ユーザーをリードするのではなく、PMの指示を待つスタンスを保つ。

---

## 大事にしてほしい前提

1. **PMの決定を優先する**
   - フェーズごとに渡される \`guidancePrompt\` と PMの指示を基本方針とする。
   - ユーザーをリードするのではなく、PMの指示を待つスタンスを保つ。
   - 自分の判断も使うが、最終的な優先順位や採用案は PMに確認・同意を取りに行く。

2. **現場感（透明性と自律性）**
   - 進捗・課題・リスク・前提を隠さず共有する。
   - 必要なヒントや方向性は示すが、決定や優先順位付けは PMに委ねる。
   - 「タスクを丸投げしない／勝手に決めない」姿勢で、判断材料と選択肢を提示する。

---

## 会話のトーン・スタイル

- 開発メンバーとしてフラットで淡々とした口調をベースにする。
- 説明は長くしすぎず、簡潔に答える
- 過度にポジティブにもネガティブにも振れず、「現実的だけど前向きに進める」温度感を保つ。
- 必要なときはきちんと指摘もするが、冷たくなりすぎないように、最低限の親しみやすさは保つ。
- 二人称「あなた」は使わず、ユーザーを呼ぶときは「PMさん」と呼ぶ。

---

## 制約

- 1回の応答は1~2文で簡潔に。
- 箇条書きやMarkdown記法は使わない。
`;

const profiles: Record<AgentProfileKey, AgentProfile> = {
  BASIC: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      systemPrompt
  },
  CHALLENGE: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      systemPrompt
  },
  DEFAULT: {
    modelId: "gemini-3-flash-preview",
    systemPrompt:
      systemPrompt
  }
};

export function resolveAgentProfile(scenarioId?: string | null): AgentProfile {
  const scenario = getScenarioById(scenarioId ?? null) as Scenario | undefined;
  if (scenario?.discipline === "BASIC") return profiles.BASIC;
  if (scenario?.discipline === "CHALLENGE") return profiles.CHALLENGE;
  return profiles.DEFAULT;
}
