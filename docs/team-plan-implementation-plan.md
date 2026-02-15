# Team Plan Implementation Plan

Last updated: February 14, 2026  
Owner: Engineering  
Status: Phase A-F complete, rollout/manual verification in progress

## 1. Goal

Implement Team plan monetization end-to-end:

- Team checkout (Stripe subscription)
- Organization-scoped subscription + entitlements
- Seat quantity synchronization and enforcement
- Team purchase and management UX
- Full backend/frontend/integration test coverage

## 2. Current State Summary

Already implemented:

- Team Stripe checkout (`/billing/checkout/team`)
- Billing portal session (`/billing/portal/session`)
- Stripe webhook ingestion + idempotency (`/billing/webhook/stripe`, `stripe_events`)
- Organization/member/invitation APIs with seat enforcement hooks
- RBAC and cross-org integration tests

Missing for Team:

- Team checkout endpoint + Team price wiring
- Org-scoped subscription persistence from webhook
- Org-scoped entitlement resolution in effective plan logic
- Team purchase UI and seat quantity UX
- Frontend org/team management pages
- Team-specific test matrix

## 3. Scope and Non-Goals

In scope:

- Team plan purchase and lifecycle management
- Seat-based access control tied to active Team subscription
- Team plan surfaced in pricing and billing settings

Out of scope (for first Team release):

- Annual Team contracts
- Invoice customization workflows
- Complex multi-org switching UX
- Credit wallet/ledger monetization

## 4. Architecture Decisions

1. Checkout scope:
- Team checkout is initiated by an org manager/admin/owner.
- Checkout request includes `organizationId` and requested `seatQuantity`.

2. Source of truth:
- Stripe subscription is source of truth for Team status and seats.
- DB `subscriptions.seat_quantity` is synced from webhook updates.

3. Entitlement scope:
- Team entitlement is `scope_type='organization'`, not user.
- User effective Team plan is derived from active org membership + active org entitlement.

4. Feature gate:
- Team behavior is active only when `FF_TEAM_FEATURES_ENABLED=true`.

## 5. Backend Implementation Steps

## Phase A: Team Checkout API

1. Add Team checkout models
- `CreateTeamCheckoutRequest`:
  - `organizationId: string`
  - `seatQuantity: number`
  - `successUrl?: string`
  - `cancelUrl?: string`
- `TeamCheckoutResponse`:
  - `mode: "mock" | "stripe" | "none"`
  - `checkoutUrl?: string | null`
  - `alreadyEntitled: boolean`
  - `message?: string`

2. Add Team checkout route
- `POST /billing/checkout/team`
- Authorization:
  - caller must be manager/admin/owner in target org
  - Team feature flag must be enabled

3. Stripe checkout creation for Team
- Add env var `STRIPE_PRICE_ID_TEAM`
- Stripe mode: `subscription`
- Set metadata:
  - `plan_code=TEAM`
  - `organization_id=<orgId>`
  - `seat_quantity=<requestedSeatQuantity>`
  - `user_id=<initiator>`
- Set line item quantity to requested seats (or subscription item quantity per pricing model)

Acceptance criteria:

- Team checkout endpoint returns valid Stripe checkout URL.
- Non-manager roles get `403`.
- Invalid seat quantity gets `422`.

## Phase B: Webhook Team Lifecycle Sync

1. Parse Team metadata in webhook handlers
- Read `organization_id`, `seat_quantity`, `plan_code`.

2. Upsert Team subscription in DB
- Persist with:
  - `organization_id` set
  - `user_id` null
  - `plan_code='TEAM'`
  - `seat_quantity` from Stripe
  - period start/end and status

3. Upsert org billing customer mapping
- Use `billing_customers.organization_id`.

4. Entitlement sync (organization scope)
- Active/trialing Team subscription => create/update active org entitlement
- Canceled/incomplete/past_due => deactivate org entitlement

Acceptance criteria:

- Team subscription rows are org-scoped after webhook processing.
- `seat_quantity` updates when Stripe subscription quantity changes.
- Team org entitlement flips correctly on cancellation/reactivation.

## Phase C: Effective Plan Resolution

