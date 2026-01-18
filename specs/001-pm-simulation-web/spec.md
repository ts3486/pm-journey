# Feature Specification: Olivia PM Simulation Web Experience

**Feature Branch**: `001-pm-simulation-web`  
**Created**: 2026-01-18  
**Status**: Draft  
**Input**: User description: "Read the spec below. Use the latest next.js/taliwind/tanstack and rust/axum and utoipa for server side. Olivia PM Simulation — Web Experience Specification for a web-based PM training scenario replacing an internal attendance system."

## Clarifications

### Session 2026-01-18

- Q: How frequently should session state be persisted to avoid loss when resuming or on failure? → A: Autosave after each user/agent message and on evaluation/manual save.
- Q: For API-backed multi-device use, how should session conflicts be handled when multiple clients act on the same session? → A: Server-ordered message merge; progress flags/evaluation use latest timestamp without locking.

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Run PM simulation session end-to-end (Priority: P1)

The PM learner starts a new or resumed session, chats with the AI engineer/designer “鈴木,” and drives the attendance-app requirements to the point of evaluation without needing Slack.

**Why this priority**: Core learning value depends on completing a full PM simulation loop in the web experience.

**Independent Test**: Start or resume a session, exchange messages, mark ready for evaluation, receive scores and advice, and see the session saved to history.

**Acceptance Scenarios**:

1. **Given** the user is on Home with no active session, **When** they click `Start simulation`, **Then** a new session is created and the Scenario page shows the kickoff prompt and composer ready to use.
2. **Given** an active session is saved locally, **When** the user clicks `Resume last session`, **Then** the prior transcript, context, and progress flags load and the composer allows continued messaging.
3. **Given** the user has progressed the session, **When** they choose `Mark ready for evaluation` and confirm, **Then** the system runs evaluation and shows overall and per-category scores with pass/fail status and advice.

---

### User Story 2 - Track context, decisions, and progress (Priority: P2)

The PM learner views project context, tags key messages as decisions/risks/assumptions/next actions, and sees progress toward requirements completeness.

**Why this priority**: Logging decisions and progress builds PM discipline and makes the evaluation meaningful.

**Independent Test**: From an active session, tag messages, view updated action log and progress tracker, and confirm the tags persist across refresh and resume.

**Acceptance Scenarios**:

1. **Given** the user is on the Scenario page, **When** they tag a message as a decision or risk, **Then** the tag appears inline and in the side log with timestamp and is persisted to the current session.
2. **Given** progress flags exist for requirements/priorities/risks/acceptance, **When** the user marks an item complete, **Then** the tracker updates and indicates whether evaluation is available.

---

### User Story 3 - Review, filter, and export history (Priority: P3)

The PM learner or reviewer opens History to review past sessions, filter/sort by score or date, drill into a session, and export it.

**Why this priority**: Reflection and coaching require accessible transcripts, actions, and evaluation results after a session ends.

**Independent Test**: Access History, apply filters, open a session detail with transcript/action log/evaluation, and download the session as Markdown or JSON (or copy a shareable link if API-backed).

**Acceptance Scenarios**:

1. **Given** multiple sessions with scores and statuses, **When** the user filters by completion status and score range, **Then** the list updates to only the matching sessions and shows their scores and category breakdowns.
2. **Given** a session is opened from History, **When** the user selects Export as Markdown/JSON, **Then** the downloaded file contains transcript, action log with tags, and evaluation summary.

### Edge Cases

