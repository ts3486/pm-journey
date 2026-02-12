# Monetization Implementation Plan (Detailed)

Last updated: February 12, 2026
Owner: Product + Engineering
Status: Execution plan (build-ready)

## 0) Market Context: PM Education in Japan

### Market opportunity

The Japanese corporate training market is valued at **5,800 billion yen (2024)**, forecast to reach **6,130 billion yen in 2025 (+4.6% YoY)** and **USD 44.3B by 2034 (CAGR 6.78%)**. The BtoB e-learning segment is growing faster at **+7.8% YoY**, with e-learning's share of total training nearly doubling from 12.9% (2019) to 20.2% (2024) post-COVID.

Globally, the PM training market is growing at **CAGR 8.1% (2025-2033)**, and AI in project management is projected to grow from **USD 2.5B (2023) to USD 5.7B (2028) at CAGR 17.3%**. PMI estimates **25 million new PM professionals are needed globally by 2030**.

### Key growth drivers specific to Japan

- **DX urgency and PM talent shortage**: ~80% of Japanese enterprises have legacy systems requiring DX transformation, but ~70% of IT talent sits in vendor companies, not user companies. This creates massive demand for internal PM upskilling.
- **Government reskilling budget**: The Japanese government has committed **1 trillion yen** to reskilling initiatives under Society 5.0/DX policies.
- **Human capital disclosure requirements (人的資本経営)**: Companies are now required to disclose talent development investments, pushing systematic training spend.

### Competitive landscape

| Competitor | Offering | Weakness vs pm-journey |
|---|---|---|
| **富士通ラーニングメディア** | PM simulation training (2-day workshop + e-learning, QCD scoring, 15 PDUs) | Pre-scripted scenarios, no AI adaptation, expensive (125K-144K yen/person) |
| **インソース** | Largest training vendor, PM fundamentals catalog | Lecture-based, no simulation, no ongoing engagement |
| **リスキル** | Flat-rate PMBOK courses (15K yen/person) | Classroom/online lecture only, no practice environment |
| **アイシンク** | PMI ATP Premier partner, PMP prep | Certification prep focus, not skill-building simulation |
| **ITプレナーズ** | "Phoenix Project" DevOps simulation | DevOps-specific, not general PM |
| **Udemy/Schoo** | Self-paced PM courses (1.2K-27.8K yen) | Passive video content, no interactive scenarios or AI feedback |

**No Japanese PM training provider currently combines simulation + AI-powered adaptive scenarios + real-time AI evaluation.** This is pm-journey's core differentiator.

### Market pain points pm-journey addresses

1. **"研修が単なるイベントになる" (Training becomes a one-time event)** — The #1 complaint from corporate training buyers. pm-journey's repeatable simulation + progress tracking solves this directly.
2. **Theory-practice gap** — PMBOK lectures teach frameworks but fail at building judgment under uncertainty. Simulation-based AI scenarios bridge this gap.
3. **No safe failure environment** — Real projects are too high-stakes for learning. pm-journey provides a risk-free practice ground.
4. **Difficulty measuring ROI** — Corporate buyers spending 300K-1M yen/day on training cannot demonstrate outcomes. pm-journey's scoring, trend tracking, and team dashboard provide concrete evidence.
5. **High cost barrier for SMEs** — At 300K-1M yen/day for instructor-led training, SMEs are priced out. pm-journey's per-seat SaaS model is dramatically more accessible.
6. **Static, non-personalized content** — Current offerings are one-size-fits-all. AI-driven adaptation personalizes the experience.

### Certification ecosystem alignment (v2 roadmap)

The following certifications drive training purchase decisions in Japan:

| Certification | Scale | Relevance |
|---|---|---|
| **IPA プロジェクトマネージャ試験** | ~8K examinees/year, 13.5% pass rate | National IT exam, Level 4 (highest). Alignment could drive individual adoption. |
| **PMP** | 48,404 holders in Japan (Dec 2024) | 35-hour training prerequisite + annual PDU credits for maintenance. PDU-eligible status would be a major enterprise sales enabler. |
| **P2M (PMS/PMR)** | Smaller base, PMAJ-administered | Japan's own PM standard. P2M Guidebook 4th edition released 2024. |

