# pm-journey Monetization Plan

Last updated: February 8, 2026
Owner: Product
Status: Draft (ready for validation)

## 1) Objective

Build a monetization model that:

- Keeps first-session value high for PM learners
- Covers AI inference + infrastructure costs
- Converts engaged users into paid plans
- Expands into team/coaching revenue without breaking the current product UX

## 2) Product Context (Current)

pm-journey already has strong monetizable building blocks:

- Scenario-based PM practice (BASIC + CHALLENGE flows)
- Evaluation with category scores and improvement advice
- Session history, filtering, and export
- Optional API-backed mode for multi-device/team use

These support both B2C (individual PM learners) and B2B (team training/coaching).

## 3) Target Customers and Positioning

### Primary (now): Individual PM learners

- Job seekers preparing for PM interviews
- Junior/mid PMs improving communication and decision quality

Positioning: "Practice realistic PM conversations and get actionable scoring feedback."

### Secondary (next): Team leads / PM managers

- Managers who want repeatable PM communication training
- Internal L&D teams

Positioning: "Run structured PM drills and track improvement across the team."

## 4) Pricing and Packaging Strategy

Use a hybrid model: freemium + subscription + usage-based add-ons + team seats.

### Free Plan

- Limited scenario runs per month (example: 5)
- Limited advanced evaluations per month (example: 3)
- Core history access
- Goal: activation + trust before paywall

### Pro Plan (Individual)

- Full scenario library (BASIC + CHALLENGE + new releases)
- Unlimited history + advanced analytics
- Priority evaluation queue / richer feedback depth
- Export templates for portfolio/interview review
- Price hypothesis:
  - Monthly: USD 19-29
  - Annual: USD 190-290 (about 2 months free equivalent)

### Credit Packs (Add-on)

- One-time purchase for extra premium evaluations
- For free users and Pro users with occasional spikes
- Price hypothesis:
  - 10 credits: USD 9-15
  - 25 credits: USD 19-29

### Team Plan (B2B)

- Shared dashboard, seat management, progress rollups
- Reviewer/manager view + session QA workflows
- Centralized billing
- Price hypothesis:
  - USD 15-30 per seat/month
  - Minimum 5 seats

## 5) Conversion Design

### Key Trigger Points

- Allow one complete "wow" session for new users (full feedback visible)
- Show paywall after clear value signal:
  - User completed 2+ scenarios, or
  - User revisits history/evaluation multiple times

### Paywall Messaging

Lead with outcomes, not features:

- "Improve PM interview readiness with guided score improvement."
- "Track your decision quality trend across sessions."

## 6) Retention Strategy

- Weekly progress summary (score trend + weakest category + next recommended scenario)
- Scenario recommendations based on prior weak categories
- Streaks tied to skill consistency (not just daily login)
- Milestones (e.g., 3 passed CHALLENGE scenarios) with shareable artifacts

## 7) 90-Day Execution Plan

### Days 1-30: Launch paid foundation

- Ship Free + Pro monthly/annual
- Add usage counters and entitlement checks
- Add billing-ready paywall copy and plan comparison UI
- Instrument funnel analytics

### Days 31-60: Improve conversion and margins

- A/B test price points (19 vs 24 vs 29)
- A/B test paywall trigger timing
- Launch credit packs
- Tune evaluation depth by tier to protect AI margins

### Days 61-90: Start team revenue

- Pilot team plan with 3-5 design partners
- Add team progress dashboard MVP
- Define sales collateral and onboarding motion

## 8) Metrics (North Star + Guardrails)

### Core Monetization Metrics

- Activation rate: visitor -> first completed scenario
- Free-to-paid conversion rate (7-day and 30-day)
- ARPPU and MRR growth
- 30/60/90-day paid retention
- Team pilot conversion and seat expansion

### Unit Economics Guardrails

- AI cost per evaluated session
- Gross margin by plan
- Credit-pack usage concentration (to detect abuse or underpricing)

## 9) Implementation Notes for Current Codebase

Short-term implementation sequence:

1. Add plan entitlements in frontend and backend (scenario/evaluation limits).
2. Add billing state to user profile/session metadata.
3. Add analytics events for funnel:
   - `paywall_viewed`
   - `plan_selected`
   - `checkout_started`
   - `checkout_completed`
   - `evaluation_limit_hit`
4. Add simple feature flags for pricing and paywall experiments.

## 10) Risks and Mitigations

- Risk: Too strict free limits reduce activation.
  - Mitigation: Guarantee at least one complete high-quality session.
- Risk: High inference usage erodes margin.
  - Mitigation: Usage caps + credit packs + response depth controls by tier.
- Risk: Team plan launched too early.
  - Mitigation: Start with design partners before broad rollout.

## 11) Open Questions to Finalize Before Launch

1. Which segment is priority for next 2 quarters: B2C only or B2C + early B2B?
2. What is acceptable gross margin target per paid user?
3. Which billing stack will be used first (for subscriptions + one-time credits)?
4. Should annual plan be launched immediately or after monthly proves conversion?
5. Do we gate by scenario count, evaluation count, or both?
