# Manager Review + Team Login Implementation Plan

Last updated: February 11, 2026  
Owner: Product + Engineering  
Status: Proposed (implementation-ready)

## 1) Objectives

- Allow `manager` role users to view `member` scenario progress and results.
- Allow managers/reviewers to post `上長コメント` on member sessions.
- Add first-party login/signup screens before Auth0 so new users can clearly choose:
  - `個人ユーザーとして始める`
  - `チームとして始める`

## 2) Current State

- Auth is Auth0-only redirect from `AuthGuard`; no in-app pre-login choice screen.
- Session access is owner-only (`sessions.user_id`).
- Comment create/list is also owner-only.
- No organization/team membership model yet.

## 3) Target User Flows (Login + Onboarding)

### 3.1 New Individual User

1. User opens app, lands on `/auth`.
2. Clicks `個人ユーザーとして始める`.
3. App calls `loginWithRedirect` with `screen_hint=signup` and `appState.intent=individual`.
4. Auth0 signup/login completes.
5. Backend upserts `users` row from token `sub`.
6. User lands in personal workspace (no org membership required).

### 3.2 Team Owner / Manager (New Team)

1. User opens `/auth`.
2. Clicks `チームとして始める`.
3. App routes to `/auth/team` and shows:
   - `チームを新規作成`
   - `招待リンクで参加`
4. User chooses `新規作成` and signs up via Auth0.
5. Post-login onboarding wizard creates `organization` and first `organization_members` row with role `OWNER` (or `ADMIN`).
6. Owner invites managers/members/reviewers.

### 3.3 Team Member/Manager via Invite

1. Invite link opens `/auth/invite?token=...`.
2. App validates invite status (preflight endpoint).
3. User signs up/login via Auth0.
4. App calls `accept invitation`.
5. Backend creates/activates membership with invited role and org.
6. User lands on team-aware home.

## 4) Login Screen UX Plan

### 4.1 New Public Routes

- `/auth` (entry choice)
- `/auth/team` (team create/join branching)
- `/auth/invite` (invite acceptance landing)
- `/auth/error` (auth/invite failures)

Protected app routes remain under `AppLayout`.

### 4.2 Screen Requirements

### `/auth` (Choice Screen)

- Two large cards above fold:
  - `個人ユーザーとして始める`
  - `チームとして始める`
- Each card has short benefit bullets and CTA.
- Secondary links:
  - `既存アカウントでログイン`
  - `招待リンクをお持ちの方`
- Copy should explicitly mention:
  - 個人 = self-practice, personal history
  - チーム = 上長コメント, progress visibility, team dashboard

### `/auth/team`

- Two clear paths:
  - `チームを新規作成` (owner/admin path)
  - `招待リンクで参加` (invite path)
- If invite token exists in URL, prioritize invite flow and disable conflicting actions.

### `/auth/invite`

- Show organization name, invited role, and expiration date before login.
- After login, show success/failure state with next step buttons.

### 4.3 Visual Direction (Frontend)

- Use a deliberate split layout and strong hierarchy (not generic single-button auth page).
- Keep existing brand language (warm orange palette) while making role choice unmistakable.
- Ensure mobile-first readability and full keyboard navigation.

## 5) Backend Implementation Plan

### 5.1 Data Model / Migrations

Add:

- `organizations(id, name, created_by_user_id, created_at, updated_at)`
- `organization_members(id, organization_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at)`
- `organization_invitations(id, organization_id, email, role, token_hash, expires_at, status, created_by_user_id, created_at, accepted_at)`

Extend:

- `sessions`: add `organization_id` nullable + index
- `comments`: add `author_user_id`, `author_role`

### 5.2 Authorization Service

Create central helper:

- `authorize_session_access(user_id, session_id, action)`

`action`:

- `view`
- `comment`
- `manage` (delete/admin)

Policy v1:

- Owner (`sessions.user_id`) can `view/comment/manage`.
- Same-org `MANAGER/REVIEWER/ADMIN/OWNER` can `view/comment`.
- Same-org `MEMBER` can only view own sessions (unless explicit share is added later).