1. Update `resolve_effective_plan(user_id)`:
- Keep admin override highest priority.
- Keep direct user entitlement check (Individual etc.).
- Add active org membership lookup.
- For active membership:
  - fetch active org entitlement
  - if Team entitlement exists and Team features enabled => return `PlanCode::Team` + `organization_id`
  - if Team features disabled => normalize to Individual (existing behavior)
- Fallback to Free.

2. Ensure team fair-use scope uses `organization_id` when plan is Team.

Acceptance criteria:

- Member of Team-entitled org receives effective Team plan.
- User with no Team org remains Individual/Free as expected.

## Phase D: Seat Enforcement Tightening

1. Confirm current seat checks use active Team subscription seat quantity.
2. Ensure invitation creation + accept + member reactivation all enforce limits.
3. Add tests for seat quantity changed from Stripe webhook.

Acceptance criteria:

- Decreasing seats in Stripe blocks additional invitations/reactivations.
- Increasing seats allows new invites without restart.

## 6. Frontend Implementation Steps

## Phase E: Pricing + Checkout UX

1. Add Team plan card as active purchasable option.
2. Add seat quantity input with min/max validation.
3. Add Team checkout action:
- call new `createTeamCheckout` API
- redirect to Stripe checkout URL

4. Status messages:
- show checkout success/cancel states for Team path.

Acceptance criteria:

- Manager can launch Team checkout from pricing page.
- Non-eligible users see clear disabled state/error.

## Phase F: Billing + Team Management UX

1. Extend `/settings/billing`:
- show current plan, organization context, seat quantity, billing status
- keep Stripe portal button

2. Add minimal Team management page (or section):
- list members
- invite member
- update role/status
- remove member
- show seat utilization (`active + pending / seat limit`)

Acceptance criteria:

- Team admin can manage members and invites from frontend.
- Seat usage visible and consistent with backend enforcement.

## 7. Testing Plan

## Backend tests

1. Unit tests:
- Team checkout request validation
- Team webhook metadata parsing
- entitlement sync for org scope
- effective plan resolution with org entitlement

2. Integration tests:
- Team checkout endpoint auth + validation matrix
- Webhook events create/update/delete Team subscription + org entitlement
- seat enforcement after webhook seat change
- existing RBAC regressions remain green

## Frontend tests

1. Pricing Team checkout UI:
- seat quantity validation
- API call payload correctness
- redirect on success

2. Billing/team management UI:
- rendering org seat usage
- invite flow success/error handling
- role updates and delete actions

3. Route/nav tests:
- Team pages registered and accessible from menu/settings.

## 8. Required Env Variables

New/required for Team:

- `FF_TEAM_FEATURES_ENABLED=true`
- `STRIPE_PRICE_ID_TEAM=<price_...>`

Already required for Stripe:

- `FF_BILLING_ENABLED=true`
- `BILLING_PROVIDER=stripe`
- `STRIPE_SECRET_KEY=<sk_...>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- `STRIPE_PRICE_ID_TEAM=<price_...>`
- `APP_BASE_URL=<frontend-url>`

Optional but recommended:

- `STRIPE_CHECKOUT_SUCCESS_URL`
- `STRIPE_CHECKOUT_CANCEL_URL`
- `STRIPE_PORTAL_RETURN_URL`

## 9. Stripe Dashboard Tasks

1. Create Team recurring price (`price_...`) in same mode (test/live) as active secret key.
2. Ensure webhook endpoint is configured:
- `/billing/webhook/stripe`
- events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
3. Ensure Customer Portal enabled.

## 10. Rollout Sequence

1. Deploy backend with Team code behind `FF_TEAM_FEATURES_ENABLED=false`.
2. Verify no regression in existing free/team flows.
3. Configure Team Stripe price + env var.
4. Enable `FF_TEAM_FEATURES_ENABLED=true` in staging.
5. Run full backend+frontend+integration tests in staging.
6. Execute manual Team purchase scenario.
7. Enable Team in production.

## 11. Step-by-Step Execution Checklist

1. Implement Phase A (Team checkout endpoint + Stripe team price integration).
2. Implement Phase B (webhook org-scoped sync + seat quantity sync).
3. Implement Phase C (effective plan resolution for org Team entitlement).
4. Implement Phase D (seat enforcement regression coverage).
5. Implement Phase E (frontend Team checkout UX).
6. Implement Phase F (frontend team management UX).
7. Add/expand tests after each phase and keep suites green.
8. Perform staging rollout + manual verification.
