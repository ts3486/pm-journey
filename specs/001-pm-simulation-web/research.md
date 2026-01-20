# Research: Olivia PM Simulation Web Experience

## Decision Log

### Frontend stack (Next.js + Tailwind + TanStack Query)
- **Decision**: Use Next.js 14+ app router with Tailwind for styling and TanStack Query for client data and persistence hooks.
- **Rationale**: Matches requested stack; supports SPA-style routing with SSR/ISR options; TanStack Query simplifies cache/persistence/localStorage integration and offline queue patterns.
- **Alternatives considered**: Remix (strong routing/offline, not requested); Vite + React (lighter but loses Next app router conventions).

### Persistence and autosave cadence
- **Decision**: Autosave session state after each user/agent message and on evaluation/manual save to localStorage/IndexedDB.
- **Rationale**: Minimizes loss on refresh/offline; aligns with spec requirement for resume reliability; lightweight for single-user sessions.
- **Alternatives considered**: Timer-based saves (risks gaps), evaluation-only saves (higher loss risk).

### Conflict handling for API-backed multi-device use
- **Decision**: Server-ordered message merge; progress flags/evaluation use latest timestamp without locking.
- **Rationale**: Avoids user friction from locks while preserving timeline integrity; simple for light concurrency expected in training.
- **Alternatives considered**: Hard locks (block collaboration), last-write-wins without ordering (risks timeline disorder), reject on conflict (poor UX).

### Evaluation request behavior
- **Decision**: Evaluation callable only when session marked ready; show spinner with 10s target and retry on failure while preserving context.
- **Rationale**: Matches success criteria (<10s), keeps UX predictable; aligns with edge case handling for evaluation failures.
- **Alternatives considered**: Always-enabled evaluation (could be premature); background auto-eval (surprising to users).

### Testing approach
- **Decision**: Frontend: Vitest + Testing Library for components, Playwright for chat/History flows. Backend: cargo test + integration tests using reqwest against API contracts; contract tests derived from OpenAPI.
- **Rationale**: Aligns with chosen stacks; covers UI flows (chat, resume, eval, history filters) and API correctness.
- **Alternatives considered**: Cypress instead of Playwright (heavier parallel setup); pure unit tests (insufficient for flows).

### Scenario catalog and grouping (Home)
- **Decision**: Define a static scenario catalog in the frontend config with grouping by discipline (`PM` and `PMO`), each scenario carrying id/title/summary, target outcomes, and kickoff prompt; render Home as two distinct rows (PM scenarios, PMO scenarios).
- **Rationale**: Keeps initial load fast (<3s) without extra fetches, satisfies request for two-row layout, and ensures deterministic autosave/offline behavior since catalog is local.
- **Alternatives considered**: Fetch scenarios from API (adds latency and API dependency), single flat list (harder to scan PM vs PMO focus).

### Session start from scenario selection
- **Decision**: Start a fresh session when a scenario card is clicked by passing `scenarioId` to the Scenario route (search params) and invoking `startSession(scenarioId)`; resume CTA continues to load last saved session regardless of catalog selection.
- **Rationale**: Guarantees a new session per chosen scenario while preserving resume semantics; keeps behavior consistent offline and API-backed.
- **Alternatives considered**: Starting session on Home then redirecting with state (requires client state lifting); storing selection in global context (adds coupling, harder to persist).

### Observability for lifecycle events
- **Decision**: Log lifecycle events (start/resume/reset/evaluate) with scenarioId and storage location to the console by default, keeping the hook pluggable for API telemetry.
- **Rationale**: Meets constitution observability without backend dependency; aids debugging of offline/queue behaviors during development.
- **Alternatives considered**: No-op logging (less traceability), external analytics SDK (unneeded for current scope).

### Missions definition and tracking
- **Decision**: Define missions per scenario in the frontend catalog (static JSON/TS config) and track completion in session state (local storage/API snapshot) with timestamped statuses.
- **Rationale**: Matches offline-first, keeps Home→Scenario fast, and aligns with wireframe showing fixed mission set per scenario.
- **Alternatives considered**: Fetch missions from API (adds dependency/latency), derive from messages (ambiguous and brittle).

### Evaluation trigger on mission completion
- **Decision**: Auto-attempt evaluation when all missions are marked complete and the client is online; if offline or evaluation fails, keep the manual “ready for evaluation” control as fallback with a retry banner.
- **Rationale**: Matches user flow (“完了通知→詳細画面→評価”) while preserving resilience/offline guardrails and FR-010 gating.
- **Alternatives considered**: Manual-only evaluation (misses flow expectation), background eval without user notice (opaque and riskier).

### Manager comment attribution
- **Decision**: Allow 上長コメント with optional manager name field (plain text) and timestamp; no auth in default local mode, with a note to require auth if API/multi-user is enabled.
- **Rationale**: Satisfies review need without blocking offline/local use; keeps path to authenticated API mode open.
- **Alternatives considered**: Enforce auth now (not feasible in anonymous/local default), anonymous-only comments (no attribution).

### Font strategy and build resilience
- **Decision**: Use system font stack with optional locally bundled JP font; avoid build-time remote font fetch to prevent Turbopack failures when offline.
- **Rationale**: Prior build errors came from Google font fetch; system stack ensures reliability and WCAG contrast remains controllable.
- **Alternatives considered**: Keep remote Google Fonts (fragile offline), drop JP-friendly fonts (hurts readability).
