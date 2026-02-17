# AI Prompt Architecture

How prompts are constructed, assembled, and processed in pm-journey.

## Architecture Overview

The system uses **Google Gemini** via REST API. There are three distinct AI call paths:

| Call Path | Purpose | Temperature | Output |
|---|---|---|---|
| Chat Reply | Generate agent response per user message | default | Free text |
| Mission Detection | Check if user completed mission objectives | 0 | JSON |
| Session Evaluation | Score user performance on criteria | 0 | JSON |

---

## 1. Prompt Sources (Frontend)

### 1.1 Agent Profiles (`frontend/src/config/agentProfiles.ts`)

Defines the **base system prompt** and **tone prompt** sent with every message.

**System Prompt** — Sets the agent's role as engineer/designer on an internal attendance app project. The user is the PM (decision-maker). Key rules:
- Defer to PM decisions; don't lead
- Share progress, risks, and issues transparently
- Present options and judgment materials, don't decide unilaterally
- Respond in 1-2 sentences; no bullet points or Markdown

**Tone Prompt** — Flat, matter-of-fact developer tone. Concise. Realistic, not overly positive/negative. Address user as "PMさん", never "あなた".

Three profile keys exist (`BASIC`, `CHALLENGE`, `DEFAULT`), all currently identical. Resolved by `resolveAgentProfile(scenarioId)`.

### 1.2 Scenario Definitions (`frontend/src/config/scenarios.ts`)

Each scenario contributes:

| Field | Role |
|---|---|
| `kickoffPrompt` | Initial context/instruction for the scenario |
| `customPrompt` | **Highest priority override** — replaces agent behavior entirely |
| `agentOpeningMessage` | AI's first message (seeded before conversation) |
| `supplementalInfo` | Extra hints included in scenario context |
| `behavior` | Controls response style flags (see §3.3) |
| `evaluationCriteria` | Per-scenario scoring criteria for evaluation |
| `missions` | Objectives auto-detected by a separate LLM call |

**Example `customPrompt` values:**
```
# basic-intro-alignment
簡潔に「こちらこそよろしくお願いします！」とだけ返してください。

# basic-meeting-minutes
あなたは議事メモを受け取るチームメンバーです。議事メモの受領を自然な形で確認してください。

# test-login
あなたはログイン機能の仕様を把握しているプロダクトオーナーです。質問には協力的に答えますが、自らテストケースを提案することは避けてください。
```

### 1.3 Scenario Context Builder (`frontend/src/services/sessions.ts`)

Two builder functions assemble context sections:

**`buildScenarioContext(scenario)`** → `scenarioPrompt`
```
## シナリオ詳細
- システム案内: {kickoffPrompt}
- 会話相手の初回発話: {agentOpeningMessage}
- 補足情報: {supplementalInfo}
- ミッション:
  1. {title} ({description})
  ...
```

**`formatProductContext(scenario, productConfig)`** → `productContext`
```
## プロジェクトメモ
{productPrompt with template variables rendered}

## プロダクト情報
- 名前, 概要, 対象, 課題, 目標, 差別化要素, スコープ, 制約, タイムライン, 成功条件, 学習の焦点, 技術スタック, 主要機能
```

### 1.4 Template Variables

The `productPrompt` field supports `{{variable}}` syntax. Available variables:

| Variable | Source |
|---|---|
| `{{scenarioTitle}}` | Scenario |
| `{{scenarioDescription}}` | Scenario |
| `{{scenarioDiscipline}}` | Scenario |
| `{{scenarioType}}` | Scenario |
| `{{productName}}` | Product Config |
| `{{productSummary}}` | Product Config |
| `{{productAudience}}` | Product Config |
| `{{productTimeline}}` | Product Config |

### 1.5 Product Prompt Sections (`frontend/src/lib/productPromptSections.ts`)

The `productPrompt` free-form field uses a structured `## Heading` format:

