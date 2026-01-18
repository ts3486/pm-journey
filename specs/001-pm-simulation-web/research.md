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
