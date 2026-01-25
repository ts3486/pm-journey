# Scenario Configuration Guide

This document explains how scenarios are configured in pm-journey, including agent character/tone, initial messages, completion conditions, and scenario metadata.

## Overview

Scenarios are the core learning units in pm-journey. Each scenario simulates a real PM/PMO situation with AI-powered guidance. The configuration is split across several files:

| Aspect | Location |
|--------|----------|
| Scenario definitions | `frontend/src/config/scenarios.ts` |
| Agent profiles (tone/character) | `frontend/src/config/agentProfiles.ts` |
| Type definitions | `frontend/src/types/session.ts` |
| System prompt composition | `frontend/src/services/sessions.ts` → `backend/src/api/mod.rs` |
| Mission status handling | `frontend/src/services/sessions.ts` (manual) |
| Session evaluation | `backend/src/api/mod.rs` |

---

## 1. Scenario Definitions

**File:** `frontend/src/config/scenarios.ts`

Each scenario is defined as an object with the following structure:

```typescript
{
  id: string;                    // Unique identifier (e.g., "basic-intro-alignment")
  title: string;                 // Display title
  description: string;           // Short description shown in catalog
  discipline: "BASIC" | "CHALLENGE";  // Determines agent profile
  product: ProductInfo;          // Scenario context/metadata
  mode: "guided" | "freeform";   // Scenario mode
  kickoffPrompt: string;         // Initial instruction for the agent
  evaluationCriteria: EvaluationCategory[];  // Grading rubric
  passingScore: number;          // Minimum score to pass (e.g., 70)
  missions: Mission[];           // Tasks user must complete
  supplementalInfo?: string;     // Additional guidance for users
}
```

### Current Scenarios

| ID | Title | Discipline |
|----|-------|------------|
| `basic-intro-alignment` | 自己紹介＆期待値合わせ | BASIC |
| `basic-ticket-refine` | チケット要件整理 | BASIC |
| `basic-testcase-design` | テストケース作成 | BASIC |
| `challenge-project-rescue` | 遅延プロジェクト立て直し | CHALLENGE |
| `challenge-scope-negotiation` | スコープ／リソース交渉 | CHALLENGE |
| `challenge-conflict-mediation` | コンフリクト調整 | CHALLENGE |

---

## 2. Agent Character and Tone

**File:** `frontend/src/config/agentProfiles.ts`

The agent's character and tone is determined by the `discipline` field of the scenario. Three profiles exist:

### BASIC Profile
Used for `discipline: "BASIC"` scenarios.

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたは基礎シナリオのPMメンターです。短時間で論点整理を手伝い、次の一手を具体的に示してください。敬意を持ちつつ、簡潔に。"
}
```

**Character:** Supportive PM Mentor who helps with quick issue clarification and provides concrete next steps.

### CHALLENGE Profile
Used for `discipline: "CHALLENGE"` scenarios.

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたはチャレンジシナリオのPM/PMOアドバイザーです。難易度の高い状況で、交渉・リスク判断・意思決定を支援します。前提を確認し、根拠を添えて提案してください。"
}
```

**Character:** PM/PMO Advisor for high-difficulty situations, supporting negotiation, risk assessment, and decision-making.

### DEFAULT Profile
Fallback when scenario discipline is unknown.

```typescript
{
  modelId: "gemini-3-flash-preview",
  systemPrompt: "あなたはPMとしてユーザーと対話し、要件・リスク・次アクションを整理します。簡潔で具体的に、敬語で回答してください。"
}
```

### How Profile is Resolved

The `resolveAgentProfile(scenarioId)` function:
1. Looks up the scenario by ID
2. Checks the `discipline` field
3. Returns the matching profile (BASIC, CHALLENGE, or DEFAULT)

**To modify agent tone:** Edit the `systemPrompt` in `agentProfiles.ts`.

---

## 3. Initial Message (Kickoff Prompt)

**File:** `frontend/src/config/scenarios.ts` (per scenario)

The first message context comes from the `kickoffPrompt` field in each scenario. This is NOT displayed directly to the user but is included in the system instruction sent to the AI.

### Example Kickoff Prompts

**basic-intro-alignment:**
```
あなたは新規PJに参加するPM/PMOとして、初回ミーティングで役割と期待値を揃えます。短時間で目的・進め方・次アクションを決めてください。
```

