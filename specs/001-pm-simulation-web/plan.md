# Implementation Plan: Olivia PM Simulation Web Experience

**Branch**: `001-pm-simulation-web` | **Date**: 2026-01-18 | **Spec**: specs/001-pm-simulation-web/spec.md
**Input**: Feature specification from `/specs/001-pm-simulation-web/spec.md`

**Note**: This plan captures Phase 0–1 outputs for the PM simulation web app (Next.js/Tailwind/TanStack frontend; optional Rust/Axum/utoipa API).

## Summary

Deliver a web-based PM simulation (Home, Scenario, History) that replaces Slack flows, runs chat with AI “鈴木,” tracks decisions/progress, and produces evaluations for the attendance-app scenario. Frontend: Next.js + Tailwind + TanStack Query with client-side persistence (localStorage/IndexedDB) and autosave per message; optional Axum API with utoipa OpenAPI for multi-device sync, server-ordered message merge, and HTTPS-only remote mode.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (Next.js 14+), Rust 1.75+ (Axum)  
**Primary Dependencies**: Next.js (app router), Tailwind CSS, TanStack Query; Axum + utoipa for API contracts; client persistence via localStorage/IndexedDB  
**Storage**: Client-side localStorage/IndexedDB by default; optional REST persistence behind Axum (HTTPS)  
**Testing**: Frontend: Vitest + Testing Library + Playwright for e2e; Backend: cargo test + integration tests via reqwest/schemas  
**Target Platform**: Web (desktop/mobile), Node 18+ for SSR/build; Linux server for Axum API  
**Project Type**: Web application (frontend + optional backend service)  
**Performance Goals**: Initial load <3s on 4G; eval response <10s when available; responsive UI under offline/lock states  
**Constraints**: Offline-capable messaging queue; accessibility WCAG AA; HTTPS required for remote API; autosave every message + on eval/manual save  
**Scale/Scope**: Single-user sessions with local persistence; light API load (interactive chat + evaluation) suitable for small internal pilot

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file is placeholder (no active principles recorded). No blocking gates detected; proceed. Revisit once governance is defined.

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
```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: Web application split: `frontend/` (Next.js app router with components/pages/services/tests) and `backend/` (Axum service with models/services/api/tests). Add shared contracts under `specs/001-pm-simulation-web/contracts/` for OpenAPI artifacts referenced by both.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
