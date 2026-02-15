# Monetization Task List (Ultra-Simple Launch)

Last updated: February 13, 2026
Target: fastest ship with `FREE + INDIVIDUAL`

## 1) Scope Lock

- [x] Launch plans: `FREE` and `INDIVIDUAL`
- [x] Defer Team monetization behind feature flag
- [x] Remove app-level credit gating from core runtime behavior
- [x] Use daily fair-use model for usage control

## 2) Backend

- [x] Keep scenario access gate server-side on session creation
- [x] Enforce fair-use on chat replies
- [x] Enforce fair-use on evaluations
- [x] Stop credit wallet creation requirement in session/evaluation flows
- [x] Return neutral credit response for compatibility (`/me/credits` -> zeros)
- [x] Keep admin override support via `ADMIN_OVERRIDE_USER_IDS`
- [ ] Add tests that Free fair-use limits trigger deterministically
- [ ] Add tests that Team plan is downgraded to Individual when `FF_TEAM_FEATURES_ENABLED=false`

## 3) Frontend

- [x] Pricing page simplified to active `FREE + INDIVIDUAL`
- [x] Home page plan messaging updated to fair-use model (no credit count)
- [x] Team shown as coming soon
- [x] Add `/settings/billing` lightweight page (current plan + coming soon notice)
- [x] Wire Individual checkout CTA when backend checkout endpoint is available

## 4) Feature Flags and Ops

- [ ] Confirm production defaults:
  - [ ] `FF_ENTITLEMENT_ENFORCEMENT_ENABLED=true`
  - [ ] `FF_TEAM_FEATURES_ENABLED=false`
- [ ] Document fair-use env defaults in deployment runbook
- [ ] Configure admin override for operator accounts

## 5) Launch QA

- [ ] Backend integration pass with real `DATABASE_URL`
- [ ] Frontend smoke pass (pricing/home/scenario lock states)
- [ ] E2E: Free user hits lock -> upgrade path messaging
- [ ] E2E: Individual user can access all scenarios
- [ ] Regression check: RBAC cross-org isolation still passes

## 6) Post-Launch (Deferred)

- [ ] Team checkout + subscription lifecycle
- [ ] Team sessions/dashboard surfaces
- [ ] Stripe webhook idempotency path
- [ ] Invoice pilot operations
- [ ] Analytics funnel events and reporting
