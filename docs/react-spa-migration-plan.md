# React SPA Migration Plan

_Last updated: 2026-02-06_

## Implementation Progress (2026-02-06)

- pnpm workspace scaffolded with `apps/next-legacy` (current product) and `apps/app` (new SPA shell).
- Shared packages initialized (`@pm-journey/types`, `@pm-journey/ui`, `@pm-journey/hooks`) with the legacy app already consuming the extracted type definitions and UI card component.
- React SPA bootstrapped with Vite + React Router + TanStack Query, ready to receive migrated routes.

## Current App Snapshot

- **Architecture:** Next.js 16 App Router (`app/`), React 19, Tailwind CSS 4 utilities defined in `app/globals.css`, TanStack Query for data fetching (`src/queries/*`) and Zod validation for scenario authoring (`src/schemas/scenario.ts`).
- **Key Features**
  - **Home / Scenario Discovery:** `app/page.tsx` renders catalog data from `src/config/scenarios.ts`, persists progress via `src/services/storage.ts`, and drives CTA links into `/scenario`.
  - **Scenario Runtime:** `app/scenario/page.tsx` orchestrates chat (components in `src/components/ChatComposer.tsx`, `ChatStream.tsx`, `TestCaseScenarioLayout.tsx`), session lifecycle helpers in `src/services/sessions.ts`, and telemetry/logging in `src/services/telemetry.ts`.
  - **Scenario Builder:** `app/scenario/create/page.tsx` hosts `ScenarioCreateForm` which combines local reducer state, cloning (`ScenarioCloneSelector`), and backend persistence (`src/services/scenarioService.ts`).
  - **History & Evaluation:** `app/history/page.tsx` plus `[sessionId]/page.tsx` use TanStack Query hooks (`src/queries/history.ts`, `src/queries/evaluation.ts`, etc.) to show past sessions, scoring visualizations, outputs, comments, and test cases.
  - **Settings:** `app/settings/page.tsx` renders `ProductConfigForm` with async CRUD methods in `src/services/api.ts`.
- **Data Layer:** `src/services/api.ts` talks to the Axum backend, `src/services/mastraAgent.ts` handles Gemini agent prompts, and `storage.ts` keeps client pointers in localStorage.
- **Styling System:** Global utility classes (`btn-primary`, `card`, `badge`, etc.) live in `app/globals.css` and are referenced throughout components.

## Target Architecture

- **React SPA:** Vite + React Router (app routes) + TanStack Query + Tailwind CSS 4 (same tokens/utilities) compiled entirely on the client and deployed to Fly.io/CDN.
- **Shared Modules:** Move UI primitives, schema/types, and service clients into `/packages/*` so the legacy Next app can serve as a reference until parity is achieved.
- **Routing:** React Router handles `/`, `/scenario`, `/scenario/create`, `/history`, `/history/:sessionId`, `/settings`. Keep search params (`scenarioId`, `restart`) and query behaviors identical.
- **State/Data:** Continue using TanStack Query for server state, reimplement existing hooks with `react-query` v5 in the SPA, and wrap localStorage helpers (`storage.ts`) for persistence.
- **Testing:** Vitest + Testing Library for unit/component tests, Playwright (or Cypress) for parity regression once routes move over.

## Migration Phases

### Phase 0 – Baseline & Workspace Prep
1. **Snapshot Current App:** Tag the repository and export key UX flows (videos/screens) for home, scenario runtime, history detail, scenario builder, and settings.
2. **Introduce Workspace:** Convert `frontend/` into a pnpm workspace with `apps/next-legacy` (current Next app) and placeholders for the SPA plus shared packages. Keep the original Next app running until parity.
3. **Tooling Alignment:** Standardize ESLint/Vitest/Tailwind configs at the workspace root so both projects share rules and tokens.

### Phase 1 – SPA Scaffold & Shared Foundations
1. **Scaffold `apps/app`:** Use Vite + React + TypeScript + Tailwind 4 + TanStack Query. Replicate `Providers` (Theme, QueryClient) and global styles from `app/globals.css`.
2. **Shared Packages:** Create:
   - `packages/ui` for NavBar, buttons, card styles, ProgressTracker, Scenario form sections.
   - `packages/types` for `Session`, `Scenario`, `HistoryItem`, etc. (mirror `src/types/session.ts`).
   - `packages/hooks` for reusable hooks (`useHistoryList`, `useScenarioForm`, telemetry helpers).
