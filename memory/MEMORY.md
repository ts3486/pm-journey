# pm-journey Project Memory

## Architecture
- **Frontend**: Vite + React 19 + React Router v6 SPA (NOT Next.js despite CLAUDE.md saying so)
- **Backend**: Rust/Axum at `localhost:3001`
- **Auth**: Auth0 (`@auth0/auth0-react` v2) - ALL routes require authentication
- **State**: TanStack Query v5, localStorage/IndexedDB for storage
- **Styling**: Tailwind CSS 4 with `reveal` animation class (starts at opacity 0)

## Key Files
- `frontend/src/routes/index.tsx` - React Router v6 route config
- `frontend/src/layouts/AppLayout.tsx` - Auth wrapper (AuthGuard)
- `frontend/src/components/AuthGuard.tsx` - Redirects to Auth0 if not authenticated
- `frontend/src/config/env.ts` - Env config (VITE_ prefixed vars)
- `frontend/src/lib/apiClient.ts` - API client (base: `localhost:3001` in dev)

## E2E Testing Setup (Playwright)
- **Config**: `frontend/playwright.config.ts`
- **Tests**: `frontend/e2e/` directory
- **Run**: `pnpm e2e` (from frontend dir)
- **Auth0 Mock Strategy**: Route interception (`page.route()`) for all `https://test.auth0.local/**` endpoints using RS256 JWT signing with Node.js crypto
- **Key Pattern**: Fixture pre-authenticates at `/` and waits for `header nav` before each test; CSS animations disabled via `reducedMotion: reduce`
- **API Mock**: All `localhost:3001` endpoints mocked in fixtures

## Playwright Auth Mock Notes
- `checkSession()` uses silent iframe auth (`prompt=none&response_mode=web_message`)
- The iframe postMessage approach works, but loginWithRedirect also occurs if iframe fails
- Pre-authenticating in the fixture prevents mid-test auth redirects from disrupting tests
- Nonce from authorize request captured in closure, used to sign the JWT

## Testing Patterns
- Unit: Vitest + Testing Library (jsdom) - `pnpm test`
- E2E: Playwright - `pnpm e2e` / `pnpm e2e:ui`
- `getByRole` with partial text matches both h1 and h2; use `{ exact: true }` when needed
