# Monetization Implementation Plan (Detailed)

Last updated: February 11, 2026
Owner: Product + Engineering
Status: Execution plan (build-ready)

## 1) Scope and Principles

This plan operationalizes `docs/monetization-plan.md` into implementation steps for:
- Free / Individual / Team plans
- Entitlements + AI review credits
- Team collaboration (`上長コメント`) and team performance dashboard
- Billing integration and subscription lifecycle

Guiding principles:
- Enforce entitlements server-side first (client checks are UX only).
- Avoid shared login credentials; support team collaboration via role-based access to shared resources.
- Keep v1 simple and reliable (clear event logs, idempotent billing webhooks, minimal but complete RBAC).

## 2) Current State and Missing Core Features

### Already implemented

- Auth0 login and per-user scoping (`sessions.user_id` and ownership checks).
- Session/message/evaluation/comment/test-case flows.
- Basic comment UI (`上長コメント` label) on history detail.
- User-scoped history and achievements pages.

### Missing core features required for monetization

1. Plan and entitlement data model does not exist.
2. Billing integration does not exist (checkout, customer mapping, webhook processing, subscription state).
3. Organization/team model does not exist (org, membership, roles, invites, seat count).
4. Shared resource authorization does not exist (today all session access is owner-only).
5. Team performance dashboard backend and UI do not exist.
6. AI credit wallet and ledger do not exist.
7. Usage enforcement does not exist for free scenario limits and review credits.
8. `OutputSubmission` is localStorage-only and not shareable across team members.
9. Monetization/paywall surfaces do not exist (pricing page, lock states, upgrade flow, billing settings).
10. Analytics pipeline for monetization events is not implemented (current telemetry is `console.info` only).
11. Automated monthly credit reset and subscription seat sync jobs do not exist.
12. Test coverage is minimal; integration/E2E guardrails are missing.

## 3) Decision: Shared Account vs Shared Resource

For Team plan, do **not** support multiple people using the same login account.

Implement:
- Separate Auth0 users per person.
- Organization membership with roles.
- Shared access to resources (sessions, comments, evaluations, outputs) by org permissions.

Reason:
- Better auditability and security.
- Cleaner billing (seat count per active member).
- Cleaner reviewer attribution for `上長コメント`.

## 4) Target Architecture (v1)

### Core entities (new)

- `organizations`
- `organization_members`
- `organization_invitations`
- `subscriptions`
- `billing_customers`
- `entitlements`
- `credit_wallets`
- `credit_ledger`
- `session_access` (optional if using org-wide sharing rules)
- `team_dashboard_snapshots` (optional optimization)
- `outputs` (move from localStorage to backend for shared visibility)

### Resource ownership/access model

- Session owner remains `sessions.user_id`.
- For Team plan:
  - Session also linked to `organization_id`.
  - Org managers/reviewers can view session detail, evaluation, comments, outputs.
  - Members can access only their own sessions unless explicitly shared.
- `上長コメント` creation allowed only for manager/reviewer roles.

## 5) Step-by-Step Implementation Plan

### Phase 0: Foundation and Contracts (Week 1)

Step 0.1: Freeze v1 domain decisions
- Finalize role set: `OWNER`, `ADMIN`, `MANAGER`, `MEMBER`, `REVIEWER`.
- Finalize access matrix for each endpoint/resource.
- Finalize credit consumption rules (what actions burn credits, in what order).

Step 0.2: Publish API contract draft
- Add OpenAPI draft for new endpoints (org, membership, billing, entitlements, dashboard).
- Define error codes for entitlement failures (`PLAN_REQUIRED`, `CREDIT_EXHAUSTED`, `SEAT_LIMIT_REACHED`, `FORBIDDEN_ROLE`).

Step 0.3: Add feature flags
- `billing_enabled`
- `team_features_enabled`
- `entitlement_enforcement_enabled`
- `team_dashboard_enabled`

Acceptance criteria:
- Team agrees on role matrix and endpoint contracts before migrations start.

### Phase 1: Data Model and Migrations (Weeks 1-2)

Step 1.1: Add monetization and org schema migrations
- Create tables:
  - `organizations(id, name, created_by_user_id, created_at, updated_at)`
  - `organization_members(id, organization_id, user_id, role, status, invited_by_user_id, joined_at, created_at, updated_at)`
  - `organization_invitations(id, organization_id, email, role, invite_token_hash, expires_at, status, created_by_user_id, created_at)`
  - `billing_customers(id, user_id?, organization_id?, provider, provider_customer_id, created_at, updated_at)`
  - `subscriptions(id, organization_id?, user_id?, provider, provider_subscription_id, status, plan_code, seat_quantity, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)`
  - `entitlements(id, scope_type, scope_id, plan_code, status, valid_from, valid_until, source_subscription_id, created_at, updated_at)`
  - `credit_wallets(id, scope_type, scope_id, monthly_credits, purchased_credits, monthly_reset_at, created_at, updated_at)`
  - `credit_ledger(id, wallet_id, direction, amount, reason, reference_type, reference_id, occurred_at, metadata_jsonb)`
  - `outputs(id, session_id, kind, value, note, created_by_user_id, created_at)`

