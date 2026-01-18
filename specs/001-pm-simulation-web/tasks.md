# Tasks: Olivia PM Simulation Web Experience

**Input**: Design documents from `/specs/001-pm-simulation-web/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Include key e2e and integration tests per user story to validate flows.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create Next.js app router project with Tailwind baseline in `frontend/` (init `package.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`)
- [X] T002 [P] Install and configure TanStack Query provider and global context wrapper in `frontend/src/app/providers.tsx` and wire into `frontend/src/app/layout.tsx`
- [X] T003 Initialize Axum project with utoipa/serde/tokio dependencies in `backend/Cargo.toml` and bootstrap `backend/src/main.rs`
- [X] T004 [P] Add repository-level ignores, scripts, and workspace tooling for lint/test (`frontend/package.json` scripts, `frontend/.eslintrc`, `frontend/vitest.config.ts`, `frontend/playwright.config.ts`, `backend/.cargo/config.toml`)
- [X] T005 [P] Copy OpenAPI contract into build inputs and document generation step in `backend/src/api/mod.rs` and `backend/build.rs` referencing `specs/001-pm-simulation-web/contracts/openapi.yaml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Define shared domain types for Scenario/Session/Message/Evaluation in `frontend/src/types/session.ts`
- [X] T007 [P] Implement environment/config loader for API base, storage keys, and feature flags in `frontend/src/config/env.ts`
- [X] T008 [P] Scaffold client persistence layer with localStorage/IndexedDB adapters and autosave hooks in `frontend/src/services/storage.ts`
- [X] T009 [P] Create API client with offline-queue stubs and axios/fetch wrapper in `frontend/src/services/api.ts`
- [X] T010 Set up app shell with navigation, theme/language toggle placeholders, and session indicator in `frontend/src/components/NavBar.tsx` and `frontend/src/app/layout.tsx`
- [X] T011 Establish backend routing skeleton and error handling middleware in `backend/src/api/mod.rs` and `backend/src/error.rs`
- [X] T012 [P] Define backend domain models and serializers for Scenario/Session/Message/Evaluation in `backend/src/models/mod.rs`
- [X] T013 [P] Add logging/telemetry hooks and request tracing middleware in `backend/src/middleware/telemetry.rs`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Run PM simulation session end-to-end (Priority: P1) 🎯 MVP

**Goal**: Enable starting/resuming a session, chatting with the AI, and running evaluation without Slack.

**Independent Test**: Start or resume, exchange messages, trigger evaluation, and see scores/advice saved to history.

### Tests for User Story 1

- [X] T014 [US1] Add Playwright e2e for start → chat → evaluation flow in `frontend/tests/e2e/us1-session.spec.ts`
- [X] T015 [P] [US1] Add backend integration test for session lifecycle create/message/evaluate in `backend/tests/session_flow.rs`

### Implementation for User Story 1

- [X] T016 [US1] Build Home page hero/CTA/resume controls in `frontend/src/app/page.tsx` honoring saved-session availability
- [X] T017 [P] [US1] Implement session service for create/resume/reset with autosave per message/eval in `frontend/src/services/sessions.ts`
- [X] T018 [P] [US1] Create Scenario page layout (chat + context) with responsive columns in `frontend/src/app/scenario/page.tsx`
- [X] T019 [P] [US1] Implement chat stream with markdown, timestamps, copy action, and empty/loading/error/locked states in `frontend/src/components/ChatStream.tsx`
- [X] T020 [P] [US1] Implement composer with multiline input, keyboard submit, and quick prompts in `frontend/src/components/ChatComposer.tsx`
- [X] T021 [US1] Wire session controls (start/resume/reset/mark ready) and offline banners in `frontend/src/components/SessionControls.tsx`
- [X] T022 [US1] Implement evaluation trigger and results display with category breakdowns in `frontend/src/components/EvaluationPanel.tsx`
- [X] T023 [US1] Implement backend session/message/evaluate handlers with server-ordered merge and latest-timestamp flags in `backend/src/api/mod.rs`
- [X] T024 [US1] Persist evaluation and session history entry on completion in `frontend/src/services/history.ts`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Track context, decisions, and progress (Priority: P2)

