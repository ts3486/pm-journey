# pm-journey Monetization Plan (Ultra-Simple v1)

Last updated: February 13, 2026
Owner: Product
Status: Active implementation scope

## 1) Strategy

- Ship the fastest stable path: `FREE` and `INDIVIDUAL` only.
- Remove app-level credit complexity in v1 (no wallet/ledger/packs in product behavior).
- Use daily fair-use caps for AI usage on all active plans.
- Keep `TEAM` in "coming soon" mode behind feature flag until collaboration and billing are complete.

## 2) Plan Lineup (v1)

| Plan | Status | Price | AI policy | Scenario access |
|---|---|---:|---|---|
| Free | Launch | ¥0 | Daily fair-use cap | Free allowlist only |
| Individual | Launch | ¥1,280 / month | Daily fair-use cap (higher than Free) | All scenarios |
| Team | Deferred (flagged off) | ¥3,000 / month (target) | Daily fair-use cap (team threshold) | Planned for later release |

## 3) What Is Explicitly Out of Scope for This Ship

- Credit packs and credit purchase flow
- App-level credit wallet/ledger runtime behavior
- Monthly credit reset jobs
- Credit reconciliation dashboards
- Seat-scaled fair-use logic
- Team billing and team dashboard

## 4) Usage Enforcement Model (v1)

- Server-side only (authoritative).
- Enforce daily fair-use on:
  - AI chat reply generation
  - Session evaluation generation
- Keep deterministic error code:
  - `FAIR_USE_LIMIT_REACHED`

## 5) Feature Flag Policy

- `FF_ENTITLEMENT_ENFORCEMENT_ENABLED=true` in production.
- `FF_TEAM_FEATURES_ENABLED=false` for ultra-simple launch.
- When team workflows are ready:
  - turn `FF_TEAM_FEATURES_ENABLED=true`
  - re-enable team plan behavior in UX and billing.

## 6) Pricing Notes

- Individual stays below `¥1,500` as requested.
- Team target is aligned to `~¥3,000/month` for the next release wave.
- No annual pricing in ultra-simple v1.

## 7) Next Expansion (post-launch)

1. Enable Team plan end-to-end (org UX + billing + collaboration dashboard).
2. Add Stripe checkout and webhook lifecycle.
3. Add invoice path for enterprise pilots.
4. Add analytics funnel for conversion and fair-use tuning.