**challenge-project-rescue:**
```
あなたは遅延しているプロジェクトのPM/PMOです。遅延要因を整理し、スコープ再交渉とリカバリ計画をまとめてください。
```

### How the System Prompt is Composed

**Files:** `frontend/src/services/sessions.ts` → `backend/src/api/mod.rs`

The frontend builds an **agent context** for every user message and sends it to the backend API.
That context is composed from:

1. **Agent profile** (`agentProfiles.ts`) → `systemPrompt` + `modelId`
2. **Scenario kickoff prompt** (`scenarios.ts`) → `kickoffPrompt`
3. **Scenario metadata** (`scenarios.ts`) → title/description + product info

The backend merges these into a single system instruction and calls Gemini.
This guarantees the response matches the agent’s persona and the active scenario context.

---

## 4. Completion Conditions (Missions)

### Mission Definition

**File:** `frontend/src/config/scenarios.ts`

Each scenario defines 3 missions that the user must complete:

```typescript
missions: [
  { id: "basic-intro-m1", title: "自己紹介と役割・責任範囲の確認", order: 1 },
  { id: "basic-intro-m2", title: "成功条件と優先度の合意", order: 2 },
  { id: "basic-intro-m3", title: "次アクションと連絡リズムの設定", order: 3 },
]
```

### Mission Structure

```typescript
type Mission = {
  id: string;           // Unique identifier
  title: string;        // What the user needs to accomplish
  description?: string; // Optional detailed description
  order: number;        // Display/execution order
}
```

### Mission Completion Detection

Mission completion is currently **manual**. The UI provides mission checkboxes,
and their state is stored in session data via the backend API.

If you want AI-based detection, add a backend endpoint and wire it from
`frontend/src/services/sessions.ts`.

### Scenario Completion

A scenario is considered complete when ALL missions are marked as completed. The UI enables the "Complete Scenario" button only when all mission checkboxes are filled.

---

## 5. Scenario Information (Product Metadata)

**File:** `frontend/src/config/scenarios.ts`

Each scenario includes detailed product context in the `product` field:

```typescript
product: {
  name: string;              // Product/session name
  summary: string;           // Brief description
  audience: string;          // Target stakeholders
  problems: string[];        // Problems being addressed
  goals: string[];           // Session objectives
  differentiators: string[]; // Unique aspects
  scope: string[];           // What's in scope
  constraints: string[];     // Limitations
  timeline: string;          // Time context
  successCriteria: string[]; // How success is measured
  uniqueEdge?: string;       // Learning focus
  techStack?: string[];      // Tech context (optional)
  coreFeatures?: string[];   // Key features (optional)
}
```

### Example Product Info

```typescript
product: {
  name: "オンボーディングワークショップ",
  summary: "ステークホルダーと目的・役割・進め方を合意する初回ミーティング。",
  audience: "プロダクトオーナー、開発リーダー、QA",
  problems: ["役割が不明瞭", "優先度の解像度が低い"],
  goals: ["役割・責任の明確化", "初期コミュニケーション計画の合意"],
  differentiators: ["シンプルな準備リスト", "会話テンプレート"],
  scope: ["自己紹介", "目的確認", "進め方合意"],
  constraints: ["30分タイムボックス", "参加者3名想定"],
  timeline: "初回ミーティング当日",
  successCriteria: ["期待値の一致が確認できる", "次アクションが2件以上決定"],
  uniqueEdge: "短時間で役割と進め方を固める練習に特化",
  techStack: ["Next.js", "Tailwind CSS", "Axum"],
  coreFeatures: ["メモ", "アクション記録"],
}
```

---

## 6. Evaluation Criteria

Each scenario has **unique evaluation criteria** tailored to its learning objectives. Criteria are defined using the `RatingCriterion` type:

```typescript
type RatingCriterion = {
  id: string;                    // Unique identifier (e.g., "intro-role-clarity")
  name: string;                  // Display name in Japanese
  weight: number;                // Percentage weight (0-100)
  description: string;           // What this criterion measures
  scoringGuidelines: {
    excellent: string;           // 90-100: What constitutes excellent
    good: string;                // 70-89: What constitutes good
    needsImprovement: string;    // 50-69: What needs improvement
    poor: string;                // 0-49: What constitutes poor
  };
};
```