**v1 action**: Tag scenarios with PMBOK knowledge area alignment (already useful for SEO and positioning).
**v2 action**: Apply for PMI Authorized Training Partner (ATP) status to offer PDU-eligible training.

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
- **Price competitively against Japanese market norms** (see pricing strategy below).

## 1.5) Pricing Strategy (Market-Informed)

### Market pricing reference

| Segment | Typical market price | pm-journey positioning |
|---|---|---|
| Corporate in-house training (1 day) | 300,000 - 1,000,000 yen/day | Team plan: **~5,000 yen/seat/month** (annual) = ~60K/year per person. 10-seat team = 600K/year, roughly 1-2 days of traditional training — but available year-round. |
| Public PM seminar (1 day) | 30,000 - 80,000 yen/person | Individual plan: **~3,000 yen one-time** lifetime access. Dramatically cheaper than a single seminar, driving individual adoption and word-of-mouth. |
| PM simulation (2 days, Fujitsu) | 125,400 - 144,100 yen/person | Team plan at 60K/year delivers unlimited simulation practice vs a single 2-day event. |
| Online courses (Udemy) | 1,200 - 27,800 yen (sale prices) | Free tier + Individual plan competes directly, with interactive AI advantage. |
| Flat-rate corporate e-learning | 50,000 - 150,000 yen/person/year | Team plan at ~60K/year/seat is competitive while offering unique simulation capability. |

### Recommended v1 pricing (Japanese market)

| Plan | Price | Target |
|---|---|---|
| **Free** | ¥0 | Individual learners, trial users. 6 scenarios, limited AI credits. |
| **Individual** | ¥2,980 one-time (tax incl.) | Self-learners, certification prep, freelance PMs. All scenarios, generous AI credits. |
| **Team Monthly** | ¥5,980/seat/month (tax incl.) | SMEs, pilot teams testing the platform. |
| **Team Annual** | ¥4,980/seat/month (tax incl., billed annually) | Enterprise/corporate training departments. ~16% discount vs monthly. |
| **Credit Packs** | ¥980 / ¥2,480 / ¥4,980 (30/100/250 credits) | Power users who exhaust monthly AI credits. |

### Enterprise sales motion (v2)

The corporate training market (~80% of total spend) requires a different sales channel:
- **Invoice billing (請求書払い)**: Japanese enterprises strongly prefer invoice-based payment over credit card. Plan for Stripe Invoice or manual invoicing support in v2.
- **Volume discounts**: 50+ seats, 100+ seats tiers with custom pricing.
- **Pilot program**: Offer 1-month free trial for 5-10 seats to lower adoption friction.
- **ROI reporting**: Exportable PDF reports showing team score improvement over time — critical for HR departments justifying training budgets under human capital disclosure requirements.

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

Step 0.3: Tag scenarios with PMBOK knowledge areas
- Add `pmbok_knowledge_areas` metadata to each scenario (e.g., Scope Management, Risk Management, Stakeholder Management).
- This enables: filtering by topic on pricing page, certification alignment messaging, and future PDU credit mapping.
- Low effort, high value for positioning against certification-focused competitors.

Step 0.4: Add feature flags
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
  - PMBOK knowledge area heatmap (strengths/weaknesses by topic)

Step 8.4: ROI/progress report export (Team plan)
- `GET /team/dashboard/report?format=pdf&period=...`
- Generates downloadable PDF summarizing:
  - team score improvement over time
  - scenarios completed per member
  - knowledge area coverage
  - before/after comparison if baseline exists
- This directly addresses the "training ROI measurement" pain point that plagues the Japanese corporate training market and supports 人的資本経営 disclosure requirements.

Acceptance criteria:
- Team admin/manager can track member performance and trends from one page.
- Exportable PDF report is usable for internal HR reporting.

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

### Scenario metadata (new in v1)
- `GET /scenarios` — add `pmbok_knowledge_areas` field to response

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

## 8) Go-to-Market Strategy

### Phase A: Individual-first launch (Weeks 10-14)

**Goal**: Build user base and collect social proof before corporate sales.