**Goal**: Display project context, allow tagging of decisions/risks/assumptions/next actions, and show progress toward readiness.

**Independent Test**: Tag messages, see action log and progress tracker update, and persist across refresh/resume.

### Tests for User Story 2

- [X] T025 [US2] Add Playwright e2e for tagging and progress tracking persistence in `frontend/tests/e2e/us2-tags.spec.ts`
- [X] T026 [P] [US2] Add backend integration test for tagged messages and progress flags in `backend/tests/message_tags.rs`

### Implementation for User Story 2

- [X] T027 [US2] Build context panel (project info, goals, constraints, timeline, success criteria) in `frontend/src/components/ContextPanel.tsx`
- [X] T028 [P] [US2] Implement progress tracker for requirements/priorities/risks/acceptance with eval-available indicator in `frontend/src/components/ProgressTracker.tsx`
- [X] T029 [P] [US2] Add tagging UI and inline badges on messages plus mini action log in `frontend/src/components/ActionLog.tsx`
- [X] T030 [US2] Persist tags and progress flags to storage/API and reload on resume in `frontend/src/services/sessions.ts`
- [X] T031 [US2] Extend backend message/session models to accept tags and progress flag updates in `backend/src/api/mod.rs`

**Checkpoint**: User Stories 1 and 2 independently functional

---

## Phase 5: User Story 3 - Review, filter, and export history (Priority: P3)

**Goal**: Review past sessions, filter/search, open details, and export/share session data.

**Independent Test**: Filter history, open detail with transcript/actions/evaluation, export Markdown/JSON (and share link if API-backed).

### Tests for User Story 3

- [X] T032 [US3] Add Playwright e2e for history filter/detail/export in `frontend/tests/e2e/us3-history.spec.ts`
- [X] T033 [P] [US3] Add backend integration test for history list/detail/delete in `backend/tests/history.rs`

### Implementation for User Story 3

- [X] T034 [US3] Implement History list with filters (score/date/status) and search in `frontend/src/app/history/page.tsx`
- [X] T035 [P] [US3] Implement History detail view with transcript/action log/evaluation in `frontend/src/components/HistoryDetail.tsx`
- [X] T036 [P] [US3] Implement export/share (Markdown/JSON; link when API present) in `frontend/src/services/export.ts`
- [X] T037 [US3] Implement backend list/detail/delete endpoints per OpenAPI in `backend/src/api/mod.rs`

**Checkpoint**: All user stories independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T038 [P] Run accessibility and performance passes (WCAG AA, 4G load budget) updating `frontend/src/components/*` and `frontend/src/app/*` as needed
- [X] T039 Add telemetry/logging hooks for session lifecycle and evaluation outcomes in `frontend/src/services/telemetry.ts` and `backend/src/middleware/telemetry.rs`
- [X] T040 [P] Surface data retention/clear-storage controls and notices in `frontend/src/components/DataRetentionNotice.tsx`
- [X] T041 Update docs/quickstart with API/env instructions and known offline behaviors in `specs/001-pm-simulation-web/quickstart.md`
- [ ] T042 Final refactor/cleanup and dependency audit across `frontend/` and `backend/`

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

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1 (Setup) and Phase 2 (Foundational)
2. Deliver Phase 3 (US1) and validate via e2e/integration tests
3. Demo MVP (start/resume/chat/evaluate)

### Incremental Delivery
1. Add Phase 4 (US2) for tagging/context/progress → demo
2. Add Phase 5 (US3) for history/filter/export → demo
3. Apply Phase 6 polish and audits

### Parallel Team Strategy
1. Team finishes Setup + Foundational together
2. Parallelize US1/US2/US3 across contributors once foundation is done

---