Replace current ownership checks in:

- sessions get/list/delete
- messages list/post
- evaluations
- comments list/create
- test-cases list/create/delete

### 5.3 Comment Policy and Auditability

- `POST /sessions/{id}/comments` allowed for `MANAGER/REVIEWER/ADMIN/OWNER`.
- Persist `author_user_id`, `author_role`.
- Return role-aware comment metadata to frontend.

### 5.4 Team Session Discovery APIs

Add:

- `GET /team/sessions` (filters: member, scenario, date range, score range)
- `GET /team/sessions/{id}` (same response shape as history detail, role-authorized)

### 5.5 Invitation APIs

Add:

- `POST /organizations/current/invitations`
- `GET /invitations/{token}/preflight`
- `POST /invitations/{token}/accept`

## 6) Frontend Implementation Plan

### 6.1 Routing / Guard Refactor

- Split app into `PublicLayout` and protected `AppLayout`.
- Update `AuthGuard`:
  - stop immediate auto-redirect for every unauthenticated render
  - redirect to `/auth` with `returnTo` on protected-route access

### 6.2 Auth Actions

Implement button intents using `loginWithRedirect`:

- Individual signup: `screen_hint=signup`, `appState.intent=individual`
- Individual login: default login intent
- Team owner signup: `screen_hint=signup`, `appState.intent=team_create`
- Invite flow: include `invitation` (and `organization` if used by Auth0 org invites)

Note: Backend authorization remains DB-driven; Auth0 claims are hints only.

### 6.3 Onboarding Resolver

Add `useOnboardingStatus` query (`GET /me/onboarding-status`) to route users after login:

- no org + individual intent -> personal home
- no org + team_create intent -> create-team wizard
- pending invite token -> invitation acceptance flow
- org member -> team-aware home

### 6.4 Team UX in History/Detail

- Add team sessions page (`/team/sessions`) for managers/reviewers.
- In history detail:
  - show role badge and ownership info
  - show/hide `上長コメント` form by permission
  - keep comments list visible for authorized viewers

## 7) Auth0 Tenant Configuration

- Keep Universal Login for credential entry.
- Add allowed callbacks for new public auth routes.
- Enable organization and invitation support (if using Auth0 Organizations).
- Configure invitation email template to link to `/auth/invite`.

## 8) Rollout Phases

### Phase 0: Contract + UX spec (2-3 days)

- Finalize role matrix and route map.
- Freeze API contract and migration schema.
- Finalize copy/wireframes for `/auth`, `/auth/team`, `/auth/invite`.

### Phase 1: Public auth screens + guard refactor (3-4 days)

- Implement public routes and non-authenticated layouts.
- Add login/signup intent wiring.
- Remove auto-redirect-first behavior from guard.

### Phase 2: Org/membership/invite backend (4-6 days)

- Add migrations and repositories.
- Implement invitation create/preflight/accept flows.

### Phase 3: RBAC session access + comments (4-6 days)

- Implement `authorize_session_access`.
- Replace ownership checks across affected services.
- Add author metadata to comments.

### Phase 4: Team session UI + manager workflow (3-5 days)

- Add `/team/sessions` list and filters.
- Update history detail role-aware comment behavior.

### Phase 5: QA + rollout (3-4 days)

- Integration tests + E2E tests.
- Pilot with internal users, then gradual release.

## 9) Test Plan (Minimum)

Backend:

- authorization unit tests for each role/action combination
- invitation token lifecycle tests (valid, expired, reused)
- session access integration tests (owner vs manager vs unrelated user)

Frontend E2E:

- new user chooses individual path and reaches personal home
- new user chooses team path, creates org, invites member
- invited member accepts and can access permitted resources
- manager can open member session and post `上長コメント`
- non-authorized user receives forbidden/not found response

## 10) Acceptance Criteria

- New users can clearly choose `個人` or `チーム` before Auth0 credential entry.
- Manager/reviewer in same organization can view member session progress/results.
- Manager/reviewer can post `上長コメント` with author attribution.
- Unauthorized cross-org access is blocked across all related endpoints.
