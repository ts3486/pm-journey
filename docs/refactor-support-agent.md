# Refactor Plan: Role-Play Agent → Support Assistant

## A) Current Implementation Findings

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Scenario Definition (frontend/src/config/scenarios.ts)                 │
│  ~3000 lines, 40+ scenarios                                            │
│  Each scenario defines: customPrompt (agent character), behavior,       │
│  kickoffPrompt, missions, evaluationCriteria, supplementalInfo          │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Agent Profile (frontend/src/config/agentProfiles.ts)                   │
│  Global systemPrompt: "あなたはエンジニア兼デザイナーです"                │
│  Global tonePrompt: "フラットで淡々とした口調"                           │
│  3 identical profiles (BASIC / CHALLENGE / DEFAULT)                     │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Context Assembly (frontend/src/services/sessions.ts)                   │
│  buildScenarioContext() + formatProductContext()                         │
│  → agentContext object sent with every user message                     │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  System Instruction Assembly (backend/src/features/messages/services.rs)│
│  build_system_instruction(): 8-section priority stack                   │
│  1. customPrompt (最優先指示) — agent character/role                    │
│  2. systemPrompt — global "you are engineer/designer"                  │
│  3. scenarioPrompt — kickoff + missions                                │
│  4. scenario context (title, description)                              │
│  5. tonePrompt — conversation tone                                     │
│  6. productContext — project memo + product info                       │
│  7. behavior rules (userLed, allowProactive, responseStyle)            │
│  8. response rules (1-2 sentences, no markdown)                        │
└────────────────────────┬────────────────────────────────────────────────┘
                         │
                         ├── generate_agent_reply() → Gemini chat
                         ├── infer_completed_mission_ids() → Gemini JSON
                         └── generate_ai_evaluation() → Gemini JSON
```

### Where Role-Play Lives (The Problem)

| Location | File | What It Does |
|---|---|---|
| **Global systemPrompt** | `agentProfiles.ts:12-43` | Hardcodes "you are an engineer/designer on an attendance app project" |
| **Per-scenario customPrompt** | `scenarios.ts` (every scenario) | Assigns a character: "あなたはエンジニアです", "あなたはPOの鈴木です", etc. |
| **customPrompt priority** | `messages/services.rs:457-461` | `customPrompt` has highest priority in system instruction |
| **Behavior presets** | `scenarios.ts:1673-1690` | Response styles designed around role-play interaction |
| **tonePrompt** | `agentProfiles.ts:45-50` | Tone is "as a development team member" |

### Key Files Inventory

| File | Role | Lines | Impact |
|---|---|---|---|
| `frontend/src/config/scenarios.ts` | Scenario definitions + criteria + post-processing | ~3000 | **HIGH** — every scenario has role-play `customPrompt` |
| `frontend/src/config/agentProfiles.ts` | Global system prompt + tone | 76 | **HIGH** — defines the base agent identity |
| `frontend/src/types/index.ts` | TypeScript types | 393 | **MEDIUM** — `Scenario`, `ScenarioBehavior`, `Mission` types |
| `frontend/src/services/sessions.ts` | Context assembly, session lifecycle | 369 | **MEDIUM** — `buildScenarioContext()`, `formatProductContext()` |
| `frontend/src/lib/scenarioEvaluationCriteria.ts` | Evaluation criteria resolver | ~200 | **LOW** — works with criteria, not agent identity |
| `backend/src/features/messages/services.rs` | System instruction builder + Gemini calls | 641 | **HIGH** — `build_system_instruction()` |
| `backend/src/features/messages/models.rs` | `AgentContext`, `AgentBehavior` | ~80 | **MEDIUM** — data model |
| `backend/src/features/evaluations/services.rs` | Evaluation prompt + retry | 536 | **LOW** — evaluation is already deliverable-focused |
| `backend/src/models/mod.rs` | Rust `Scenario`, `Session`, `Mission` types | ~500 | **MEDIUM** — Rust counterparts |

### Current Scenario Pattern (Annotated)

```typescript
{
  id: "basic-ticket-refine",
  title: "チケット要件整理",
  description: "チケットの目的と受入条件を整理する。",

  // 🔴 ROLE-PLAY: Agent pretends to be an engineer receiving the ticket
  customPrompt: "あなたはチケットの整理内容を受け取るエンジニアです。要件整理に対して、実装者の立場から建設的に応答してください。",

  // 🟡 BEHAVIOR: Single response mode — actually good for deliverable-based
  behavior: singleResponseBehavior,

  // 🟢 TASK HINT: Already deliverable-like
  kickoffPrompt: "このチケットの目的と受入条件を整理してください。",
  missions: [{ id: "basic-ticket-m1", title: "チケットを整理する", order: 1 }],
  supplementalInfo: "目的・受入条件・依存関係を簡潔に整理してください。",

  // 🟢 EVALUATION: Already rubric-based
  evaluationCriteria: simpleTicketCriteria,
  passingScore: 60,
}
```

### No Slack/Bolt Integration
The codebase has **no Slack/Bolt integration** — it is a web app using Next.js + Axum REST API.

---

## B) Proposed Target Architecture

### Core Concept Shift

| Dimension | Current (Role-Play) | Target (Support Assistant) |
|---|---|---|
| Agent identity | "You are engineer 鈴木 on the team" | "You are a PM training assistant" |
| Interaction model | User=PM gives orders, Agent=team member responds | User=learner completes tasks, Agent=guide assists |
| customPrompt purpose | Assigns character to agent | Defines task context and guardrails |
| Conversation goal | Simulate team communication | Help user produce a deliverable |
| Success metric | Quality of PM communication | Quality of deliverable output |
| Evaluation target | User's conversation skills | User's written deliverable |

### New Type Model

```typescript
// ---- NEW: Task-centric types ----