3. **Env Handling:** Replicate `src/config/env.ts` semantics using Vite env (`import.meta.env.VITE_*`) and document required variables.

### Phase 2 – Data & Service Layer Migration
1. **API Client:** Port `src/services/api.ts` to a framework-agnostic module (e.g., `packages/services/api`) and ensure fetch polyfills exist for Vite.
2. **Session Utilities:** Move `src/services/sessions.ts`, `storage.ts`, `telemetry.ts`, and `mastraAgent.ts` into shared modules with minimal Next dependencies.
3. **Query Hooks:** Recreate hooks from `src/queries/*` inside the SPA, pointing to the shared service layer and keeping the same query keys to simplify cache hydration later.

### Phase 3 – Feature Porting
1. **Routing Shell & Layout:**
   - Implement `AppShell` with NavBar + main layout identical to `app/layout.tsx`.
   - Create route stubs in React Router for all paths; implement Suspense fallbacks similar to existing pages.
2. **Home / Scenario Discovery:**
   - Port `app/page.tsx` logic into `routes/Home.tsx`, including carousel interactions, `storage.ts` calls, and scenario catalog config.
   - Move static data from `src/config/scenarios.ts` into a shared module.
3. **Scenario Runtime:**
   - Rebuild `/scenario` route with `ChatStream`, `ChatComposer`, `TestCaseScenarioLayout` from `src/components`.
   - Ensure search params (`scenarioId`, `restart`) map via React Router loaders or `useSearchParams`.
   - Keep optimistic updates, mission toggles, and telemetry logging intact.
4. **Scenario Builder:**
   - Port `ScenarioCreateForm`, `ScenarioCloneSelector`, and shared form components into the SPA.
   - Keep reducer + validation logic (Zod schemas) unchanged; confirm navigation replacements for `useRouter`.
5. **History & Evaluations:**
   - Move list/detail pages, including scoring visualizations, outputs, comments, and test case sections.
   - Recreate `ScoreRing`, `CategoryCard`, and other subcomponents in shared UI.
6. **Settings:**
   - Port `ProductConfigForm`, ensuring suspense/loading states and API interactions match.

### Phase 4 – UX, Styling, and State Parity
1. **Global Styles:** Reuse existing CSS tokens/classes; if necessary, convert `globals.css` definitions into Tailwind layer utilities to avoid regression.
2. **Accessibility & i18n:** Preserve language (`lang="ja"`) and copy; ensure React Router routes honor browser history/back navigation.
3. **Performance:** Compare bundle sizes, ensure TanStack Query caching/stale times mirror current behavior, and reintroduce localStorage caching for resumes.

### Phase 5 – Testing, Verification & Cutover
1. **Unit/Component Tests:** Port pertinent Vitest suites; create new tests for React Router guards and mission toggles.
2. **E2E:** Record Playwright tests covering scenario start, message exchange, evaluation view, scenario creation, and settings update.
3. **Dogfood Environment:** Host the SPA behind a `/spa` path or feature flag; run dual QA for one sprint to confirm parity.
4. **Cutover:** Update deployment scripts (`fly.toml`, CI) to build the SPA; archive the Next app (keep only if needed for future SSR work). Update docs and onboarding.

## Risks & Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Feature divergence during long migration | Users see inconsistent behavior between stacks | Move features in vertical slices, write parity tests per route, keep shared packages canonical |
| Tailwind utility regressions | Visual drift from current design | Extract `globals.css` tokens into shared CSS/tokens module reused by SPA |
| LocalStorage/session pointers break | Users lose progress/resume ability | Keep `storage.ts` API identical; add migration script for storage keys |
| API rate limits (Gemini) while testing both apps | Blocks QA | Add env toggles to stub agent responses locally; document backend rate considerations |

## Deliverables & Success Criteria

1. `apps/app` React SPA running all existing product routes with no critical regressions.
2. Shared packages for UI/types/hooks/services adopted by both the SPA and (temporarily) the legacy Next app.
3. Test suite (unit + e2e) covering home, scenario runtime, history detail, scenario builder, and settings.
4. Updated developer docs (README, deployment steps) describing how to run the SPA and deprecate the Next app once cutover is complete.
