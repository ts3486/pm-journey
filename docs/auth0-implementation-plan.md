# Auth0 Authentication Implementation Plan

## Context

PM Journey currently has no authentication. All sessions, evaluations, and product configuration are shared/global. The goal is to add Auth0-based authentication so that:
- Each user has isolated sessions, history, and evaluations
- Each user has their own ProductConfig (project settings)
- Users can create custom scenarios (in addition to shared system scenarios)
- Auth0 Universal Login handles the login flow (redirect-based)

---

## Phase 1: Backend — Database Migrations

### 1.1 Create `users` table
**New file**: `backend/migrations/20260209000001_add_users_table.sql`

- `id TEXT PRIMARY KEY` — Auth0 `sub` claim (e.g. `auth0|abc123`)
- `email TEXT`, `name TEXT`, `picture TEXT`
- `created_at`, `updated_at` timestamps

### 1.2 Add `user_id` to existing tables
**New file**: `backend/migrations/20260209000002_add_user_id_columns.sql`

- `sessions`: Add `user_id TEXT REFERENCES users(id)` (nullable initially for backward compat), index on `user_id`
- `product_config`: Add `user_id TEXT REFERENCES users(id)`, drop singleton index `ON CONFLICT ((true))`, create `UNIQUE INDEX ON product_config(user_id)`
- `scenarios`: Add `user_id TEXT REFERENCES users(id)` (nullable = system/built-in scenario)

---

## Phase 2: Backend — JWT Auth Middleware

### 2.1 Add dependency
**Modify**: `backend/Cargo.toml` — add `jsonwebtoken = "9"`

### 2.2 Create auth extractor
**New file**: `backend/src/middleware/auth.rs`

- `AuthUser` struct with `user_id: String`, `email: Option<String>`, `name: Option<String>`
- Implement `FromRequestParts` for `AuthUser`:
  - Extract `Authorization: Bearer <token>` header
  - Validate JWT against cached JWKS (fetched from `https://{AUTH0_DOMAIN}/.well-known/jwks.json`)
  - Validate `iss`, `aud`, `exp` claims
  - Return `AuthUser` from token claims
- Register in `backend/src/middleware/mod.rs`

### 2.3 Cache JWKS in AppState
**Modify**: `backend/src/state.rs`

- Add JWKS keys field to `AppState`
- Fetch JWKS at startup in `main.rs` using `reqwest`

### 2.4 Environment variables
**Modify**: `backend/.env.example` — add `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`

---

## Phase 3: Backend — User Upsert Feature

**New files**:
- `backend/src/features/users/mod.rs`
- `backend/src/features/users/repository.rs` — `upsert(user_id, email, name, picture)`, `get(user_id)`
- `backend/src/features/users/services.rs`

**Modify**: `backend/src/features/mod.rs` — add `pub mod users` and `users()` method to `Services`

The `AuthUser` extractor calls `upsert` after JWT validation to ensure user exists in DB.

---

## Phase 4: Backend — Update All Handlers for User Scoping

Add `AuthUser` extractor parameter to all user-scoped handlers. Pass `user_id` through service → repository layers.

### 4.1 Sessions (`backend/src/features/sessions/`)
- `handlers.rs`: Add `auth: AuthUser` to all handlers
- `repository.rs`:
  - `create`: Add `user_id` to INSERT
  - `list`: Add `WHERE user_id = $1`
  - `get`, `delete`, `update`: Add `AND user_id = $2` for ownership check
- `services.rs`: Thread `user_id` through all methods

### 4.2 Messages (`backend/src/features/messages/`)
- `handlers.rs`: Add `auth: AuthUser`
- Verify session ownership before operating (session.user_id == auth.user_id)

### 4.3 Evaluations (`backend/src/features/evaluations/`)
- Same pattern: add `AuthUser`, verify session ownership

### 4.4 Comments (`backend/src/features/comments/`)
- Same pattern: add `AuthUser`, verify session ownership

### 4.5 Test cases (`backend/src/features/test_cases/`)
- Same pattern: add `AuthUser`, verify session ownership

### 4.6 Product config (`backend/src/features/product_config/`)
- `repository.rs`:
  - `get`: Change `LIMIT 1` → `WHERE user_id = $1`
  - `upsert`: Change `ON CONFLICT ((true))` → add `user_id` column to INSERT and use `ON CONFLICT (user_id)`
  - `delete`: Add `WHERE user_id = $1`
- `handlers.rs` / `services.rs`: Add `AuthUser`, pass `user_id`

### 4.7 Scenarios (`backend/src/features/scenarios/`)
- `list`: Return system scenarios (`user_id IS NULL`) + user's custom scenarios (`user_id = $1`)
- `create`: Set `user_id` on new scenarios

### 4.8 Health endpoint
- Keep **unauthenticated** (no `AuthUser`)

### 4.9 Session ownership helper
**New file**: `backend/src/shared/auth_helpers.rs`
- `verify_session_ownership(pool, session_id, user_id) -> Result<Session>` to avoid duplication

---

## Phase 5: Frontend — Auth0 SDK Integration

### 5.1 Install SDK
```bash
cd frontend && pnpm add @auth0/auth0-react
```

### 5.2 Add Auth0 env vars
**Modify**: `frontend/src/config/env.ts`
- Add `auth0Domain`, `auth0ClientId`, `auth0Audience` from `VITE_AUTH0_*` env vars

### 5.3 Wrap app with Auth0Provider
**Modify**: `frontend/src/main.tsx`
- Wrap `QueryClientProvider` + `RouterProvider` with `Auth0Provider`
- Configure `domain`, `clientId`, `authorizationParams` (redirect_uri, audience)

