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

### Scenario catalog and grouping (Home) — 2026-01-27 update
- **Decision**: Define a nested Home catalog with large categories 「PMアシスタント」「PM」, each containing subcategories and scenario summaries (id/title/description/discipline). Store the catalog in frontend config and map to scenario IDs; keep `Scenario.discipline` (BASIC/CHALLENGE) for agent profile selection and evaluation behavior.
- **Rationale**: Meets the new Home taxonomy while keeping the scenario engine unchanged, enabling fast offline-first rendering and stable resume/history keyed by scenarioId.
- **Alternatives considered**: Replace discipline with categories (breaks agent profile logic and API parity), fetch catalog from API (adds dependency/latency), flat list with tags (harder to scan).

### PM subcategory definitions & multi-scenario rule
- **Decision**: Use three PM subcategories: 「プロジェクト立て直し」「交渉・合意形成」「ステークホルダー調整」. Seed each with existing challenge scenarios plus at least one additional scenario sourced from `/Users/taoshimomura/Desktop/dev/pm-journey/scenarios.csv` to ensure each subcategory has 2+ scenarios. For 「PMアシスタント」 subcategories, extend each with at least one additional basic scenario (meeting facilitation, minutes, unknowns) to satisfy the same rule.
- **Rationale**: Aligns with existing scenario themes while meeting the “multiple scenarios per subcategory” requirement using already-curated scenario ideas.
- **Alternatives considered**: Cross-list one scenario into multiple subcategories (confusing duplication), placeholder “coming soon” cards (adds UX/state overhead).

### Proposed Home catalog mapping (draft)
- **Decision**: Use the following initial mapping; mark new scenarios as NEW and back them with new Scenario entries (ids TBD but stable).
- **Rationale**: Ensures 2+ scenarios per subcategory while reusing existing content and CSV ideas.
- **Alternatives considered**: Only existing scenarios (fails multi-scenario rule), a tag-based filter UI (larger UI change).

**PMアシスタント**
- 基礎スキル・知識: 自己紹介＆期待値合わせ (既存), アジェンダを設定してミーティングを進行 (NEW), 議事メモの作成と共有 (NEW)
- テスト設計: テストケース作成 (既存), テスト観点の洗い出しと優先度付け (NEW)
- チケット要件整理: チケット要件整理 (既存), 不明点の洗い出し (NEW)

**PM**
- プロジェクト立て直し: 遅延プロジェクト立て直し (既存), リリース期限の突然の前倒し (NEW)
- 交渉・合意形成: スコープ／リソース交渉 (既存), エンジニアから「無理です」と言われる (NEW)
- ステークホルダー調整: コンフリクト調整 (既存), ステークホルダーとの認識ズレ解消 (NEW)

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
