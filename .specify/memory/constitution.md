<!--
Sync Impact Report
- Version: template -> 1.0.0
- Modified principles: PRINCIPLE_1_NAME -> User Stories Are Independent, Testable Slices; PRINCIPLE_2_NAME -> Offline-First With Upgradeable API Path; PRINCIPLE_3_NAME -> Evaluation Integrity and Session Safety; PRINCIPLE_4_NAME -> Accessible, Responsive, Bilingual Experience; PRINCIPLE_5_NAME -> Contract-Driven Delivery With Observability and Tests
- Added sections: Architecture & Stack Guardrails; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates: ✅ .specify/templates/plan-template.md; ✅ .specify/templates/spec-template.md; ✅ .specify/templates/tasks-template.md; ⚠ .specify/templates/commands/ (directory not present; add alignment notes if introduced)
- Follow-up TODOs: none
-->

# pm-journey Constitution

## Core Principles

### User Stories Are Independent, Testable Slices
Work is organized by prioritized user journeys so each slice (Home, Scenario, History) can ship and be demoed alone. Plans, specs, tasks, and tests map to a single story with explicit acceptance. Avoid cross-story coupling that blocks independent delivery; land the P1 journey before expanding P2/P3. This keeps value incremental and reduces regression risk.

### Offline-First With Upgradeable API Path
Default persistence is client-side (localStorage/IndexedDB) with autosave after every user/agent message and evaluation. The UI must operate offline with queued sends and disabled evaluation until connectivity returns. API mode is optional, HTTPS-only, and must preserve server-ordered message merge with latest-timestamp wins for progress flags. No feature may require a backend when local mode suffices; remove Slack/command artifacts.

### Evaluation Integrity and Session Safety
Evaluation runs only when the session is ready (progress flags captured); autosave is mandatory after each message and evaluation. Decisions/risks/assumptions/next actions are tagged inline and persisted. Resets and data clears require confirmation and optional export/archive. History entries include transcript, action log, and evaluation to make grading reproducible.

### Accessible, Responsive, Bilingual Experience
UI honors WCAG AA (focus order, ARIA labels, contrast, 44px targets) and stays responsive (desktop two-column, stacked mobile, sticky composer, no horizontal scroll). Initial load under 3 seconds on 4G; evaluation feedback within ~10 seconds. Scenario content is primarily Japanese with bilingual UI/tooltips; avoid Slack terminology. Explicit states (loading/offline/error/locked) are required.

### Contract-Driven Delivery With Observability and Tests
OpenAPI/utoipa contracts are the API source of truth; frontend/back must align before merge. Instrument session lifecycle, tagging, evaluation, and exports with structured logs (pluggable; console acceptable without backend). Every story includes Playwright e2e or backend integration coverage plus unit/contract tests as appropriate. Merges require green tests and documented observability hooks.

## Architecture & Stack Guardrails
- Stack: Next.js 14+ (app router) with Tailwind CSS and TanStack Query; Rust 1.75+ Axum with utoipa for API.
- Persistence: default localStorage/IndexedDB; optional REST API for multi-device; enforce server-order message merge and latest-timestamp progress flags; HTTPS required when remote.
- Performance & resilience: initial load <3s on 4G; evaluation results <10s; offline queue preserves messages and disables evaluation until online; lazy-load long transcripts/history.
- Accessibility & UX: WCAG AA compliance, responsive layouts, sticky composer on mobile, and no horizontal scroll in tables/charts.
- Language & tone: scenario content in Japanese; UI chrome/tooltips bilingual where feasible; remove Slack/command-style artifacts.
- Data handling: autosave after each message/evaluation; provide retention guidance and clear controls to export/archive/clear local data; API mode must document authentication/limits before multi-user rollout.
- Observability: log session lifecycle (start/resume/reset/evaluate), progress updates, and exports; keep logging pluggable across frontend/backend with console fallback.

## Development Workflow & Quality Gates
- Constitution Check: before planning/design and before merge, confirm offline-first defaults, optional API behind HTTPS with ordering, independent/testable user stories, evaluation safety (autosave plus tagged actions/progress), WCAG AA + responsive JP-first content, and contract/test coverage with lifecycle logging.
- Specs/Plans: user stories must be prioritized and independently testable; requirements must call out offline states, evaluation flow, tagging, history/export, and API optionality; include stack/performance guardrails in technical context.
- Tasks: group by user story; include explicit tasks for observability hooks, accessibility/responsiveness, offline queue/autosave, and contract updates; note required Playwright/Vitest/cargo tests per story.
- Reviews: no merge without updated OpenAPI when backend changes and aligned frontend client; reject Slack terminology; run `pnpm test`, `pnpm exec playwright test` (when affected), and `cargo test`; document deviations with rationale and follow-up task IDs.
- Releases/Deploys: ship data retention notice, environment variables for storage/API prefixes, and confirm HTTPS enforcement when API is enabled.

## Governance
Authority: This constitution supersedes other workflow docs for pm-journey; conflicts must be resolved by updating this document.  
Amendment process: propose changes via PR referencing affected sections/principles; include migration/retrofit steps for in-flight work and update templates (plan/spec/tasks) accordingly; approval requires at least one reviewer confirming compliance impact.  
Versioning: semantic versioning; MAJOR for removing/overhauling principles or governance, MINOR for new or expanded principles/guardrails, PATCH for clarifications/typos; update Last Amended date when changes merge.  
Compliance review: each feature plan and PR must document Constitution Check outcomes; schedule milestone audits to ensure offline-first defaults, autosave/evaluation safety, accessibility, contract/test coverage, and observability remain intact.

**Version**: 1.0.0 | **Ratified**: 2026-01-18 | **Last Amended**: 2026-01-18
