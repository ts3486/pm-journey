# Tasks: Olivia PM Simulation Web Experience

**Input**: Design documents from `/specs/001-pm-simulation-web/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include Playwright/Vitest (frontend) and cargo (backend) tests for affected surfaces; call out if a surface is untouched and why tests are not added.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Add frontend environment example with offline defaults (`NEXT_PUBLIC_API_BASE`, `NEXT_PUBLIC_OFFLINE_QUEUE`, `NEXT_PUBLIC_STORAGE_PREFIX`) in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/.env.example`
- [X] T002 Add backend environment example with HTTPS/API host defaults (`RUST_LOG`, `API_HOST`, `API_SCHEME=https`) in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Update session/domain types with `scenarioDiscipline` and multi-session catalog support in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/types/session.ts`
- [X] T004 [P] Persist session snapshots per-scenario (last-session pointer per scenario + kickoff autosave) in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/storage.ts`
- [X] T005 [P] Harden session service for offline queue/autosave gating and per-scenario resume/reset in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/sessions.ts`
- [X] T006 [P] Extend backend domain models with `scenarioDiscipline`, passing score, and seeded catalog entries in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/models/mod.rs`
- [X] T007 Add lifecycle telemetry helper (start/resume/reset/evaluate/history/export) stub with scenario metadata in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/telemetry.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Run PM simulation session end-to-end (Priority: P1) 🎯 MVP

**Goal**: Enable starting/resuming sessions per scenario (PM vs PMO), chatting with the AI, and running evaluation; history persists each scenario run independently.

**Independent Test**: From Home select any scenario (PM row or PMO row) to start a session; resume the last session for that scenario; exchange messages offline/online; trigger evaluation when online; each completed/quit run is saved separately.

### Tests for User Story 1

- [ ] T008 [US1] Add Playwright e2e for scenario selection → per-scenario resume → evaluation spinner/result in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/tests/e2e/us1-session.spec.ts`
- [ ] T009 [P] [US1] Add backend integration test for `/scenarios` list/detail and session create/message/evaluate flow in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/tests/scenario_session.rs`

### Implementation for User Story 1

- [X] T010 [US1] Define PM/PMO scenario catalog with ids/titles/summary/kickoff prompts in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/config/scenarios.ts`
- [X] T011 [P] [US1] Render Home with two rows (PM scenarios, PMO scenarios), per-scenario start/resume CTAs, and resume-most-recent hero in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/app/page.tsx`
- [X] T012 [P] [US1] Pass selected `scenarioId` via search params (honor `restart=1`), start sessions with kickoff prompt, and resume per-scenario snapshots in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/app/scenario/page.tsx`
- [X] T013 [P] [US1] Update session controls for scenario title display, offline evaluation disabling, per-scenario reset, and resume gating in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/SessionControls.tsx`
- [X] T014 [US1] Wire session service to start sessions with scenario metadata, kickoff message autosave, offline queue flags, and per-scenario history enrichment in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/sessions.ts`
- [X] T015 [P] [US1] Implement backend `/scenarios` endpoints and scenario-aware session creation in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/api/mod.rs`
- [X] T016 [P] [US1] Seed backend scenario data (PM/PMO attendance/PMO governance) with evaluation criteria in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/models/mod.rs`
- [X] T017 [US1] Log lifecycle events (start/resume/evaluate/reset) with `scenarioId`/discipline to console in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/telemetry.ts`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Track context, decisions, and progress (Priority: P2)

**Goal**: Display project context, allow tagging of decisions/risks/assumptions/next actions, and show progress toward evaluation readiness.

**Independent Test**: Tag messages, see action log and progress tracker update, persist across refresh/resume (per scenario), and evaluate only after readiness flags are complete.

### Tests for User Story 2

- [ ] T018 [US2] Add Playwright e2e for tagging/progress persistence (offline → online) in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/tests/e2e/us2-tags.spec.ts`
- [ ] T019 [P] [US2] Add backend integration test for tagged messages and progress flag updates ordering in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/tests/message_tags.rs`

### Implementation for User Story 2