export type DeliverableFormat =
  | "free-text"       // open-ended written response
  | "structured"      // follows a template (e.g., test cases, meeting minutes)
  | "checklist"       // checkable items
  | "table";          // tabular output (test matrix, priority matrix)

export type AssistanceMode =
  | "hands-off"       // Agent only evaluates; no mid-task help
  | "on-request"      // Agent helps only when user asks
  | "guided"          // Agent proactively guides step-by-step
  | "review";         // Agent reviews draft and gives feedback

export type TaskTemplate = {
  format: DeliverableFormat;
  sections?: string[];            // expected sections in output
  example?: string;               // example deliverable (shown to user)
  checklist?: string[];           // items user should cover
};

export type TaskDefinition = {
  instruction: string;            // what the user must produce
  deliverableFormat: DeliverableFormat;
  template?: TaskTemplate;        // optional structure/example
  referenceInfo?: string;         // background info / specs the user can consult
  hints?: string[];               // progressive hints (unlockable)
};

// ---- UPDATED: Scenario type ----

export type Scenario = {
  id: string;
  title: string;
  description: string;
  guideMessage?: string;
  discipline: ScenarioDiscipline;
  scenarioType?: ScenarioType;
  featureMockup?: FeatureMockup;

  // NEW: Task-centric fields
  task: TaskDefinition;
  assistanceMode: AssistanceMode;

  // KEPT (renamed internals)
  behavior?: ScenarioBehavior;
  product: { /* ... unchanged ... */ };
  mode: string;

  // DEPRECATED (replaced by task.instruction)
  kickoffPrompt: string;          // keep for backward compat during migration

  // DEPRECATED (replaced by assistanceMode guardrails)
  customPrompt?: string;          // keep for backward compat during migration

  agentOpeningMessage?: string;
  evaluationCriteria: RatingCriterion[];
  passingScore?: number;
  missions?: Mission[];
  supplementalInfo?: string;
};

// ---- UPDATED: ScenarioBehavior ----