1. **SEO/content marketing**: Publish scenario walkthroughs and PM tips blog posts targeting keywords like "PM研修", "プロジェクトマネジメント 練習", "PMP 対策".
2. **Certification community**: Share on PMP/IPA PM exam study communities (Qiita, Zenn, X/Twitter PM study groups).
3. **Free tier virality**: Make free tier genuinely useful (6 scenarios is enough to demonstrate value). Add share-to-X badges for achievements.
4. **Udemy/Schoo price anchoring**: At ¥2,980 one-time, Individual plan is cheaper than most Udemy PM courses at full price and includes AI-powered interactive simulation.

### Phase B: Corporate pilot program (Weeks 14-20)

**Goal**: Land 3-5 design partner companies with Team plan.

1. **Target DX-active enterprises**: Companies publicly announcing DX transformation are likely in PM talent pain. Target their HR/DX推進部.
2. **PMO community outreach**: Present at NPMO (日本PMO協会) events, PMAJ symposium, regional PM meetups.
3. **Pilot offer**: 1-month free for up to 10 seats with dedicated onboarding support. Convert to paid after demonstrating dashboard metrics.
4. **Case study generation**: Co-create ROI case studies with pilot companies (score improvement, time-to-competency reduction).

### Phase C: Scale corporate sales (Weeks 20+)

1. **Invoice billing**: Support 請求書払い for enterprise procurement processes.
2. **PMI ATP application**: Apply for Authorized Training Partner status (enables PDU credits — a major purchase driver for PMP holders).
3. **Channel partnerships**: Partner with IT consulting firms (SIer) who need to upskill client-side PMs as part of DX engagements.
4. **Training ROI reports**: Automated exportable reports for human capital disclosure (人的資本経営の情報開示) compliance.

## 9) High-Risk Areas and Mitigations

1. Access control bugs exposing cross-org data.
- Mitigation: centralized authorization helper + integration tests for each role/action.

2. Webhook race conditions and duplicates.
- Mitigation: idempotency table + transactional upserts + retry-safe handlers.

3. Credit ledger drift from wallet balances.
- Mitigation: all deductions/reset operations inside DB transactions + reconciliation job.

4. Team dashboard query cost on large datasets.
- Mitigation: indexed aggregates and optional daily snapshot materialization.

5. Japanese payment method expectations.
- Mitigation: v1 uses Stripe (credit card) which covers individual and SME segments. v2 adds invoice billing (請求書払い) for enterprise. Communicate payment methods clearly on pricing page.

6. Low free-to-paid conversion in price-sensitive individual market.
- Mitigation: Free tier is genuinely useful but AI credit limit creates natural upgrade moment. Individual plan at ¥2,980 one-time has minimal price friction. Track `credit_exhausted` → `checkout_started` conversion funnel.

7. Long enterprise sales cycles.
- Mitigation: Self-serve Team plan signup enables SMEs and small teams without sales involvement. Enterprise pilot program (free 1-month) shortens evaluation cycle. Focus initial GTM on self-serve segments while building enterprise pipeline.

## 10) Immediate Build Order (If Starting This Week)

1. Phase 0 decisions and API contract freeze.
2. Phase 1 migrations (org/billing/entitlements/wallet/outputs).
3. Phase 2 RBAC refactor + shared session access.
4. Phase 3 entitlement + credit enforcement.
5. Phase 4 Stripe checkout + webhook sync.
6. Phase 6 frontend paywall and billing settings.
7. Phase 7 reviewer collaboration flow.
8. Phase 8 team dashboard MVP.
9. Phase 10 hardening and staged rollout.
10. GTM Phase A (individual launch) — runs in parallel with Phase 10.

## 11) Market Research Sources

- Yano Research Institute — Corporate Training Market 2024/2025
- IMARC Group — Japan Corporate Training Market forecast to 2034
- Yano Research — e-Learning Market 2025
- MarketsandMarkets — AI in Project Management Market
- PMI — 25M PM professionals needed by 2030
- IPA — プロジェクトマネージャ試験 statistics (2023-2024)
- PMI Japan Chapter — 48,404 PMP holders in Japan (Dec 2024)
- PMAJ — P2M certification data
- アイシンク — PM Training Selection Guide and market pricing
- 富士通ラーニングメディア — PM Simulation training pricing
- KeySession — PM Training Company Comparison