---

## Phase 6: Frontend — Protected Routes & Auth Guard

### 6.1 Create AuthGuard component
**New file**: `frontend/src/components/AuthGuard.tsx`
- Uses `useAuth0()` to check `isAuthenticated` / `isLoading`
- Shows loading spinner while loading
- Calls `loginWithRedirect()` if not authenticated

### 6.2 Wrap AppLayout
**Modify**: `frontend/src/layouts/AppLayout.tsx`
- Wrap content with `<AuthGuard>` so all routes are protected

---

## Phase 7: Frontend — Authenticated API Client

### 7.1 Modify apiClient to accept token getter
**Modify**: `frontend/src/lib/apiClient.ts`
- Add optional `getAccessToken?: () => Promise<string>` parameter to `createApiClient`
- If provided, add `Authorization: Bearer <token>` header to all requests

### 7.2 Create ApiClientContext
**New file**: `frontend/src/contexts/ApiClientContext.tsx`
- `ApiClientProvider` component using `useAuth0().getAccessTokenSilently` to create an authenticated `ApiClient`
- `useApi()` hook to consume the context

### 7.3 Replace static api import
**Modify**: All files that import from `@/services/api` → use `useApi()` hook instead
- `frontend/src/routes/home/HomePage.tsx`
- `frontend/src/routes/scenario/ScenarioPage.tsx`
- `frontend/src/routes/history/HistoryPage.tsx`
- `frontend/src/routes/history/HistoryDetailPage.tsx`
- `frontend/src/routes/settings/SettingsPage.tsx`
- `frontend/src/services/sessions.ts`
- `frontend/src/services/history.ts`
- `frontend/src/queries/productConfig.ts`
- Any other service files using `api`

---

## Phase 8: Frontend — NavBar User Profile

**Modify**: `frontend/src/components/NavBar.tsx`
- Add user avatar (`user.picture`), name (`user.name`), and logout button
- Logout calls `logout({ logoutParams: { returnTo: window.location.origin } })`

---

## Phase 9: Frontend — Per-User localStorage Namespacing

**Modify**: `frontend/src/storage/sessionPointer.ts`
- Include user ID in the key prefix to prevent cross-user data leakage
- e.g. `olivia_pm:{userId}:lastScenarioId`

---

## Phase 10: Auth0 Tenant Setup (External)

Not code changes — done in Auth0 Dashboard:
1. Create SPA Application
2. Set Allowed Callback/Logout/Web Origins: `http://localhost:5173`, `https://pm-journey-frontend.fly.dev`
3. Create API with identifier = `AUTH0_AUDIENCE` value
4. Enable default database connection (+ optional social logins)

---

## Implementation Order

1. Auth0 tenant setup (Phase 10, external)
2. Database migrations (Phase 1)
3. JWT middleware + auth extractor (Phase 2)
4. User upsert feature (Phase 3)
5. Auth0 SDK + Provider in frontend (Phase 5)
6. AuthGuard + protected routes (Phase 6)
7. Authenticated API client + context (Phase 7)
8. NavBar user profile (Phase 8)
9. Update all backend handlers for user scoping (Phase 4) — largest effort
10. Per-user localStorage namespacing (Phase 9)

---

## Key Files

| File | Action |
|------|--------|
| `backend/Cargo.toml` | Add `jsonwebtoken` dep |
| `backend/src/main.rs` | Fetch JWKS at startup, pass to state |
| `backend/src/state.rs` | Add JWKS field to AppState |
| `backend/src/middleware/auth.rs` | **New** — JWT validation extractor |
| `backend/src/features/users/` | **New** — user upsert feature |
| `backend/src/features/mod.rs` | Add users module |
| `backend/src/features/sessions/repository.rs` | Add user_id filtering to all queries |
| `backend/src/features/product_config/repository.rs` | Change singleton → per-user pattern |
| `backend/src/features/scenarios/repository.rs` | Add user_id for custom scenarios |
| `backend/migrations/20260209*.sql` | **New** — schema changes |
| `frontend/package.json` | Add `@auth0/auth0-react` |
| `frontend/src/main.tsx` | Wrap with Auth0Provider |
| `frontend/src/config/env.ts` | Add Auth0 env vars |
| `frontend/src/components/AuthGuard.tsx` | **New** — auth guard |
| `frontend/src/contexts/ApiClientContext.tsx` | **New** — authenticated API context |
| `frontend/src/lib/apiClient.ts` | Add token getter parameter |
| `frontend/src/layouts/AppLayout.tsx` | Wrap with AuthGuard |
| `frontend/src/components/NavBar.tsx` | Add user profile + logout |
| `frontend/src/storage/sessionPointer.ts` | Namespace by user ID |

---

## Verification

1. **Auth flow**: Start frontend, verify redirect to Auth0 login, complete login, verify redirect back with authenticated state
2. **JWT validation**: Make API request without token → 401; with valid token → success
3. **User isolation**: Create sessions with User A, log in as User B, verify User B cannot see User A's sessions
4. **Product config**: Each user can independently set and retrieve their own ProductConfig
5. **Custom scenarios**: User can create a scenario, only they see it; system scenarios remain visible to all
6. **Logout**: Click logout, verify redirect to Auth0 logout, verify local state is cleared
7. **Backend tests**: `cargo test` passes with updated handler signatures
8. **Frontend tests**: `pnpm test` passes (may need to mock Auth0Provider in tests)
