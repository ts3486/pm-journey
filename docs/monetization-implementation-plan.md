# Monetization Implementation Plan (Ultra-Simple First)

Last updated: February 13, 2026
Owner: Product + Engineering
Status: In progress

## 0) Market Context (Japan, retained assumptions)

- PM training demand is strong and certification-oriented.
- Corporate buyers exist, but procurement and billing requirements increase implementation complexity.
- Fastest path to validate willingness-to-pay is self-serve solo conversion first.

Decision:
- Launch `FREE + INDIVIDUAL` first.
- Defer `TEAM` to next phase while keeping a placeholder price signal.

## 1) Scope for Fastest Ship

### Included now

- Free plan (scenario allowlist + daily fair-use limits)
- Individual plan (all scenarios + higher daily fair-use limits)
- Server-side entitlement enforcement
- Pricing page for Free/Individual
- Admin override path for internal operations

### Deferred

- Team monetization flows
- Team dashboard and team session discovery pages
- Stripe checkout/webhooks/portal
- Invoice operations
- Credit wallet/ledger behavior and credit packs

## 2) Architecture Simplifications Applied

1. **No app-level credit behavior in runtime**
   - Credits are no longer used for gating logic.
   - Core gating is fair-use only.

2. **Single usage-control model**
   - Free and Individual both use daily fair-use limits.
   - Error handling consolidated around `FAIR_USE_LIMIT_REACHED`.

3. **Team behind flag**
   - `FF_TEAM_FEATURES_ENABLED=false` keeps Team flows out of launch surface.
   - Existing code paths stay available for controlled preview.

4. **Frontend reduced to two active plans**
   - Pricing and home copy align to fair-use model.
   - Team displayed as coming soon.

## 3) Current Implementation Status

### Done

- Session/message/evaluation/comment/output RBAC integration exists.
- Fair-use enforcement integrated on chat/evaluation flows.
- Scenario gate enforcement is server-side.
- Pricing and home plan messaging updated to fair-use.
- Personal admin override via env variable implemented.

### Remaining (for this ultra-simple phase)

1. Wire actual checkout for Individual (single paid path).
2. Add `/settings/billing` page (current plan + upcoming payment state).
3. Add lightweight post-purchase entitlement refresh UX.
4. Add minimal conversion analytics events.
5. Add E2E for Free -> Individual unlock path.

## 4) Environment and Flags

- `FF_ENTITLEMENT_ENFORCEMENT_ENABLED=true`
- `FF_TEAM_FEATURES_ENABLED=false`
- `ADMIN_OVERRIDE_USER_IDS=<comma-separated-auth0-subs>`
- Fair-use tuning:
  - `FAIR_USE_FREE_AGENT_REPLIES_PER_DAY`
  - `FAIR_USE_FREE_EVALUATIONS_PER_DAY`
  - `FAIR_USE_INDIVIDUAL_AGENT_REPLIES_PER_DAY`
  - `FAIR_USE_INDIVIDUAL_EVALUATIONS_PER_DAY`

### Stripe checkout (when enabling paid flow)

- `FF_BILLING_ENABLED=true`
- `BILLING_PROVIDER=stripe`
- `STRIPE_SECRET_KEY=<sk_test_...>`
- `STRIPE_PRICE_ID_INDIVIDUAL=<price_...>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- Optional:
  - `STRIPE_API_BASE_URL=https://api.stripe.com`
  - `STRIPE_CHECKOUT_SUCCESS_URL=https://<frontend>/pricing?checkout=success`
  - `STRIPE_CHECKOUT_CANCEL_URL=https://<frontend>/pricing?checkout=cancel`
  - `STRIPE_PORTAL_RETURN_URL=https://<frontend>/settings/billing`
  - `APP_BASE_URL=https://<frontend>` (fallback when success/cancel URLs are unset)

## 5) 7-Day Execution Plan

1. Day 1-2: finalize backend fair-use-only behavior + regression tests.
2. Day 2-3: complete pricing/home UX simplification and Team coming-soon copy.
3. Day 3-5: implement Individual checkout backend skeleton + callback flow.
4. Day 5-6: implement `/settings/billing` MVP.
5. Day 6-7: add launch E2E checks and rollout runbook.

## 6) Exit Criteria for Ultra-Simple Launch

- Free users can use allowlisted scenarios with predictable fair-use limits.
- Paid Individual users unlock all scenarios without app-level credit logic.
- No Team surface is accidentally enabled for normal users.
- No cross-org access-control regression in existing RBAC tests.
