# Quickstart: Olivia PM Simulation Web Experience

## Prereqs
- Node 18+; pnpm/npm/yarn
- Rust 1.75+; cargo
- HTTPS-capable environment if enabling API

## Frontend (Next.js + Tailwind + TanStack)
1) `cd frontend`
2) Install deps: `pnpm install` (or npm/yarn)
3) Run dev server: `pnpm dev`
4) Key env (examples):
   - `NEXT_PUBLIC_API_BASE` (empty for local-only storage; set to Axum host for API mode)
   - `NEXT_PUBLIC_OFFLINE_QUEUE=true` to enable queued sends when offline
   - `NEXT_PUBLIC_STORAGE_PREFIX=olivia_pm` to isolate local storage keys
5) Tests: `pnpm test` (Vitest), `pnpm exec playwright test` for e2e chat/history flows.

## Backend (Axum + utoipa) - optional API mode
1) `cd backend`
2) Run dev: `cargo run`
3) Tests: `cargo test` (unit/integration)
4) Expose OpenAPI from `specs/001-pm-simulation-web/contracts/openapi.yaml`; serve via utoipa.
5) Environment: set `RUST_LOG=info`, bind host/port in `src/main.rs` as needed.

## Flows to validate
- Start session from Home → Scenario kickoff visible <3s on 4G.
- Resume saved session → transcript/actions/progress restored.
- Tag decisions/risks → action log updates; autosave after each message.
- Mark ready for evaluation → spinner, result within ~10s, history entry saved.
- History filters/search → export Markdown/JSON; optional share link if API enabled.
- Offline/local mode: keep `NEXT_PUBLIC_API_BASE` empty; data stays in localStorage/IndexedDB and can be cleared via data retention notice.
