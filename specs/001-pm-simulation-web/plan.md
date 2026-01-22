# Implementation Plan: Olivia PM Simulation Web Experience

**Branch**: `001-scenario-renewal` | **Date**: 2026-01-20 | **Spec**: `/specs/001-pm-simulation-web/spec.md`
**Input**: Feature specification from `/specs/001-pm-simulation-web/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command (automation will replace placeholders).

## Summary

Deliver a web-based PM/PMO simulation where learners pick scenarios from a two-row Home (PM/PMO), jump into Scenario with per-scenario prompts preloaded, chat with the AI partner “鈴木,” complete missions with supplemental info, and on completion get auto-notified and routed to a detail view with AI evaluation and manager comments. Stack: Next.js 16 (app router) + Tailwind 4 + TanStack Query for an offline-first client (localStorage/IndexedDB) with optional Axum/utoipa REST API for sync. Evaluation, tagging, history/export, and bilingual WCAG-compliant UX are required; Mastra + Gemini provides chat when a key is present, with observability across lifecycle events.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Next.js 16.1, React 19, Tailwind CSS 4) + Rust 1.75+ (Axum 0.7)  
**Primary Dependencies**: Next.js app router, Tailwind CSS 4, TanStack Query 5, Axios/fetch clients, Mastra agents + Gemini LLM, Vitest/Testing Library/Playwright, Axum + utoipa, tokio, tracing  
**Storage**: Client-side localStorage/IndexedDB by default; optional Axum REST API with HTTPS for multi-device sync  
**Testing**: Frontend Vitest + Testing Library + Playwright e2e; backend `cargo test`/`cargo clippy`  
**Target Platform**: Web (desktop + mobile) via Next.js app router; optional Axum API service  
**Project Type**: Web application with separate frontend (Next.js) and backend (Axum) workspaces  
**Performance Goals**: Initial Home/Scenario load <3s on 4G; evaluation responses <10s; lazy-load long history; keep UI responsive on mobile with sticky composer  
**Constraints**: Offline-first with queued sends and autosave after each message/evaluation; WCAG AA + bilingual JP-first content; avoid Slack/command artifacts; HTTPS required when API enabled; evaluation gated until session ready  
**Scale/Scope**: Single-learner local mode with multiple saved sessions (per-scenario parallel allowed) and history; optional multi-device API sync with server-ordered merge and latest-timestamp wins  
**Unknowns to Clarify (Phase 0)**:
- Missions: source of mission definitions and completion tracking (scenario config vs API) — RESOLVED in research (scenario config + session state).
- Evaluation trigger: auto-run upon mission completion vs manual “ready for evaluation” — RESOLVED in research (auto-attempt + manual fallback).
- Manager comments: authentication/attribution approach for 上長コメント — RESOLVED in research (optional name, no auth in local mode).
- Font strategy: allow remote Google font vs bundle/local fallback to avoid build-time fetch failures — RESOLVED in research (system stack/local bundle, avoid remote fetch).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: Offline-first default with localStorage/IndexedDB, queued sends, autosave after each message/evaluation, evaluation blocked when offline.
- PASS: Independent, testable journeys remain P1-P3 slices (Home start/resume, Scenario tagging/progress/evaluation, History review/export); plan artifacts map to these.
- PASS: Evaluation integrity + tagging maintained (progress flags, decisions/risks/assumptions/next actions, reset/clear confirmations, history/export coverage).
- PASS: Accessibility/responsiveness/bilingual upheld (WCAG AA focus/ARIA/contrast, desktop two-column/stacked mobile, JP-first scenario content, no Slack commands).
- PASS: Contract-driven & observable approach (OpenAPI/utoipa updates before backend merge, structured lifecycle logs, Playwright/Vitest/cargo coverage, load <3s/eval <10s, HTTPS for API).

**Post-Design Check**: Scenario catalog (PM/PMO) and session-start flow remain offline-first, testable per story slices, and keep accessibility/contract/logging requirements intact. No new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── src/
│   ├── api/
│   ├── middleware/
│   ├── models/
│   ├── error.rs
│   ├── lib.rs
│   └── main.rs

frontend/
├── app/               # Next.js app router routes (home/history/scenario)
├── src/
│   ├── components/
│   ├── config/
│   ├── services/
│   └── types/
├── public/
└── tests/             # e2e + unit helpers

specs/
└── 001-pm-simulation-web/  # plan/research/data-model/contracts/quickstart
```

**Structure Decision**: Web application with separate frontend (Next.js app router) and backend (Axum) workspaces plus spec artifacts under `specs/001-pm-simulation-web/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
