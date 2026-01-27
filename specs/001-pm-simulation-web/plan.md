# Implementation Plan: Home Scenario Catalog Reorg

**Branch**: `001-home-scenario-update` | **Date**: 2026-01-27 | **Spec**: `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/spec.md`
**Input**: Feature specification from `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/spec.md`

## Summary

Rework the Home scenario catalog to display two large categories (「PMアシスタント」/「PM」) with subcategories and multiple scenarios per subcategory. Keep the existing scenario engine and discipline logic (BASIC/CHALLENGE) intact, while introducing a new catalog structure that maps scenario IDs into the new category tree for Home and for cloning flows.

## Technical Context

**Language/Version**: TypeScript (Next.js 16.1, React 19) + Rust 1.75 (Axum 0.7)  
**Primary Dependencies**: Next.js app router, Tailwind CSS 4, TanStack Query 5, zod (frontend), Axum + utoipa (backend, optional)  
**Storage**: localStorage/IndexedDB by default; optional REST API for multi-device sync  
**Testing**: Vitest + Testing Library + Playwright (frontend); cargo test (backend)  
**Target Platform**: Web (Next.js app), optional Rust API  
**Project Type**: web application (frontend + backend)  
**Performance Goals**: Home load <3s on 4G; evaluation feedback <10s (spec targets)  
**Constraints**: offline-first UX, bilingual JP-first content, no Slack/command artifacts  
**Scale/Scope**: small-to-medium scenario catalog (dozens of items) stored locally with optional API sync

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Offline-first default: client-side persistence (localStorage/IndexedDB), offline queue, evaluation disabled until online, autosave after each message/evaluation.
- Independent, testable user stories: keep journeys prioritized and self-contained; each plan deliverable/test maps to a single story.
- Evaluation integrity & tagging: include progress flags, decision/risk/assumption/next-action tagging, history/export coverage, and reset/clear safety.
- Accessibility/responsiveness/bilingual: WCAG AA focus/ARIA/contrast, responsive (desktop two-column, stacked mobile), Japanese scenario content with bilingual UI, no Slack/command artifacts.
- Contract-driven & observable: OpenAPI/utoipa updated before backend changes land; logging hooks for session lifecycle/evaluation/exports; tests (Playwright/Vitest/cargo) required for touched surfaces; performance targets (load <3s on 4G, evaluation <10s) and HTTPS when API is enabled.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-pm-simulation-web/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (not created in this run)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/
│   ├── db/
│   ├── middleware/
│   ├── models/
│   ├── error.rs
│   ├── lib.rs
│   └── main.rs
└── tests/

frontend/
├── app/
├── src/
│   ├── components/
│   ├── config/
│   ├── services/
│   └── types/
└── tests/
```

**Structure Decision**: Web application with split frontend/backend at `/Users/taoshimomura/Desktop/dev/pm-journey/frontend` and `/Users/taoshimomura/Desktop/dev/pm-journey/backend`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

None.

## Phase 0: Research

- Output: `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/research.md`
- Resolved: Home catalog taxonomy, PM subcategory definitions, multi-scenario requirement, and catalog/API boundaries.

## Phase 1: Design & Contracts

- Data model: `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/data-model.md`
- API contract: `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/contracts/openapi.yaml`
- Quickstart: `/Users/taoshimomura/Desktop/dev/pm-journey/specs/001-pm-simulation-web/quickstart.md`
- Agent context update: run `/Users/taoshimomura/Desktop/dev/pm-journey/.specify/scripts/bash/update-agent-context.sh codex`

## Constitution Check (Post-Design)

- Offline-first defaults preserved; catalog remains local by default with optional API contract.
- User stories remain independent; Home catalog change is self-contained.
- Evaluation/tagging/history unaffected by catalog restructure.
- Accessibility/responsiveness unchanged; UI grouping is visual only.
- Contract updated to reflect catalog shape for API-backed mode.

**Gate Status**: PASS