- Offline mode: starting/resuming queues user messages locally, disables evaluation until back online, and shows an offline banner with retry.
- Evaluation failure: if scoring fails, show retry with preserved context; flag the session as “evaluation pending” in History until success.
- Storage limits: when local storage is near capacity, prompt the user to delete/archive older sessions while ensuring at least one can be saved.
- No active session: Scenario shows guidance to start a session; Resume CTA is disabled until a saved session exists.
- Session reset: clearing a session requires confirmation and optionally archives the transcript/evaluation before wiping active state.
- Mobile layout: context panel collapses below chat; sticky composer remains usable; avoid horizontal scrolling in tables/charts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Provide top-level navigation with Home, Scenario, and History links, a visible active-session indicator, and optional theme/language toggle.
- **FR-002**: Home must include a hero with product name/mission, scenario summary (attendance app modernization), and CTAs for `Start simulation` and `Resume last session` (disabled when no saved session).
- **FR-003**: Home must present “How it works” (roles, freeform flow, evaluation at end, estimated time), a scenario snapshot (goals to reduce 打刻漏れ and improve mobile usability), evaluation category preview, and a recent activity snippet showing last score/status with a link to History.
- **FR-004**: Scenario page must default to a two-column layout on desktop (chat + context) and stacked on mobile, supporting markdown messages, timestamps, copy-to-clipboard, and focus return to composer after send.
- **FR-005**: Provide a multiline composer with keyboard submit and send button plus quick prompts (e.g., share decisions, list risks) to accelerate interaction.
- **FR-006**: Offer session controls: start new session, resume existing session, reset/clear with confirmation, and `Mark ready for evaluation` that only activates when a session is in progress.
- **FR-007**: Context panel must show project info (title, summary, goals, audience, problems, differentiators, scope, constraints, timeline, success criteria) and PM guidance clarifying the engineer/designer role.
- **FR-008**: Implement a progress tracker showing requirements, priorities, risks, and acceptance readiness; indicate when evaluation becomes available.
- **FR-009**: Allow users to tag messages as decision/assumption/risk/next action and auto-capture agent summaries; surface a mini action log with timestamps and sync tags into session history.
- **FR-010**: Evaluation trigger must run scoring with four equally weighted categories (方針提示とリード力, 計画と実行可能性, コラボレーションとフィードバック, リスク/前提管理と改善姿勢), show overall score, pass/fail at 70, per-category scores, and improvement advice; labels use Japanese names with tooltips.
- **FR-011**: Support explicit states: loading (initializing scenario engine), offline (queue messages, disable evaluation), error (model/API failure with retry), empty (no messages yet), locked (evaluation running), and show banners/controls appropriate to each.
- **FR-012**: Default persistence uses client-side storage (localStorage/IndexedDB) for session transcript, action log, progress flags, and evaluation; autosave runs after each user/agent message and on evaluation/manual save; storage layer must be swappable for REST API use without Slack artifacts.
- **FR-013**: History list must show session date/time, duration, scenario title, final score, category breakdown (sparkline/bar), and status; provide filters (score range, date range, completion status) and keyword search across actions/decisions.
- **FR-014**: History detail must include full transcript, tagged actions, evaluation summary, and export controls for Markdown/JSON; if API is configured, offer a shareable link toggle while clarifying local vs. remote scope.
- **FR-015**: Provide data retention guidance and controls for clearing local data; allow optional archival before deletion when resetting sessions or clearing storage.
- **FR-016**: Enforce accessibility: keyboard navigable chat and controls, ARIA labels, WCAG AA contrast, focus order preserved after send, and mobile tap targets of at least 44px.
- **FR-017**: Meet performance/resilience goals: initial load under 3 seconds on 4G, lazy-load long history transcripts, show evaluation spinner with timeout fallback, and preserve queued user messages through transient failures.
- **FR-018**: Avoid Slack-specific terminology and replace command-style actions with UI controls (e.g., “Project info” button/panel and “Evaluate” button).
- **FR-019**: Maintain tone and language guidelines: scenario content primarily Japanese, with bilingual UI chrome where feasible; encourage supportive yet leadership-driven prompts.
- **FR-020**: Provide observability hooks to log session lifecycle events (start, resume, evaluation, reset) and evaluation outcomes for analytics via console or pluggable frontend logging.
- **FR-021**: For server-backed mode, expose REST endpoints (`POST /sessions`, `POST /sessions/{id}/messages`, `POST /sessions/{id}/evaluate`, `GET /sessions`, `GET /sessions/{id}`, `DELETE /sessions/{id}`), allow anonymous client-generated IDs, require HTTPS when remote storage is used, and handle concurrent clients by server-ordering messages while applying latest-timestamp wins for progress flags and evaluation without locking.

### Non-Functional Requirements

- **NFR-001**: Support offline-first behavior where messaging queues locally and evaluation is blocked until connectivity returns, with clear banners.
- **NFR-002**: Preserve privacy by clarifying local-only storage by default and requiring authentication before any multi-user deployment when an API is connected.
- **NFR-003**: Ensure mobile responsiveness with stackable layouts, sticky composer, and no horizontal scroll in tables/charts.
- **NFR-004**: Provide reliability messaging for evaluation failures, storage limits, and retries without losing user input.

### Assumptions & Constraints

- Default storage is client-side (localStorage/IndexedDB); a REST API can be wired for multi-device sync without changing UI flows.
- Anonymous use is expected for training; any production rollout will add authentication and remote persistence before multi-user access.
- Preferred implementation stack per request: modern web app with Next.js + Tailwind + TanStack on the client and Rust + Axum + utoipa on the server for API-backed mode.
- Slack-specific commands are out of scope; all actions are surfaced as web UI elements.

### Key Entities *(include if feature involves data)*

- **Scenario**: Contains `id`, `title`, `description`, `product` (name, summary, audience, problems, goals, differentiators, scope, constraints, timeline, successCriteria, uniqueEdge, techStack, coreFeatures), `mode` (freeform), `kickoffPrompt`, and `evaluationCriteria` (categories with 25% weights, passingScore 70).
- **Session**: Tracks `id`, `scenarioId`, `status` (active/completed/evaluated), `startedAt`, `endedAt`, `lastActivityAt`, optional `userName`, `progressFlags` (requirements/priorities/risks/acceptance booleans), and `evaluationRequested`.
- **Message**: Holds `id`, `sessionId`, `role` (`user` | `agent` | `system`), `content`, `createdAt`, optional `tags` (decision/assumption/risk/next_action/summary), and offline queue flag.
- **Evaluation**: Stores `sessionId`, `overallScore`, `passing` (bool), `categories` [{`name`, `weight`, `score`, `feedback`}], `summary`, and `improvementAdvice`.
- **History Item**: References `sessionId`, `metadata` (duration, messageCount), `actions` (tagged messages), `evaluation`, and storage location (local vs. API).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 90% of learners can start a new session from Home and see the kickoff prompt within 3 seconds on 4G.
- **SC-002**: 85% of active sessions that request evaluation return overall and per-category scores with pass/fail status within 10 seconds and save to History.
- **SC-003**: 90% of users can resume their last session with full transcript, action log, and progress restored within 10 seconds of loading Scenario.
- **SC-004**: 90% of History users can find a specific session via filter/search and export it (Markdown or JSON) within 2 minutes, with exported files containing transcript, tagged actions, and evaluation summary.
