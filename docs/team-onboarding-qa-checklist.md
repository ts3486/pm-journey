# Team Onboarding QA Checklist

Last updated: February 14, 2026

## Goal

Validate Team onboarding end-to-end for:

- organization creation flow
- invitation acceptance flow
- onboarding error handling states

## 1) Automated Frontend Tests

Run from repository root:

```bash
cd frontend
npm test -- --run src/routes/team/TeamOnboardingPage.test.tsx src/routes/settings/BillingSettingsPage.test.tsx src/routes/pricing/PricingPage.test.tsx
```

Expected:

- All tests pass.
- `TeamOnboardingPage` tests include create-org, invite-accept, and invite error states.

## 2) Local Manual E2E Setup

1. Start PostgreSQL and ensure `backend/.env` is configured.
2. Start backend:

```bash
cd backend
cargo run
```

3. Start frontend:

```bash
cd frontend
npm run dev
```

4. Use two browser profiles (or one normal + one incognito) for two users:
- User A: org owner/admin who sends invite.
- User B: invitee.

## 3) Scenario A: Create Organization

1. Login as a new user with no organization.
2. Open `/team/onboarding`.
3. Enter organization name and submit.
4. Verify redirect to `/settings/billing`.
5. Verify Team管理 section shows:
- organization id/name
- current role is `owner`

## 4) Scenario B: Invite + Accept

1. Login as User A (owner/admin/manager).
2. Open `/settings/billing`.
3. In Team管理, create invitation for User B email.
4. Copy generated onboarding invite link.
5. Login as User B in separate session.
6. Open copied `/team/onboarding?invite=...` link.
7. Submit invite accept.
8. Verify redirect to `/settings/billing`.
9. Back as User A, refresh member list and verify User B appears as active member.

## 5) Error-State Validation

### Email mismatch

1. Create invite for Email X.
2. Login as user with different email Y.
3. Open invite link and accept.
4. Verify onboarding shows email mismatch error message.

### Expired invitation

Force expiry in DB (example):

```sql
UPDATE organization_invitations
SET expires_at = NOW() - INTERVAL '1 hour'
WHERE email = 'invitee@example.com' AND status = 'pending';
```

Then attempt acceptance and verify expired-invite messaging.

### Already used / inactive invitation

Reuse a token already accepted once, then verify inactive-invite messaging.

### Seat limit reached

1. Ensure org seat limit is lower than active+pending members.
2. Attempt invite acceptance.
3. Verify seat-limit error messaging in onboarding.

## 6) Regression Checks

After onboarding tests, verify:

- `/pricing` Team CTA works for users with org + eligible role.
- `/pricing` shows onboarding CTA for users without org.
- `/settings/billing` invite link copy button works.

