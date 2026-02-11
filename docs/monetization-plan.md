# pm-journey Monetization Plan (Concrete v1)

Last updated: February 11, 2026
Owner: Product
Status: Proposed (ready for implementation planning)

## 1) Monetization Principles

- Keep free value high enough to prove product quality.
- Protect AI gross margin with explicit usage controls.
- Keep Individual simple (one-time purchase).
- Price Team on business value (seats + collaboration + reporting).

## 2) v1 Pricing Table (JPY/USD)

Currency policy:
- JPY is the billing currency for Japan.
- USD is display-only reference using `1 USD = JPY 150` (refresh quarterly).

| Plan | Billing model | Price (JPY) | Price (USD ref) | Target user |
|---|---|---:|---:|---|
| Free | No payment | ¥0 | $0 | New/curious learners |
| Individual | One-time purchase | ¥14,800 | $99 | Serious solo learners |
| Team | Subscription, per seat | ¥2,400 / seat / month (min 5 seats) | $16 / seat / month | PM teams and managers |
| Team Annual | Subscription, per seat | ¥24,000 / seat / year | $160 / seat / year | Teams with annual budgets |

Team plan minimum contract values:
- Monthly: `¥12,000/month` minimum (5 seats).
- Annual: `¥120,000/year` minimum (5 seats).

## 3) Entitlements and Usage Limits (v1)

### Free Plan

- Account creation: Enabled
- Scenario access:
  - Basic (first 3): `basic-intro-alignment`, `basic-agenda-facilitation`, `basic-schedule-share`
  - Test case (first 3): `test-login`, `test-form`, `test-file-upload`
  - All other scenarios: Locked
- AI review: `12 credits/month` (max `2/day`)
- History retention: `30 days`
- Team features (`上長コメント`, dashboard): Locked

### Individual Plan (One-time)

- Scenario access: All current and future individual scenarios unlocked
- AI review: `240 lifetime credits` included (no expiry)
- Team features (`上長コメント`, dashboard): Locked
- Billing: one-time only, no recurring charge

### Team Plan (Seat Subscription)

- Scenario access: All scenarios unlocked for all active organization members
- AI review pool: `80 credits / active seat / month` (org-shared pool)
- Team collaboration: `上長コメント` unlocked
- Team reporting:
  - MVP: member-level completion + score trend dashboard
  - Later: deeper competency analytics and custom exports
- Seat management: invite/remove members, role-based manager/member permissions

### Add-on AI Credit Packs (All Paid Plans)

| Pack | Price (JPY) | Price (USD ref) | Effective JPY/credit |
|---|---:|---:|---:|
| 30 credits | ¥1,500 | $10 | ¥50 |
| 100 credits | ¥4,500 | $30 | ¥45 |
| 250 credits | ¥9,800 | $65 | ¥39.2 |

Rules:
- Credit packs never expire.
- Free plan cannot buy packs in v1 (keeps plan boundaries simple).
- Team overage draws from purchased org packs.

## 4) Why This Structure Works

- Free supports activation with real value while keeping AI cost bounded.
- Individual one-time avoids subscription friction for solo users.
- Team subscription aligns with recurring team value and collaboration workflows.
- Credit packs prevent AI-heavy users from compressing margin.

## 5) MVP Rollout Plan (12 Weeks)

### Phase 0 (Weeks 1-2): Entitlement foundation

- Add plan model: `FREE`, `INDIVIDUAL`, `TEAM`.
- Add credit wallet model (monthly allowance + purchased credits).
- Add server-side entitlement checks for:
  - scenario access
  - AI review execution
  - team-only features
- Add analytics events:
  - `paywall_viewed`
  - `plan_selected`
  - `checkout_started`
  - `checkout_completed`
  - `scenario_locked_viewed`
  - `ai_review_credit_exhausted`

Exit criteria:
- Feature flag can switch each plan behavior on/off.

### Phase 1 (Weeks 3-5): Free + Individual launch

- Implement free scenario allowlist (exact 6 IDs above).
- Implement Individual one-time checkout.
- Implement AI credit deduction and balance UI.
- Add paywall + plan comparison UI on locked scenario and exhausted credits.

Exit criteria:
- New users can upgrade to Individual and instantly unlock all scenarios.

### Phase 2 (Weeks 6-8): Team beta

- Implement organization entity, membership, and roles.
- Implement Team subscription with seat quantity.
- Implement `上長コメント` visibility/permissions.
- Release dashboard MVP (completion + average score trend per member).
- Run with 3-5 pilot organizations.

Exit criteria:
- Team admin can invite members and view team progress.

### Phase 3 (Weeks 9-12): Pricing and conversion optimization

- A/B test paywall trigger timing:
  - after first locked click vs after second locked click
- A/B test Individual price point:
  - `¥12,800` vs `¥14,800`
- A/B test Team seat price:
  - `¥2,200` vs `¥2,400`
- Tune AI credit allowances based on margin and satisfaction.

Exit criteria:
- Confirm launch prices for general availability.

## 6) Success Metrics and Guardrails

Primary metrics:
- Free to Individual conversion (30-day): target `>= 4%`
- Team trial to paid conversion: target `>= 25%`
- Individual refund rate: target `< 3%`
- Team net seat expansion at 90 days: target positive

Unit economics guardrails:
- AI cost per review should stay below `¥12`.
- Gross margin target:
  - Individual blended: `>= 65%`
  - Team blended: `>= 70%`

## 7) Risks and Mitigations

- Risk: Individual one-time users consume too many reviews.
  - Mitigation: lifetime included credits + paid packs.
- Risk: Team buyers wait for full analytics before purchasing.
  - Mitigation: sell current value (`上長コメント` + completion/score trend), roadmap deeper analytics.
- Risk: Free users churn before paywall.
  - Mitigation: keep first 6 scenarios high quality and show progress gain after each completion.

## 8) Open Decisions (Finalize Before Build Start)

1. Team trial policy: `14 days` or `30 days`?
2. Should free users be allowed to buy small credit packs in v1?
3. Do we include future CHALLENGE scenarios in Individual one-time without exceptions?

## 9) Delivery Plan Reference

- Detailed engineering execution plan: `docs/monetization-implementation-plan.md`