Step 1.2: Extend existing tables
- `sessions`: add `organization_id` nullable, add index.
- `comments`: add `author_user_id` and `author_role`.

Step 1.3: Add backfill migration
- For existing users, create default `FREE` entitlement rows and wallets.

Acceptance criteria:
- Migrations apply cleanly in dev and staging.
- Existing session/history flows remain readable for existing users.

### Phase 2: Backend RBAC and Shared Resource Access (Weeks 2-3)

Step 2.1: Build authorization module
- New helper: `authorize_session_access(user_id, session_id, action)`:
  - owner access
  - org role-based access
  - explicit shared access (if adopted)
- Replace direct ownership checks (`verify_session_ownership`) in:
  - messages
  - evaluations
  - comments
  - test_cases
  - sessions get/list/delete behavior

Step 2.2: Add role-aware comment policies
- `POST /sessions/{id}/comments`:
  - Team feature required.
  - Allowed roles: manager/reviewer/admin/owner.
- Save `author_user_id` + `author_role`.

Step 2.3: Add outputs API (replace local-only outputs)
- Endpoints:
  - `GET /sessions/{id}/outputs`
  - `POST /sessions/{id}/outputs`
  - `DELETE /sessions/{id}/outputs/{outputId}`
- Apply same session access policy.

Acceptance criteria:
- User + reviewer in same org can open same session detail page and see shared comments/outputs.
- Unauthorized users cannot access sessions outside policy.

### Phase 3: Entitlements and Credit Enforcement (Weeks 3-4)

Step 3.1: Build entitlement service
- Resolve effective plan for user/org.
- Resolve scenario access rights.
- Resolve team feature availability.

Step 3.2: Enforce scenario gating server-side
- On `create_session`, validate scenario against effective plan:
  - Free allowlist (6 scenario IDs)
  - Individual/Team full access

Step 3.3: Enforce AI credit usage
- Before evaluation:
  - check available wallet balance
  - decrement in transaction
  - write `credit_ledger` event
- Return typed error when exhausted.

Step 3.4: Add monthly reset job
- Daily cron task:
  - reset monthly credits for wallets past reset date
  - append ledger entry

Acceptance criteria:
- Entitlement errors are deterministic and returned with stable codes/messages.
- Credit ledger reconciles with wallet balances.

### Phase 4: Billing Integration (Stripe) (Weeks 4-6)

Step 4.1: Product/price setup
- Stripe products:
  - Individual one-time
  - Team monthly seat
  - Team annual seat
  - Credit packs (30/100/250)

Step 4.2: Checkout session endpoints
- `POST /billing/checkout/individual`
- `POST /billing/checkout/team`
- `POST /billing/checkout/credits`

Step 4.3: Webhook processor
- Verify signatures, idempotency key handling.
- Handle events:
  - checkout completed
  - subscription created/updated/canceled
  - invoice paid/failed
  - payment failed/refunded
- Sync `subscriptions`, `entitlements`, `wallets`.

Step 4.4: Billing portal endpoint
- `POST /billing/portal` for seat management and invoice access.

Acceptance criteria:
- Payment success updates entitlement within 1 minute.
- Duplicate webhooks do not create inconsistent state.

### Phase 5: Organization and Seat Management (Weeks 6-7)

Step 5.1: Org APIs
- `POST /organizations`
- `GET /organizations/current`
- `PATCH /organizations/current`

Step 5.2: Membership APIs
- `GET /organizations/current/members`
- `POST /organizations/current/invitations`
- `POST /organizations/current/invitations/{token}/accept`
- `PATCH /organizations/current/members/{memberId}` (role/status)
- `DELETE /organizations/current/members/{memberId}`

Step 5.3: Seat enforcement
- Active members <= active seat count.
- Clear error when invite/activation exceeds seat quota.

Acceptance criteria:
- Admin can invite reviewer and member.
- Reviewer can access permitted team sessions without shared credentials.

### Phase 6: Frontend Monetization UX (Weeks 6-8)

Step 6.1: Plan-aware app state
- Add `useEntitlements` query.
- Add reusable `FeatureGate` and `ScenarioGate` components.

Step 6.2: Pricing and upgrade surfaces
- Add `/pricing` page.
- Add lock states in home/scenario/history when feature unavailable.
- Add upgrade CTA flows:
  - free -> individual
  - free/individual -> team

Step 6.3: Billing settings UI
- Add `/settings/billing`:
  - current plan
  - credit balance
  - purchase history link
  - manage subscription button

Step 6.4: Replace local outputs storage
- Update `frontend/src/services/outputs.ts` to API-backed storage.
- Remove localStorage dependence for shared resources.

Acceptance criteria:
- Locked scenarios/features consistently show plan-aware messaging.
- Users can buy and immediately use unlocked capabilities.

### Phase 7: Team Collaboration Features (Weeks 7-9)

Step 7.1: Reviewer workflow on session detail
- Show role badge and author identity for comments.
- Add role-based UI behavior:
  - reviewer can comment
  - member read-only for manager/reviewer comments (configurable)