export type ScenarioBehavior = {
  userLed?: boolean;
  allowProactive?: boolean;
  maxQuestions?: number;
  responseStyle?: "acknowledge_then_wait" | "guide_lightly" | "advisor";
  phase?: string;
  singleResponse?: boolean;
  agentResponseEnabled?: boolean;

  // NEW
  assistanceMode?: AssistanceMode;   // overrides legacy behavior flags
  forbidRolePlay?: boolean;          // guardrail: never adopt a character
};
```

### New System Prompt Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  1. ## 役割 (FIXED — no longer per-scenario)                │
│     "You are a PM training support assistant."              │
│     "Your job is to help the user complete their task."     │
│     "Never role-play as a team member."                     │
├─────────────────────────────────────────────────────────────┤
│  2. ## タスク指示 (from task.instruction)                    │
│     What the user must produce                              │
├─────────────────────────────────────────────────────────────┤
│  3. ## 成果物フォーマット (from task.template)               │
│     Expected format, sections, examples                     │
├─────────────────────────────────────────────────────────────┤
│  4. ## 背景情報 (from task.referenceInfo + productContext)   │
│     Specs, constraints, project context                     │
├─────────────────────────────────────────────────────────────┤
│  5. ## 支援モード (from assistanceMode)                      │
│     How actively to help the user                           │
├─────────────────────────────────────────────────────────────┤
│  6. ## ミッション (from missions)                            │
│     Checkpoints the user should hit                         │
├─────────────────────────────────────────────────────────────┤
│  7. ## ガードレール                                          │
│     - Never adopt a character                               │
│     - Never produce the deliverable for the user            │
│     - Respond concisely                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## C) Migration Plan (Phases + Checklist)

### Phase 0: Safe Prep (Types + Abstractions)

No behavior change. Add new fields as optional. Old code continues to work.

| # | Task | File(s) | What | Why |
|---|---|---|---|---|
| 0.1 | Add `TaskDefinition` type | `frontend/src/types/index.ts` | Add `TaskDefinition`, `DeliverableFormat`, `AssistanceMode`, `TaskTemplate` types | Foundation for new model |
| 0.2 | Add `task` field to `Scenario` | `frontend/src/types/index.ts` | Add `task?: TaskDefinition` (optional) to `Scenario` | Backward-compatible extension |
| 0.3 | Add `assistanceMode` to `ScenarioBehavior` | `frontend/src/types/index.ts` | Add optional `assistanceMode`, `forbidRolePlay` fields | Allow gradual opt-in |
| 0.4 | Add Rust counterparts | `backend/src/models/mod.rs`, `backend/src/features/messages/models.rs` | Add `TaskDefinition`, `AssistanceMode` structs, add `task` to `AgentContext` | Backend must understand new fields |
| 0.5 | Create `buildSupportPrompt()` | `frontend/src/services/sessions.ts` (new helper) | New function that builds support-style `agentContext` from `task` + `assistanceMode` | Encapsulate new prompt logic, coexists with old path |
| 0.6 | Create `build_support_system_instruction()` | `backend/src/features/messages/services.rs` | New Rust function parallel to `build_system_instruction()` | Backend prompt builder for new model |

### Phase 1: Migrate One Scenario End-to-End

Pick `basic-ticket-refine` — it's already the most deliverable-like.

| # | Task | File(s) | What | Why |
|---|---|---|---|---|
| 1.1 | Add `task` to `basic-ticket-refine` | `scenarios.ts` | Populate `task: { instruction, deliverableFormat, template, referenceInfo }` | First scenario with new model |
| 1.2 | Set `assistanceMode: "on-request"` | `scenarios.ts` | Add `assistanceMode` to behavior | Control help level |
| 1.3 | Replace `customPrompt` | `scenarios.ts` | Remove role-play prompt, add `forbidRolePlay: true` | Kill role-play for this scenario |
| 1.4 | Wire `buildSupportPrompt()` | `sessions.ts` | In `sendMessage()`: if `scenario.task` exists, use `buildSupportPrompt()` instead of old path | Route new scenarios through new prompt builder |
| 1.5 | Wire backend | `messages/services.rs` | In `build_system_instruction()`: if `task` field is present in `AgentContext`, delegate to `build_support_system_instruction()` | Backend routing |
| 1.6 | Verify evaluation still works | `evaluations/services.rs` | Confirm evaluation prompt is unaffected (it already evaluates user output, not role-play) | No regression |
| 1.7 | Test end-to-end | Manual | Run `basic-ticket-refine` session: start → submit → evaluate. Verify agent doesn't role-play, evaluation scores correctly | Validate migration |

### Phase 2: Migrate All Scenarios

| # | Task | File(s) | What | Why |
|---|---|---|---|---|
| 2.1 | Migrate all BASIC/singleResponse scenarios | `scenarios.ts` | Add `task` field, remove `customPrompt` role-play | ~15 scenarios, simplest migration |
| 2.2 | Migrate test-case scenarios | `scenarios.ts` | Add `task` with `deliverableFormat: "structured"`, template sections | ~7 scenarios, already deliverable-oriented |
| 2.3 | Migrate requirement-definition scenarios | `scenarios.ts` | Add `task` with `assistanceMode: "guided"` | ~7 scenarios, need guided support |
| 2.4 | Migrate CHALLENGE scenarios | `scenarios.ts` | These need most thought — some may keep limited role-play as sub-step | ~15 scenarios, most complex |
| 2.5 | Replace global systemPrompt | `agentProfiles.ts` | Change from "you are engineer/designer" to "you are a support assistant" | Remove global role-play identity |
| 2.6 | Replace tonePrompt | `agentProfiles.ts` | Change from "team member tone" to "supportive guide tone" | Align tone with new role |
| 2.7 | Clean up `build_system_instruction()` | `messages/services.rs` | Remove old customPrompt/role-play path, make `build_support_system_instruction()` the default | Delete legacy code |
| 2.8 | Remove `customPrompt` from types | `types/index.ts`, `models/mod.rs` | Remove deprecated field | Clean up |
| 2.9 | Update evaluation prompts | `evaluations/services.rs` | Update evaluator system prompt: "evaluate the user's deliverable" instead of "evaluate the user's utterances" | Align evaluation with deliverable focus |
| 2.10 | Update UI guide messages | `scenarios.ts` (`applyScenarioGuideMessages`) | Update in-app instructions to match support model | UX alignment |

### Phase 3: Enhancements (Post-Migration)

| # | Task | Why |
|---|---|---|
| 3.1 | Add deliverable templates visible in UI | Users can see expected format before starting |
| 3.2 | Add progressive hints system | Unlock hints as user struggles |
| 3.3 | Add deliverable-specific evaluation rubrics | Score deliverable structure, not just conversation |
| 3.4 | Add agent "review mode" | User submits draft → agent reviews → user revises |

---

## D) Example: Migrated Scenario Definition

### Before (Current)

```typescript
{
  id: "basic-ticket-refine",
  title: "チケット要件整理",
  discipline: "BASIC",
  scenarioType: "basic",
  description: "チケットの目的と受入条件を整理する。",

  // 🔴 Role-play: Agent pretends to be an engineer
  customPrompt: "あなたはチケットの整理内容を受け取るエンジニアです。要件整理に対して、実装者の立場から建設的に応答してください。",

  behavior: singleResponseBehavior,
  product: sharedProduct,
  mode: "guided",
  kickoffPrompt: "このチケットの目的と受入条件を整理してください。",
  evaluationCriteria: simpleTicketCriteria,
  passingScore: 60,
  missions: [
    { id: "basic-ticket-m1", title: "チケットを整理する", order: 1 },
  ],
  supplementalInfo: "目的・受入条件・依存関係を簡潔に整理してください。",
}
```

### After (Migrated)

```typescript
{
  id: "basic-ticket-refine",
  title: "チケット要件整理",
  discipline: "BASIC",
  scenarioType: "basic",
  description: "チケットの目的と受入条件を整理する。",

  // ✅ No customPrompt — no role-play
  // customPrompt is removed entirely

  task: {
    instruction: "以下のチケットについて、目的・受入条件・依存関係を整理してください。",
    deliverableFormat: "structured",
    template: {
      format: "structured",
      sections: ["目的（ユーザーストーリー形式）", "受入条件（AC）", "依存関係", "リスク"],
      example: `## 目的
「ユーザーとして、〇〇できるようにしたい。なぜなら〇〇だから。」

## 受入条件
- [ ] 〇〇の場合、〇〇が表示される
- [ ] 〇〇が〇〇以内に完了する

## 依存関係
- API設計: 担当〇〇、期日〇〇

## リスク
- 〇〇の場合、〇〇が発生する可能性がある → 対策: 〇〇`,
    },
    referenceInfo: "目的・受入条件・依存関係を簡潔に整理してください。",
  },

  assistanceMode: "on-request",
  behavior: {
    ...singleResponseBehavior,
    forbidRolePlay: true,
  },

  product: sharedProduct,
  mode: "guided",
  kickoffPrompt: "このチケットの目的と受入条件を整理してください。",
  evaluationCriteria: simpleTicketCriteria,
  passingScore: 60,
  missions: [
    { id: "basic-ticket-m1", title: "チケットを整理する", order: 1 },
  ],
  supplementalInfo: "目的・受入条件・依存関係を簡潔に整理してください。",
}
```

### Challenge Scenario — Before/After

**Before:**
```typescript
{
  id: "coming-incident-response",
  title: "P1障害: ログイン不能バグの緊急対応",
  discipline: "CHALLENGE",
  description: "全ユーザーがログインできない致命的不具合に対し、初動対応と報告方針を会話で確定する。",

  // 🔴 Role-play: Agent is an urgent engineer
  customPrompt: "あなたは緊急の障害を報告するエンジニアです。状況の深刻さを伝え、PMの迅速な判断と指示を求める緊迫感を持って応答してください。",
  // ...
}
```

**After:**
```typescript
{
  id: "coming-incident-response",
  title: "P1障害: ログイン不能バグの緊急対応",
  discipline: "CHALLENGE",
  description: "全ユーザーがログインできない致命的不具合に対し、初動対応と報告方針を整理する。",

  task: {
    instruction: "P1障害が発生しました。以下の状況を読み、PMとして初動対応計画を作成してください。",
    deliverableFormat: "structured",
    template: {
      format: "structured",
      sections: ["影響範囲と緊急度", "初動対応アクション", "連絡先とエスカレーション", "初回報告文"],
    },
    referenceInfo: `状況:
- 本番環境でログインAPIが500エラーを返し続けている
- 全ユーザーがログイン不能
- 発生時刻: 不明（最初のアラートから10分経過）
- 影響範囲: 全ユーザー`,
  },

  assistanceMode: "guided",  // agent asks clarifying questions to help user think through
  behavior: {
    ...challengeBehavior,
    forbidRolePlay: true,
  },
  // ...
}
```

---

## E) Support Agent Prompt Template

### New `systemPrompt` (replaces `agentProfiles.ts`)

```typescript
const supportSystemPrompt = `あなたはPMスキル学習の支援アシスタントです。ユーザーはPMスキルを練習中の学習者です。

## あなたの役割
- ユーザーがタスクを完了できるよう支援する
- テンプレート、ヒント、チェックリストを提供する
- ユーザーの成果物をレビューし、改善ポイントを指摘する
- ユーザーの代わりに成果物を作成しない

## 絶対に守るルール
1. チームメンバー（エンジニア、デザイナー、POなど）を演じない
2. ユーザーの代わりにタスクを完了しない
3. 答えを直接教えずに、考えるためのヒントを提供する
4. 成果物のフォーマットや構成についてアドバイスする
5. 「もう少し具体的に」「〇〇の観点は検討しましたか？」のように問いかけで導く

## 応答スタイル
- 簡潔で明確に応答する（1〜3文）
- 箇条書きやMarkdownは、テンプレート提示時のみ使用可
- 敬語で丁寧に、ただし冗長にならない`;
```

### New `tonePrompt`

```typescript
const supportTonePrompt = `会話トーン:
- 学習を支援する親しみやすいコーチとして振る舞う
- 簡潔で具体的に答える
- 過度な褒め言葉は避け、建設的に指摘する
- 「ユーザーさん」や「あなた」は使わず、直接的に語りかける`;
```

### `buildSupportPrompt()` Function

```typescript
// frontend/src/services/sessions.ts

