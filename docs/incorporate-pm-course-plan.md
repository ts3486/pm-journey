# Plan: Incorporate Claude Code PM Course Concepts into PM-Journey

## Context

The [Claude Code PM Course](https://github.com/carlvellotti/claude-code-pm-course) (by Carl Vellotti, available at [ccforpms.com](https://ccforpms.com/)) is a free interactive course teaching Product Managers how to use AI effectively. It covers real-world PM workflows like PRD writing, data analysis, and product strategy — all scenario-based and built around a fictional company "TaskFlow."

PM-Journey already has 40+ scenarios focused on Japanese PM training with AI evaluation. The goal is to incorporate the course's **scenario content, frameworks, and pedagogical strategies** to significantly expand pm-journey's depth and breadth — especially for advanced PM skills that go beyond the current ticket/meeting/test-case focus.

### What PM-Journey Has Today
- 40+ scenarios (BASIC + CHALLENGE) mostly in Japanese
- Role-play agent model (agent acts as engineer/designer)
- Focus: ticket refinement, meeting minutes, test cases, acceptance criteria, schedule sharing
- AI evaluation with 4-category rubrics
- In-progress refactor toward support-assistant model (`docs/refactor-support-agent.md`)

### What the Claude PM Course Adds
- **PRD writing** with Socratic questioning + multi-perspective review
- **Data analysis** with funnel analysis, ROI modeling, A/B test interpretation
- **Product strategy** with Rumelt's Strategy Kernel, competitive research, devil's advocate
- **Pedagogical techniques**: progressive frameworks, multi-perspective feedback, structured templates
- Fictional company context (TaskFlow) that ties all scenarios together

### Course Module Summary

#### Module 1: Fundamentals (7 lessons)
- 1.1: Welcome to TaskFlow (fictional SaaS company)
- 1.2: File visualization
- 1.3: First PM tasks — meeting processing (35min→2min), user research synthesis (160min→5min), stakeholder communication
- 1.4: Parallel agents — batch processing 10 meeting transcripts, parallel research, multi-source analysis
- 1.5: Custom sub-agents — engineer, executive, UX researcher perspectives
- 1.6: Project memory (CLAUDE.md)
- 1.7: Navigation

#### Module 2: Advanced PM Work (3 lessons)
- **2.1: Write a PRD** — 4 core techniques: full context, Socratic questioning, multiple strategic approaches, multi-perspective sub-agent feedback
- **2.2: Analyze Data** — 3-phase workflow: discovery (funnel analysis), impact estimation (ROI modeling with 3 scenarios), experiment analysis (A/B test with 5-level hierarchy)
- **2.3: Product Strategy** — Rumelt's Strategy Kernel (Diagnosis → Guiding Policy → Coherent Actions), 5 strategic choice framework, devil's advocate pressure-testing, competitive research

---

## Plan: 4 Workstreams

### WS1: Add New Scenario Categories (Content Expansion)

Add 3 new high-value scenario categories inspired by the course's Module 2.

#### 1A: PRD Writing Scenarios (3 scenarios)
Adapt the course's PRD module into pm-journey scenarios.

| Scenario | Type | Assistance Mode | Key Technique |
|----------|------|-----------------|---------------|
| `adv-prd-basic` | BASIC | guided | Write a PRD for a simple feature using template + Socratic questions |
| `adv-prd-multi-perspective` | CHALLENGE | review | Write PRD, get engineer/executive/researcher feedback, iterate |
| `adv-prd-strategic-options` | CHALLENGE | on-request | Generate 3 strategic approaches for a feature, compare & select |

**Key framework to embed**: Socratic questioning categories (from Module 2.1):

| Category | Sample Questions |
|----------|------------------|
| Problem Clarity | Which user pain point does this solve? Who feels it most? Cost of inaction? |
| Solution Validation | Why this solution? What alternatives exist? Minimal version? |
| Success Criteria | How to measure success? What indicates failure? Target metrics? |
| Constraints | Technical risks? What's not being built? Half-time scope? |
| Strategic Fit | Why build now? Strategy alignment? Competitive impact? |

**Deliverable template sections**: Problem statement, User stories, Solution overview, Success metrics, Risks & mitigations, Dependencies, Out of scope.

#### 1B: Data Analysis Scenarios (3 scenarios)
Adapt the course's data-driven PM workflow.

| Scenario | Type | Assistance Mode | Key Technique |
|----------|------|-----------------|---------------|
| `adv-data-funnel` | BASIC | guided | Analyze activation funnel drop-offs, identify key problem area |
| `adv-data-roi` | CHALLENGE | on-request | Build ROI model with 3 scenarios (pessimistic/realistic/optimistic) |
| `adv-data-abtest` | CHALLENGE | review | Analyze A/B test: topline → significance → segments → quality → leading indicators |

**Key framework**: ROI formula from Module 2.2:
```
Impact = Users Affected × Current Action Rate × Expected Lift × Value per Action
```

**Three-scenario estimation**:
| Scenario | Adoption | Lift | Purpose |
|----------|----------|------|---------|
| Pessimistic (20th %ile) | 30% | Conservative | Minimum threshold |
| Realistic (50th %ile) | 70% | Moderate | Most likely outcome |
| Optimistic (80th %ile) | 90% | Aggressive + retention | Best case |

**A/B Test analysis hierarchy** (5 levels):
1. Topline metrics
2. Statistical significance (p-value, CI)
3. Segment analysis (by customer type)
4. Quality metrics (retention, not just activation)
5. Leading indicators (feature adoption, virality)

**Deliverable formats**: `structured` for funnel analysis, `table` for ROI model, `structured` for experiment readout.

#### 1C: Product Strategy Scenarios (2 scenarios)
Adapt Rumelt's Strategy Kernel framework from Module 2.3.

| Scenario | Type | Assistance Mode | Key Technique |
|----------|------|-----------------|---------------|
| `adv-strategy-kernel` | CHALLENGE | guided | Diagnosis → Guiding Policy → Coherent Actions for a product direction |
| `adv-strategy-competitive` | CHALLENGE | on-request | Competitive analysis + strategic tradeoffs + devil's advocate pressure-test |

**Key framework**: Rumelt's Strategy Kernel:
```
Diagnosis (Challenge) → Guiding Policy (Approach) → Coherent Actions (Roadmap)
```

**5 Strategic Choice Dimensions**:
1. Focus vs. Breadth (deep specialization OR spread across features)
2. Competitive Response (out-innovate OR differentiate differently OR own roadmap)
3. Business Model (premium tier OR subsidized adoption OR usage-based)
4. Product Scope (AI as primary product OR enhancement OR job-focused tool)
5. Risk Tolerance (move fast OR deliberate/defensible OR wait-and-learn)

**Strategy vs. Not-Strategy** distinction (from course):
| Not Strategy | Real Strategy |
|---|---|
| "Increase revenue 50%" (goal) | "Focus exclusively on voice-first AI for SMBs" |
| "Build AI chat, voice, automation" (features) | "Go deep on one capability where unique advantage possible" |
| "Be the best productivity tool" (vision) | "Subsidize AI costs initially to build defensibility" |

---

### WS2: Enrich Existing Company Context with Personas & Competitive Landscape

The course uses a unified fictional company (TaskFlow) with consistent personas, product details, and competitive landscape. PM-Journey already has a well-defined default product — **保険金請求サポートサービス** (Insurance Claims Support Service) defined in `backend/src/features/product_config/models.rs` as `default_product()`. The new advanced scenarios will use this existing product context.

#### Existing Product Context (default_product)
```
Product: 保険金請求サポートサービス
- ユーザーが保険商品を購入し、証跡を提出して保険金を受け取れる請求体験を提供
- Audience: 個人契約者、小規模事業者、保険金請求を担当する運用チーム
- Problems: 証跡提出の分かりづらさ、差し戻し理由の不明確さ、ステータス不透明
- Goals: 迷わず請求完了、リードタイム短縮、初回提出受理率向上
- Core Features: 保険商品購入、証跡アップロード、請求ステータス管理、審査・承認ワークフロー
```

#### Additions: Personas (inspired by TaskFlow's Sarah/Mike/Alex)
New advanced scenarios will embed stakeholder personas in their `supplementalInfo` or `customPrompt`:

- **田中（運用チームリーダー）** — 審査効率、コンプライアンス、チームの処理キャパシティを重視
- **佐藤（バックエンドエンジニア）** — API設計、パフォーマンス、セキュリティ要件を重視
- **山田（CS/サポート担当）** — ユーザーからの問い合わせ削減、UXの分かりやすさを重視

#### Additions: Competitive Landscape (for strategy scenarios)
Strategy scenarios will include competitive context in their `supplementalInfo`:

- Competitor A: 大手保険会社の既存請求システム（機能は広いが UI が古い）
- Competitor B: InsurTech スタートアップ（モダンUI、AI審査、但し実績が少ない）
- Competitor C: 汎用ワークフローツール（Salesforce等）をカスタマイズした運用

**Files to modify**:
- `backend/src/models/mod.rs` — New scenarios reference the existing `default_product()` product context; personas and competitive info embedded in scenario-level fields (`supplementalInfo`, `customPrompt`)

---

### WS3: Add Socratic Questioning & Devil's Advocate to Agent Behavior

The course emphasizes AI as a "thinking partner" — not producing deliverables, but sharpening the user's thinking through questions.

#### New Behavior Modes

Add two new `responseStyle` options to `ScenarioBehavior`:

| Mode | Description | When Used |
|------|-------------|-----------|
| `socratic` | Agent asks clarifying questions from 5 categories before user starts writing | PRD scenarios |
| `devils_advocate` | Agent challenges each user decision with counter-arguments | Strategy scenarios |

**Socratic question categories** (embedded in scenario `supplementalInfo` or `task.referenceInfo`):
1. Problem Clarity — Which user pain point? Who feels it most? Cost of inaction?
2. Solution Validation — Why this solution? Alternatives? Minimal version?
3. Success Criteria — How to measure? What indicates failure? Target metrics?
4. Constraints — Technical risks? What's not being built? Half-time scope?
5. Strategic Fit — Why now? Strategy alignment? Competitive impact?

**Devil's advocate pattern**: After user states a strategic choice, agent generates a counter-argument. User must either defend or reconsider.

**Files to modify**:
- `frontend/src/types/index.ts` — Add `socratic` and `devils_advocate` to `responseStyle` union
- `backend/src/models/mod.rs` — Mirror in Rust types
- `backend/src/features/messages/services.rs` — Add rules for new response styles in `build_system_instruction()`

---

### WS4: Add Progressive Hints & Framework Templates

The course provides structured templates and progressive help. PM-Journey can adopt this to improve learning outcomes.

#### 5A: Deliverable Templates
Add visible templates for advanced scenarios so users know the expected output format before starting.

This aligns with the existing `task.template` concept from `docs/refactor-support-agent.md`. Templates would include:

**PRD Template**:
```
## 問題定義
- ユーザーペイン:
- 影響を受けるユーザー:
- 不作為のコスト:

## ソリューション概要
- 提案するアプローチ:
- なぜこのアプローチか:
- 最小限のバージョン:

## 成功指標
- 主要KPI:
- 失敗の指標:
- 目標数値:

## リスクと制約
- 技術的リスク:
- スコープ外:
- 依存関係:
```

**ROI Model Template**:
```
| シナリオ | 対象ユーザー | 採用率 | 現在の率 | 期待リフト | ユーザー単価 | 年間インパクト |
|----------|------------|--------|---------|-----------|-------------|--------------|
| 悲観的    |            |  30%   |         |           |             |              |
| 現実的    |            |  70%   |         |           |             |              |
| 楽観的    |            |  90%   |         |           |             |              |
```

**Strategy Document Template**:
```
## 診断（DIAGNOSIS）: 戦略的課題
[競合環境 + 制約 → 核心的な課題]

## 指導方針（GUIDING POLICY）: 戦略的アプローチ
[5つの選択を統合した方向性]
[明示的なトレードオフ — やらないこと]

## 整合的行動（COHERENT ACTIONS）: ロードマップ
### Q1: [具体的施策]
### Q2: [Q1の上に構築する施策]
### 成功指標: [ターゲット]
### 前提条件: [真でなければならないこと]
```

#### 5B: Progressive Hints
Add unlockable hints that reveal progressively:
- Hint 1: General direction ("ユーザーのサインアップから初回価値実感までのジャーニーを考えてみましょう")
- Hint 2: Specific framework ("RICEフレームワークで優先順位をつけてみましょう")
- Hint 3: Partial example ("強い受入条件の例: 「ユーザーが○○した場合、○○が表示される」")

**Files to modify**:
- `frontend/src/types/index.ts` — `hints?: string[]` already planned in the refactor doc's `TaskDefinition`
- Scenario definitions — Add `hints` arrays to new scenarios
- Frontend component — Add hint reveal UI (button that shows next hint)

---

## Evaluation Approach

The existing evaluation system — per-scenario `evaluationCriteria` with multiple scored categories + feedback — is retained as-is. Each new scenario category will define its own evaluation criteria appropriate to the skill being tested (e.g., PRD scenarios will evaluate problem clarity, solution viability, metric definition; strategy scenarios will evaluate diagnosis quality, tradeoff reasoning, action coherence). No structural changes to the evaluation pipeline are needed.

---

## WS0 (Pre-Work): Prune Unused Scenarios

Before adding new scenarios, remove the 32 defined-but-hidden scenarios that are not displayed in the home catalog. This reduces maintenance burden, shrinks `scenarios.ts` (~3500 lines), and makes the codebase easier to reason about.

### Current State

**47 scenarios defined** in `frontend/src/config/scenarios.ts`, but only **15 appear** in `homeScenarioCatalog` (the home page UI). The remaining 32 are fully implemented but unreachable to users.

### Scenarios to KEEP (15 — currently in homeScenarioCatalog)

#### Soft Skills (基礎ソフトスキル) — 2 scenarios
| ID | Title |
|----|-------|
| `basic-intro-alignment` | 自己紹介 |
| `basic-schedule-share` | ミーティング調整 |

#### Test Cases (テストケース作成) — 3 scenarios
| ID | Title |
|----|-------|
| `test-login` | ログイン機能 |
| `test-form` | フォーム機能 |
| `test-file-upload` | ファイルアップロード機能 |

#### Requirement Definition (要件定義) — 3 scenarios
| ID | Title |
|----|-------|
| `basic-requirement-definition-doc` | 要件定義文書作成 |
| `basic-requirement-hearing-plan` | ヒアリング計画 |
| `basic-requirement-user-story` | ユーザーストーリー作成 |

#### Incident Response (障害対応) — 3 scenarios (coming soon)
| ID | Title |
|----|-------|
| `coming-incident-response` | P1障害対応 |
| `coming-incident-triage-escalation` | トリアージ・エスカレーション |
| `coming-postmortem-followup` | ポストモーテム |

#### Business Execution (事業推進) — 3 scenarios (coming soon)
| ID | Title |
|----|-------|
| `coming-priority-tradeoff-workshop` | 優先度トレードオフ |
| `coming-stakeholder-negotiation` | ステークホルダー交渉 |
| `coming-decision-log-alignment` | 意思決定ログ |

Also keep `basic-meeting-minutes` — it's in the free plan access list (`planAccess.ts`).

### Scenarios to REMOVE (31)

#### BASIC — 14 scenarios
- `basic-acceptance-review`, `basic-docs-refine`, `basic-regression-smoke`
- `basic-requirement-consensus`, `basic-requirement-nfr`, `basic-requirement-priority-matrix`, `basic-requirement-risk-check`
- `basic-test-risk-review`, `basic-test-viewpoints`, `basic-testcase-design`
- `basic-ticket-refine`, `basic-ticket-splitting`, `basic-unknowns-discovery`

#### TEST — 4 scenarios
- `test-notification-settings`, `test-password-reset`, `test-profile-edit`, `test-search-filter`

#### CHALLENGE — 12 scenarios
- `challenge-ambiguous-request`, `challenge-conflict-mediation`, `challenge-deadline-advance`
- `challenge-impossible-request`, `challenge-priority-conflict`, `challenge-progress-visibility`
- `challenge-project-rescue`, `challenge-quality-fire`, `challenge-scope-addition`
- `challenge-scope-negotiation`, `challenge-stakeholder-misalignment`, `challenge-user-perspective`

### Removal Steps

1. **`frontend/src/config/scenarios.ts`** — Remove the 31 scenario definitions and any helper functions/criteria only used by them
2. **`backend/src/models/mod.rs`** — Remove corresponding scenarios from `default_scenarios()`
3. **`frontend/src/lib/planAccess.ts`** — Verify `freeScenarioIds` only references kept scenarios (already fine — it references `basic-meeting-minutes` which we keep)
4. **Shared behavior/criteria constants** — Remove any `singleResponseBehavior`, `challengeBehavior`, or evaluation criteria objects that become unused after deletion
5. **`cargo test` + `pnpm build`** — Verify no compile errors after removal

### Impact
- `scenarios.ts` shrinks from ~3500 lines to ~1200 lines (keeping 16 scenarios)
- `default_scenarios()` in Rust shrinks proportionally
- No user-facing impact — removed scenarios were never displayed

### Updated Implementation Order

| Phase | Workstream | Effort | Dependencies |
|-------|-----------|--------|--------------|
| **Phase 0** | **WS0: Prune unused scenarios** | Small | None |
| Phase 1 | WS3: Socratic + Devil's Advocate behavior modes | Small | None |
| Phase 2 | WS2: Company context enrichment | Small | None |
| Phase 3 | WS1A: PRD scenarios (3) | Medium | WS2, WS3 |
| Phase 4 | WS1B: Data analysis scenarios (3) | Medium | WS2 |
| Phase 5 | WS1C: Strategy scenarios (2) | Medium | WS2, WS3 |
| Phase 6 | WS4: Templates + hints | Small | WS1 |

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `frontend/src/config/scenarios.ts` | Remove 31 unused scenarios, add 8 new scenarios |
| `backend/src/models/mod.rs` | Remove 31 unused scenarios, add 8 new scenarios, new response styles |
| `frontend/src/types/index.ts` | Add `socratic`/`devils_advocate` to response style, hint support |
| `backend/src/features/messages/services.rs` | Add Socratic/devil's advocate rules to `build_system_instruction()` |

---

## Verification

1. **Scenario loading**: `cargo test` — ensure new scenarios deserialize correctly
2. **Agent behavior**: Start a PRD scenario session, verify Socratic questioning works
3. **Evaluation**: Complete a PRD scenario, verify evaluation returns scores per criteria category
4. **Frontend**: `pnpm build` — ensure type changes compile
5. **E2E**: Run through one full advanced scenario flow (select → chat → evaluate → review feedback)

---

## What This Does NOT Include (Out of Scope)

- **Parallel sub-agent execution** — The course uses Claude Code's agent system; pm-journey uses single Gemini calls. Not applicable.
- **Multi-perspective sub-agent evaluation** — The course uses separate sub-agents for engineer/executive/researcher feedback. PM-Journey's existing per-scenario evaluation criteria system is sufficient; new scenarios will simply define criteria appropriate to each skill area.
- **File operations / @-mentions** — Course-specific Claude Code features, not applicable to pm-journey's web UI.
- **Slide generation** — The course creates PowerPoint slides; pm-journey focuses on text deliverables.
- **English content** — New scenarios will be in Japanese, matching existing content.
- **New product/company context** — We use the existing 保険金請求サポートサービス (`default_product()`) rather than creating a new fictional company.
- **Module 1 fundamentals** — These teach Claude Code usage, not PM skills. Not applicable.

---

## Sources

- [Claude Code PM Course Repository](https://github.com/carlvellotti/claude-code-pm-course)
- [Course Website (ccforpms.com)](https://ccforpms.com/)
- [Module 2.1: Write a PRD](https://ccforpms.com/advanced/write-prd)
- [Module 2.2: Analyze Data](https://ccforpms.com/advanced/analyze-data)
- [Module 2.3: Product Strategy](https://ccforpms.com/advanced/product-strategy)
- [Vibe Sparking AI Review](https://www.vibesparking.com/en/blog/ai/claude-code/2026-01-06-claude-code-for-product-managers-free-course/)