### Scenario-Specific Criteria

| Scenario | Criteria |
|----------|----------|
| `basic-intro-alignment` | 役割・責任の明確化, 期待値の擦り合わせ, コミュニケーション姿勢, 次アクションの具体性 |
| `basic-ticket-refine` | 目的・ゴールの明確化, 受入条件(AC)の定義, 依存関係の整理, リスクの特定 |
| `basic-testcase-design` | 正常系の網羅性, 異常系・境界値の考慮, 前提条件の明確化, 優先度と効率性 |
| `challenge-project-rescue` | 遅延要因の分析, スコープ再構成, リカバリ計画の具体性, ステークホルダー対応 |
| `challenge-scope-negotiation` | 交渉準備と分析, 代替案の提示, 説得力と論理性, 合意形成と記録 |
| `challenge-conflict-mediation` | 事実と解釈の分離, 中立性の維持, 合意形成力, フォローアップ計画 |

The `passingScore` (typically 70) determines whether the user passes.

---

## 6.1 Session Rating (Backend)

**Files:**
- API Endpoint: `backend/src/api/mod.rs` → `evaluate_session`
- Service: `frontend/src/services/sessions.ts` → `evaluate()`

評価はバックエンド側で生成されます。現行実装は簡易の固定値で、Gemini による評価は未実装です。
本格的な AI 評価を行う場合は、バックエンドに評価用プロンプト生成と Gemini 呼び出しを追加してください。

---

## 7. Adding a New Scenario

1. **Define scenario-specific evaluation criteria** in `frontend/src/config/scenarios.ts`:
   - Create a new `RatingCriterion[]` array with 4 criteria
   - Each criterion needs: `id`, `name`, `weight`, `description`, `scoringGuidelines`
   - Ensure weights sum to 100%
   - Write clear scoring guidelines for excellent/good/needsImprovement/poor

2. **Add scenario object** in `frontend/src/config/scenarios.ts`:
   - Choose a unique `id`
   - Set `discipline` to "BASIC" or "CHALLENGE"
   - Write the `kickoffPrompt` for scenario context
   - Define 3 `missions`
   - Fill in `product` metadata
   - Reference your new criteria array in `evaluationCriteria`
   - Set `passingScore` (typically 70)

3. **Optionally add a new agent profile** in `frontend/src/config/agentProfiles.ts`:
   - If you need a new tone/character, add a new profile
   - Update `resolveAgentProfile()` to use it

4. **Backend sync** (if using API):
   - Mirror the scenario in `backend/src/models/mod.rs` in the `default_scenarios()` function

### Example: Adding Criteria for a New Scenario

```typescript
const myNewScenarioCriteria: RatingCriterion[] = [
  {
    id: "my-criterion-1",
    name: "〇〇の明確化",
    weight: 25,
    description: "〇〇について明確に定義できているか",
    scoringGuidelines: {
      excellent: "具体的で測定可能な〇〇を定義",
      good: "〇〇を定義。一部曖昧な点あり",
      needsImprovement: "〇〇に言及したが不十分",
      poor: "〇〇の定義がない",
    },
  },
  // ... 3 more criteria
];
```

---

## 8. Configuration Quick Reference

| What to Change | Where |
|----------------|-------|
| Add/edit scenarios | `frontend/src/config/scenarios.ts` |
| Change agent tone/character | `frontend/src/config/agentProfiles.ts` → `systemPrompt` |
| Change initial scenario context | `frontend/src/config/scenarios.ts` → `kickoffPrompt` |
| Add/edit completion tasks | `frontend/src/config/scenarios.ts` → `missions` |
| Add/edit evaluation criteria | `frontend/src/config/scenarios.ts` → create new `RatingCriterion[]` |
| Change scoring guidelines | `frontend/src/config/scenarios.ts` → `scoringGuidelines` in each criterion |
| Change passing threshold | `frontend/src/config/scenarios.ts` → `passingScore` |
| Add supplemental guidance | `frontend/src/config/scenarios.ts` → `supplementalInfo` |
| Modify evaluation logic | `backend/src/api/mod.rs` → `evaluate_session` |
| Adjust model/temperature | (when AI evaluation is added) `backend/src/api/mod.rs` |