| Section Key | Japanese Heading |
|---|---|
| `context` | プロジェクト背景 |
| `usersAndProblems` | 対象ユーザーと課題 |
| `goalsAndSuccess` | 目標と成功条件 |
| `scopeAndFeatures` | スコープと主要機能 |
| `constraintsAndTimeline` | 制約とタイムライン |
| `differentiation` | 差別化ポイントと補足 |

---

## 2. Assembled `agentContext` Object

The frontend assembles and sends this to the backend with each user message:

```typescript
{
  systemPrompt,      // from agentProfiles.ts
  tonePrompt,        // from agentProfiles.ts
  modelId,           // "gemini-3-flash-preview"
  scenarioPrompt,    // from buildScenarioContext()
  scenarioTitle,
  scenarioDescription,
  productContext,    // from formatProductContext()
  behavior,          // response style flags
  customPrompt,      // per-scenario override
}
```

Sent via: `POST /sessions/{id}/messages { role, content, agentContext }`

---

## 3. Backend: System Instruction Assembly

### 3.1 `build_system_instruction()` (`backend/src/features/messages/services.rs`)

Assembles the final system instruction in strict priority order:

```
┌─────────────────────────────────────────────────┐
│ 1. ## 最優先指示 (customPrompt)                   │  ← Highest priority
│    "以下の指示は他のすべての指示より優先されます"       │
├─────────────────────────────────────────────────┤
│ 2. systemPrompt (from agentProfiles)             │
├─────────────────────────────────────────────────┤
│ 3. scenarioPrompt (scenario details)             │
├─────────────────────────────────────────────────┤
│ 4. ## シナリオ文脈                                │
│    - タイトル: ...                                │
│    - 説明: ...                                   │
├─────────────────────────────────────────────────┤
│ 5. ## 会話トーン (tonePrompt)                     │
├─────────────────────────────────────────────────┤
│ 6. productContext                                │
├─────────────────────────────────────────────────┤
│ 7. ## シナリオ行動方針 (from behavior flags)       │
├─────────────────────────────────────────────────┤
│ 8. ## 応答ルール (hardcoded response rules)       │  ← Always appended
└─────────────────────────────────────────────────┘
```

### 3.2 Gemini API Call (`generate_agent_reply()`)

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent

{
  "systemInstruction": { "parts": [{ "text": <assembled instruction> }] },
  "contents": [ <last 20 messages as conversation history> ]
}
```

- System-role messages filtered out from history
- Agent messages → Gemini `"model"` role
- User messages → Gemini `"user"` role
- No `generationConfig` specified (uses Gemini defaults)

### 3.3 Behavior Flags → Prompt Rules

The `behavior` object maps to Japanese instructions in section 7:

| Flag | Generated Rule |
|---|---|
| `singleResponse: true` | "これは1回応答のシナリオです" |
| `userLed: true` | "ユーザー主導：こちらから議題を進めない" |
| `allowProactive: true` | "必要な場合のみ次の一歩を1つ提案してよい" |
| `maxQuestions: 0` | "質問はしない" |
| `responseStyle: "acknowledgment"` | "受領・共感中心で、次の進行はユーザーに委ねる" |
| `responseStyle: "minimal"` | "短く受領し、必要な場合のみ軽く方向づける" |
| `responseStyle: "consultative"` | "前提を確認しつつ簡潔に助言する" |

### 3.4 Hardcoded Response Rules (Section 8)

Always appended:
```
## 応答ルール
- 1〜2文で回答する
- 箇条書きやMarkdown記法は使わない
- 質問は1つだけにする (or "質問はしない" if forbidden)
```

---

## 4. Mission Detection

Separate Gemini call per user message (if scenario has missions).

**File:** `backend/src/features/messages/services.rs` → `infer_completed_mission_ids()`

**System instruction:**
```
あなたはミッション達成判定アシスタントです。
ユーザーの最新回答のみを読んで、達成できたミッションIDだけを返してください。
保守的に判定し、明確に達成していないミッションは含めないでください。
出力はJSONのみで、形式は {"completedMissionIds":["..."]} としてください。
```

**User input:**
```
## ミッション一覧
- id: {id} / title: {title} / description: {description}
...