- [ ] T020 [US2] Expand context panel with JP scenario details, discipline-aware content, and offline/empty states in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/ContextPanel.tsx`
- [ ] T021 [P] [US2] Enhance progress tracker to gate evaluation (requirements/priorities/risks/acceptance) per scenario in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/ProgressTracker.tsx`
- [ ] T022 [P] [US2] Add tagging UI badges and action log timeline with timestamps persisted to storage/API in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/ActionLog.tsx`
- [ ] T023 [US2] Persist tags and progress flags with autosave/offline queue support in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/sessions.ts`
- [ ] T024 [P] [US2] Support tags/progress updates with server ordering in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/api/mod.rs`
- [ ] T025 [US2] Add ARIA/focus/keyboard shortcuts for composer/tagging controls in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/ChatComposer.tsx`

**Checkpoint**: User Stories 1 and 2 independently functional

---

## Phase 5: User Story 3 - Review, filter, and export history (Priority: P3)

**Goal**: Review past sessions, filter/search, open details, and export/share session data (per scenario).

**Independent Test**: Filter history, open detail with transcript/action log/evaluation, export Markdown/JSON (and share link if API-backed), with scenario metadata retained.

### Tests for User Story 3

- [ ] T026 [US3] Add Playwright e2e for history filters/detail/export per scenario in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/tests/e2e/us3-history.spec.ts`
- [ ] T027 [P] [US3] Add backend integration test for history list/detail/delete/export per contract in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/tests/history.rs`

### Implementation for User Story 3

- [ ] T028 [US3] Implement history list with filters (score/date/status/search) and scenario labels in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/app/history/page.tsx`
- [ ] T029 [P] [US3] Implement history detail view with transcript/actions/evaluation and optional share link when API configured in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/HistoryDetail.tsx`
- [ ] T030 [P] [US3] Implement export service for Markdown/JSON (and share link for API mode) with scenario metadata in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/export.ts`
- [ ] T031 [US3] Implement backend history endpoints including delete/archive aligned to OpenAPI in `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/api/mod.rs`
- [ ] T032 [US3] Add data retention notice and clear storage controls integrated with history view in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components/DataRetentionNotice.tsx`

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T033 [P] Run accessibility and performance passes (WCAG AA, 4G load budgets) across `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/app` and `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/components`
- [ ] T034 [P] Extend telemetry for history/export/offline-queue events in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/telemetry.ts` and `/Users/taoshimomura/Desktop/dev/pm-journey/backend/src/middleware/telemetry.rs`
- [ ] T035 Update quickstart with scenario catalog usage, offline queue defaults, and HTTPS guidance in `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/quickstart.md`
- [ ] T036 Final refactor/cleanup and dependency audit in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/package.json` and `/Users/taoshimomura/Desktop/dev/pm-journey/backend/Cargo.toml`
- [X] T037 [P] Add Mastra/Gemini dependency and env config (`NEXT_PUBLIC_GEMINI_API_KEY`) in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/package.json` and `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/.env.example`
- [X] T038 [US1] Create scenario-aware Mastra agent config with per-scenario prompts in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/mastraAgent.ts`
- [X] T039 [P] [US1] Wire chat flow to Mastra agent responses (fallback offline/local echo) in `/Users/taoshimomura/Desktop/dev/pm-journey/frontend/src/services/sessions.ts`
- [X] T040 [US1] Document Gemini key setup and prompt overrides in `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup (Phase 1): none
- Foundational (Phase 2): depends on Phase 1
- User Stories (Phases 3–5): depend on Phase 2; can run in parallel after foundation
- Polish (Phase 6): depends on Phases 3–5 completion for chosen scope

### User Story Dependencies
- User Story 1 (P1): independent after foundation (MVP)
- User Story 2 (P2): independent after foundation; reuses session state/types from US1
- User Story 3 (P3): independent after foundation; consumes history saved by US1/US2

### Within Each User Story
- Tests before implementation
- Models/types before services
- Services before pages/components consuming them
- Exports/share after data available

### Parallel Opportunities
- Marked [P] tasks across frontend/backend and within stories can be executed concurrently (different files, no shared state)
- After foundation, different stories can proceed in parallel by separate contributors
- Within a story, models/services and backend/frontend slices marked [P] can be tackled in parallel once dependencies are satisfied

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Deliver Phase 3 (US1) and validate via e2e/integration tests
3. Demo MVP (scenario selection → per-scenario start/resume/chat/evaluate)

### Incremental Delivery
1. Add Phase 4 (US2) for tagging/context/progress → demo
2. Add Phase 5 (US3) for history/filter/export → demo
3. Apply Phase 6 polish and audits

### Parallel Team Strategy
1. Team finishes Setup + Foundational together
2. Parallelize US1/US2/US3 across contributors once foundation is done

---