Step 7.2: Team session discovery
- Add `/team/sessions` list page with filters:
  - member
  - date range
  - scenario
  - score range

Step 7.3: Shared resource navigation
- From team list, open same `HistoryDetailPage` resource.
- Ensure all linked resources (messages, evaluation, comments, outputs, test cases) are visible per policy.

Acceptance criteria:
- Reviewer and learner can open same session URL and collaborate.

### Phase 8: Team Performance Dashboard (Weeks 8-10)

Step 8.1: Dashboard backend endpoints
- `GET /team/dashboard/summary`
- `GET /team/dashboard/members`
- `GET /team/dashboard/members/{userId}`

Step 8.2: Dashboard metrics (MVP)
- Per member:
  - completed sessions
  - average score
  - pass rate
  - last active date
- Team summary:
  - active learners
  - total sessions
  - average score trend (weekly)
  - lowest-scoring categories

Step 8.3: Frontend dashboard pages
- Add `/team/dashboard` with:
  - summary cards
  - member table with drilldown
  - trend chart

Acceptance criteria:
- Team admin/manager can track member performance and trends from one page.

### Phase 9: Analytics, Reporting, and Ops (Weeks 9-11)

Step 9.1: Monetization event instrumentation
- Emit events:
  - `paywall_viewed`
  - `plan_selected`
  - `checkout_started`
  - `checkout_completed`
  - `credit_pack_purchased`
  - `credit_exhausted`
  - `team_invite_sent`
  - `team_member_activated`

Step 9.2: Persist analytics
- Send telemetry to real sink (not console).
- Add event schema/versioning.

Step 9.3: Admin and support tooling
- Internal admin endpoints or scripts:
  - inspect entitlement state
  - grant/revoke credits
  - replay webhook safely

Acceptance criteria:
- Revenue funnel and credit consumption are queryable with low manual effort.

### Phase 10: Hardening, QA, and Rollout (Weeks 10-12)

Step 10.1: Test strategy
- Backend:
  - migration tests
  - entitlement unit tests
  - webhook idempotency tests
  - RBAC integration tests
- Frontend:
  - component tests for gates and paywall states
  - E2E for checkout -> entitlement unlock
  - E2E for reviewer access to shared session

Step 10.2: Security review
- Validate org boundary isolation.
- Validate role escalation protections.
- Validate webhook signature and replay protections.

Step 10.3: Progressive rollout
- Internal dogfood
- 3-5 design partner teams
- GA after metric thresholds pass

Acceptance criteria:
- No P0 access-control defects in pilot.
- Billing and entitlement sync error rate below agreed threshold.

## 6) API Endpoints to Add (Suggested v1)

- `GET /me/entitlements`
- `GET /me/credits`
- `POST /billing/checkout/individual`
- `POST /billing/checkout/team`
- `POST /billing/checkout/credits`
- `POST /billing/portal`
- `POST /billing/webhooks/stripe`
- `POST /organizations`
- `GET /organizations/current`
- `GET /organizations/current/members`
- `POST /organizations/current/invitations`
- `POST /organizations/current/invitations/{token}/accept`
- `PATCH /organizations/current/members/{memberId}`
- `DELETE /organizations/current/members/{memberId}`
- `GET /team/sessions`
- `GET /team/dashboard/summary`
- `GET /team/dashboard/members`
- `GET /team/dashboard/members/{userId}`
- `GET /sessions/{id}/outputs`
- `POST /sessions/{id}/outputs`
- `DELETE /sessions/{id}/outputs/{outputId}`

## 7) RBAC Matrix (v1 Draft)

- `MEMBER`:
  - create/view own sessions
  - request evaluations
  - view own dashboard card
- `REVIEWER`:
  - view assigned/team sessions
  - add `上長コメント`
  - no billing or seat management
- `MANAGER`:
  - reviewer permissions
  - view team dashboard
  - manage member roles (except owner)
- `ADMIN/OWNER`:
  - full org management
  - billing/seat management

## 8) High-Risk Areas and Mitigations

1. Access control bugs exposing cross-org data.
- Mitigation: centralized authorization helper + integration tests for each role/action.

2. Webhook race conditions and duplicates.
- Mitigation: idempotency table + transactional upserts + retry-safe handlers.

3. Credit ledger drift from wallet balances.
- Mitigation: all deductions/reset operations inside DB transactions + reconciliation job.

4. Team dashboard query cost on large datasets.
- Mitigation: indexed aggregates and optional daily snapshot materialization.

## 9) Immediate Build Order (If Starting This Week)

1. Phase 0 decisions and API contract freeze.
2. Phase 1 migrations (org/billing/entitlements/wallet/outputs).
3. Phase 2 RBAC refactor + shared session access.
4. Phase 3 entitlement + credit enforcement.
5. Phase 4 Stripe checkout + webhook sync.
6. Phase 6 frontend paywall and billing settings.
7. Phase 7 reviewer collaboration flow.
8. Phase 8 team dashboard MVP.
9. Phase 10 hardening and staged rollout.