## ユーザー最新回答
{latest_user_message}
```

**Config:** `temperature: 0`, `maxOutputTokens: 256`, `responseMimeType: "application/json"`

---

## 5. Session Evaluation

### 5.1 Evaluation Criteria (`frontend/src/lib/scenarioEvaluationCriteria.ts`)

Five category templates with scoring rubrics (Excellent / Good / NeedsImprovement / Poor):

| Category | Japanese Name | Used For |
|---|---|---|
| `softSkills` | コミュニケーション品質, 合意形成 | General scenarios |
| `testCases` | テスト観点の網羅性・再現性 | Test-writing scenarios |
| `requirementDefinition` | 要件の明確性・検証可能性 | Requirements scenarios |
| `incidentResponse` | 初動品質、影響評価、連絡体制 | Incident scenarios |
| `businessExecution` | 意思決定品質、トレードオフ整理 | Business scenarios |

`buildScenarioEvaluationCriteria()` selects categories by `scenario.id` and `scenario.scenarioType`.

### 5.2 Evaluation Prompt (`backend/src/features/evaluations/services.rs`)

**`build_evaluation_instruction()`:**
```
あなたは厳格な評価者です。評価対象はユーザーの発言のみです。

シナリオ: {title}
シナリオ概要: {description}
シナリオ指示: {scenarioPrompt}
{productContext}
{testCasesContext (if present)}

## 評価基準
- {name} (ID: {id}, 重み: {weight}%)
  - 説明: {description}
  - Excellent: ...
  - Good: ...
  - NeedsImprovement: ...
  - Poor: ...

合格基準: {passingScore}点以上

出力形式(JSONのみ):
{"categories":[...],"overallScore":0-100,"summary":"...","improvementAdvice":"..."}
```

**Conversation input** formatted as:
```
[ユーザー] {content}
[アシスタント] {content}
```

**Config:** `temperature: 0`, `maxOutputTokens: 2048`, `responseMimeType: "application/json"`

### 5.3 Retry Strategy

| Attempt | Mode | Change |
|---|---|---|
| 1 | Normal | Standard instruction |
| 2 | Strict | Adds JSON template and explicit prohibitions |
| 3 | Repair | Separate "JSON repair" prompt with draft output |

---

## 6. Credential Resolution (`backend/src/shared/gemini.rs`)

Two resolution functions (`resolve_chat_credentials`, `resolve_eval_credentials`) check env vars in priority order per plan tier:

- **API Key:** `GEMINI_API_KEY_TEAM` → `GEMINI_API_KEY` → `NEXT_PUBLIC_GEMINI_API_KEY`
- **Model:** `GEMINI_DEFAULT_MODEL_TEAM` → `GEMINI_DEFAULT_MODEL` → fallback `"gemini-3-flash-preview"`

---

## 7. End-to-End Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                             │
│                                                           │
│  agentProfiles.ts ──→ systemPrompt + tonePrompt + modelId │
│  scenarios.ts ────→ customPrompt + behavior + missions    │
│  sessions.ts ─────→ scenarioPrompt + productContext       │
│                                                           │
│  All assembled into agentContext object                   │
│  POST /sessions/{id}/messages                             │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                      BACKEND                              │
│                                                           │
│  messages/services.rs                                     │
│  ├─ build_system_instruction(agentContext)                │
│  │   → 8-section system instruction                      │
│  ├─ generate_agent_reply()                               │
│  │   → Gemini API with system instruction + 20 messages  │
│  └─ infer_completed_mission_ids()                        │
│      → Separate Gemini call (JSON mode, temp=0)          │
│                                                           │
│  evaluations/services.rs                                  │
│  ├─ build_evaluation_instruction()                       │
│  │   → Evaluation prompt with criteria + rubrics         │
│  └─ evaluate() with 3-attempt retry                      │
│      → Gemini API (JSON mode, temp=0)                    │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│               GOOGLE GEMINI API                           │
│  generativelanguage.googleapis.com/v1beta/models/         │
│  {model_id}:generateContent                               │
└──────────────────────────────────────────────────────────┘
```