export function buildSupportPrompt({
  scenario,
  productConfig,
  profile,
}: {
  scenario: Scenario;
  productConfig?: ProductConfig;
  profile: AgentProfile;
}): AgentContext {
  const task = scenario.task;
  if (!task) {
    // Fallback to legacy path
    return buildLegacyAgentContext(scenario, productConfig, profile);
  }

  // Build task instruction section
  const taskSection = [
    `## タスク指示`,
    task.instruction,
    ...(task.template?.sections
      ? [`\n期待される構成:`, ...task.template.sections.map((s) => `- ${s}`)]
      : []),
    ...(task.template?.example
      ? [`\n## 成果物の例\n${task.template.example}`]
      : []),
  ].join("\n");

  // Build assistance mode rules
  const modeRules = buildAssistanceModeRules(scenario.assistanceMode ?? "on-request");

  // Build reference info
  const referenceSection = task.referenceInfo
    ? `## 背景情報\n${task.referenceInfo}`
    : "";

  // Build product context (reuse existing logic)
  const productContext = formatProductContext(scenario, productConfig);

  // Compose scenarioPrompt with all task context
  const scenarioPrompt = [taskSection, referenceSection, modeRules]
    .filter(Boolean)
    .join("\n\n");

  return {
    systemPrompt: profile.systemPrompt,
    tonePrompt: profile.tonePrompt,
    modelId: profile.modelId,
    scenarioPrompt,
    scenarioTitle: scenario.title,
    scenarioDescription: scenario.description,
    productContext,
    behavior: scenario.behavior,
    // No customPrompt — the support systemPrompt handles identity
  };
}

