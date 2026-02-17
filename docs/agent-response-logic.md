# Agent Response Logic

How the agent's response style, tone, and behavior are determined for each scenario.

## Quick Reference

```
User selects scenario → SUPPORT mode (strict mentor)
```

All scenarios use the SUPPORT profile. The agent acts as a PM skill training assistant that challenges the user's thinking rather than providing answers.

| Aspect | Value |
|---|---|
| Profile | `SUPPORT` |
| Identity | PM学習の支援アシスタント |
| Tone | 厳しめメンター、鋭い |
| Goal | 思考を鍛える、答えは出さない |
| Key file (frontend) | `buildSupportPrompt()` |
| Key file (backend) | `build_support_system_instruction()` |

---

## 1. Profile

**File:** `frontend/src/config/agentProfiles.ts` — `resolveAgentProfile()`

Returns a single SUPPORT profile with:

```
systemPrompt: "あなたはPMスキル学習の支援アシスタントです..."
  - Role: strengthen user's thinking process
  - Core: challenge judgments, question assumptions, point out weak reasoning
  - Rules: never provide complete answers, never create deliverables, don't role-play

tonePrompt:
  - 思考を鍛える厳しめのメンター
  - 簡潔で鋭く答える
  - 過度な褒め言葉は避け、改善すべき点を率直に指摘する
  - 「ユーザーさん」や「あなた」は使わず、直接的に語りかける
```

---

## 2. Frontend Prompt Construction

**File:** `frontend/src/services/sessions.ts` — `sendMessage()`

When a user sends a message, `sendMessage()` calls `buildSupportPrompt()` to build the `agentContext`.

### `buildSupportPrompt()`

Assembles the `scenarioPrompt` from task-specific fields:

```
scenarioPrompt = [
  "## タスク指示"  +  task.instruction
  + task.template?.sections (期待される構成)
  + task.template?.example  (成果物の例)
  ,
  "## 背景情報"  +  task.referenceInfo   (if present)
  ,
  buildAssistanceModeRules(assistanceMode)    (see §4)
]
```

Also passes the full `task` object (instruction, deliverableFormat, template, referenceInfo, hints) to the backend.

### `formatProductContext()`

Both chat and evaluation include product context:

```
"## プロジェクトメモ"  +  productPrompt (with {{template}} variables rendered)
"## プロダクト情報"    +  name, summary, audience, problems, goals, etc.
```

---

## 3. Backend System Instruction Assembly

**File:** `backend/src/features/messages/services.rs` — `generate_agent_reply()`

The backend always uses `build_support_system_instruction()`:

```
┌────────────────────────────────────────────────────────────┐
│ 1. systemPrompt (SUPPORT identity — fixed, never changes)  │
├────────────────────────────────────────────────────────────┤
│ 2. scenarioPrompt (task instruction + template + hints)     │
├────────────────────────────────────────────────────────────┤
│ 3. ## シナリオ文脈 (title + description)                     │
├────────────────────────────────────────────────────────────┤
│ 4. ## 会話トーン (tonePrompt)                                │
├────────────────────────────────────────────────────────────┤
│ 5. productContext                                           │
├────────────────────────────────────────────────────────────┤
│ 6. ## 支援モード: {mode} (assistance mode rules)             │
├────────────────────────────────────────────────────────────┤
│ 7. ## ガードレール (always appended)                         │
│    - ミッションの完全な答えを提示しない（最優先）               │
│    - ユーザーの判断や前提を積極的に問い直す                     │
│    - チームメンバーを演じない                                 │
│    - ユーザーの代わりに成果物を書かない                        │
│    - 1〜2文で簡潔に応答する（最大3文）                        │
│    - テンプレート提示時以外は箇条書き・Markdown使わない         │
└────────────────────────────────────────────────────────────┘
```

---

## 4. Assistance Modes

**Defined in:** `frontend/src/services/sessions.ts` — `buildAssistanceModeRules()`
**Duplicated in:** `backend/src/features/messages/services.rs` — `build_support_system_instruction()`

Controls how proactively the agent supports the learner.

| Mode | Label | Behavior |
|---|---|---|
| `hands-off` | 見守り | Don't answer questions. Evaluate only after task completion. |
| `on-request` | 質問対応 | Respond only when the user asks. No proactive advice. |
| `guided` | ガイド付き | May suggest next steps. Show frameworks but not answers. |
| `review` | レビュー | Wait for deliverable submission, then give critical feedback. |

All modes include: `ミッションの完全な答えは絶対に提示しない`

Set on the scenario via `assistanceMode` (top-level) or `behavior.assistanceMode` (fallback). Defaults to `"on-request"`.

---

## 5. End-to-End Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│                                                               │
│  agentProfiles.ts                                             │
│  ├─ resolveAgentProfile()                                     │
│  └─ Returns: { systemPrompt, tonePrompt, modelId }           │
│                                                               │
│  sessions.ts                                                  │
│  ├─ buildSupportPrompt()                                      │
│  │   → scenarioPrompt from task + assistance mode rules       │
│  │   → includes task object                                   │
│  └─ formatProductContext() → productContext                    │
│                                                               │
│  Sends agentContext to backend via POST /sessions/{id}/messages│
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                                │
│                                                               │
│  messages/services.rs                                         │
│  ├─ generate_agent_reply(agentContext, messages, planCode)     │
│  │   ├─ build_support_system_instruction()                    │
│  │   │   → 7 sections (identity → task → tone → mode          │
│  │   │     → guardrails)                                      │
│  │   └─ Sends to Gemini API                                   │
│  └─ infer_completed_mission_ids() (separate Gemini call)      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    GEMINI API                                  │
│  POST /v1beta/models/{modelId}:generateContent                │
│  {                                                            │
│    systemInstruction: { parts: [{ text: <instruction> }] },   │
│    contents: [ last 20 messages as user/model turns ]         │
│  }                                                            │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. AgentContext Schema

The object sent from frontend to backend with each user message:

```typescript
{
  systemPrompt: string;          // Agent identity (from profile)
  tonePrompt: string;            // Conversation tone (from profile)
  modelId: string;               // e.g. "gemini-3-flash-preview"
  scenarioPrompt: string;        // Task instruction + assistance mode rules
  scenarioTitle?: string;
  scenarioDescription?: string;
  productContext?: string;        // Project memo + product info
  behavior?: {                   // Response control flags
    singleResponse?: boolean;
    agentResponseEnabled?: boolean;
    assistanceMode?: string;
  };
  task?: {                       // Task details
    instruction: string;
    deliverableFormat: string;
    template?: { format, sections, example };
    referenceInfo?: string;
    hints?: string[];
  };
}
```

---

## 7. Related Files

| File | Purpose |
|---|---|
| `frontend/src/config/agentProfiles.ts` | Profile definition + `resolveAgentProfile()` |
| `frontend/src/config/scenarios.ts` | Scenario definitions (task, behavior, missions) |
| `frontend/src/services/sessions.ts` | `buildSupportPrompt()`, `sendMessage()` |
| `frontend/src/types/index.ts` | TypeScript types (Scenario, ScenarioBehavior, TaskDefinition, etc.) |
| `backend/src/features/messages/services.rs` | `build_support_system_instruction()`, `generate_agent_reply()` |
| `backend/src/features/messages/models.rs` | `AgentContext`, `AgentBehavior` Rust structs |