function buildAssistanceModeRules(mode: AssistanceMode): string {
  const rules: Record<AssistanceMode, string> = {
    "hands-off": `## 支援モード: 見守り
- ユーザーの質問には答えない
- タスク完了後に評価のみ行う`,
    "on-request": `## 支援モード: 質問対応
- ユーザーから質問があった場合のみ応答する
- こちらから積極的にアドバイスしない
- ヒントは求められたときだけ提供する`,
    "guided": `## 支援モード: ガイド付き
- ユーザーの進捗を確認し、次のステップを提案してよい
- 質問は1つずつ
- 考え方のフレームワークを示してよいが、答えは教えない`,
    "review": `## 支援モード: レビュー
- ユーザーが成果物を提出するまで待つ
- 提出されたら、改善ポイントをフィードバックする
- 良い点も指摘する`,
  };
  return rules[mode];
}
```

### Backend: `build_support_system_instruction()` (Rust)

```rust
// backend/src/features/messages/services.rs

fn build_support_system_instruction(ctx: &AgentContext) -> String {
    let mut sections = Vec::new();

    // 1. Fixed role (never changes per scenario)
    sections.push(ctx.system_prompt.clone());

    // 2. Task instruction (from scenario_prompt, which now contains task details)
    sections.push(ctx.scenario_prompt.clone());

    // 3. Scenario context
    if ctx.scenario_title.is_some() || ctx.scenario_description.is_some() {
        let mut lines = vec!["## シナリオ文脈".to_string()];
        if let Some(title) = &ctx.scenario_title {
            lines.push(format!("- タイトル: {}", title));
        }
        if let Some(desc) = &ctx.scenario_description {
            lines.push(format!("- 説明: {}", desc));
        }
        sections.push(lines.join("\n"));
    }

    // 4. Tone
    if let Some(tone) = &ctx.tone_prompt {
        if !tone.trim().is_empty() {
            sections.push(format!("## 会話トーン\n{}", tone));
        }
    }

    // 5. Product context
    if let Some(product) = &ctx.product_context {
        sections.push(product.clone());
    }

    // 6. Guardrails (always appended)
    sections.push([
        "## ガードレール",
        "- チームメンバーを演じない（エンジニア、デザイナー、PO等の役割を装わない）",
        "- ユーザーの代わりに成果物を書かない",
        "- 1〜3文で簡潔に応答する",
        "- テンプレート提示時以外は箇条書き・Markdownを使わない",
    ].join("\n"));

    sections.join("\n\n")
}
```

---

## F) Risks & Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **CHALLENGE scenarios lose richness** without role-play context | HIGH | Allow a controlled `contextNarrative` field that provides situational context *without* the agent adopting a character. E.g., "The following situation has occurred: ..." instead of "You are an engineer who..." |
| **Evaluation regression** — scores may shift when agent behavior changes | MEDIUM | Run evaluation on 5+ scenarios with both old and new prompts before cutting over. Compare score distributions. |
| **User confusion** — existing users expect the current interaction model | MEDIUM | Add a guide message at scenario start explaining the new support model. Phase in gradually. |
| **Backend/frontend desync** during gradual migration | LOW | The `task` field is optional; both old and new paths coexist. Routing is determined by `task` presence. |
| **Loss of `customPrompt` flexibility** | LOW | `customPrompt` remains available during migration. For truly custom scenarios, add a `taskOverridePrompt` field that can inject extra instructions *without* role-play identity. |
| **Mission detection may degrade** | LOW | Mission inference already works on user message content vs mission definitions — it doesn't depend on agent role. No change needed. |
| **~40 scenarios to migrate** | MEDIUM | Do it in batches by `scenarioType`: basic-singleResponse → test-case → requirement-definition → challenge. Each batch can be a separate PR. |

### Decision Points for the Team

1. **CHALLENGE scenarios**: Should the agent provide *situational context* (e.g., "A P1 incident has occurred, here are the facts...") as background info, or should it stay purely as a question/answer support? Recommend: provide context as `task.referenceInfo`, not as agent character.

2. **`agentOpeningMessage`**: Currently the agent speaks first in many scenarios. In the new model, should the system show a task briefing instead of an agent message? Recommend: yes, replace with a system message containing the task instruction.

3. **Evaluation criteria**: Should criteria shift from "communication quality" to "deliverable quality"? Recommend: yes for BASIC, keep some communication criteria for CHALLENGE scenarios where collaboration skills matter.
