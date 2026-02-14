# Auth0 Hosted Login Branding Plan (Option 1)

Last updated: February 14, 2026  
Owner: Product + Design + Engineering  
Status: Ready to execute

## 1. Goal

Keep Auth0 Hosted Universal Login and customize it so the login/signup/reset experience matches PM Journey branding without moving to embedded/custom in-app credential forms.

## 2. Why Option 1

- Minimal engineering risk and fastest time-to-value.
- Keeps Auth0 security and feature compatibility on hosted flows.
- Avoids Classic Login regressions and long-term maintenance overhead.

## 3. Scope and Non-Goals

In scope:
- Universal Login theme customization (logo, colors, fonts, background, widget style).
- Universal Login text customization (prompt copy, button labels, helper/error text).
- Flow QA for login, signup, reset password, and logout return.
- Tenant promotion process (dev -> staging -> prod).

Out of scope:
- Building a new in-app credential form.
- Migrating to Classic Login.
- Deep page template customization with custom Liquid template (unless explicitly needed).

## 4. Preconditions

1. Universal Login is enabled in Auth0 tenant.
2. Classic "Customize Login Page" is disabled.
3. Brand assets are available (SVG logo, optional background image, color palette, font files/URLs).
4. Allowed Callback URLs / Logout URLs / Web Origins are already valid for dev/staging/prod environments.

## 5. Implementation Phases

## Phase A: Brand Spec Preparation

Tasks:
- A1. Define login brand tokens: primary/secondary colors, typography, border radius, spacing tone.
- A2. Prepare asset URLs for logo and optional background image.
- A3. Decide final UX copy tone for Japanese + English (if bilingual support is required).
- A4. Create a screenshot target set for comparison (desktop + mobile).

Exit criteria:
- A one-page style spec exists and is approved by Product/Design.

## Phase B: Configure Universal Login Theme (Dev Tenant)

Auth0 path:
- `Branding > Universal Login > Customization Options`

Tasks:
- B1. Apply color system to buttons, links, inputs, body text, header text.
- B2. Configure logo URL, logo size/position, widget alignment.
- B3. Apply border radius and input/button style.
- B4. Configure custom font URL (if used) and verify CORS/WOFF delivery.
- B5. Add optional background image and test contrast/readability.
- B6. Save and Publish theme.

Exit criteria:
- Dev tenant login/signup/reset prompts visually align with PM Journey design spec.

## Phase C: Configure Universal Login Text (Dev Tenant)

Auth0 path:
- `Branding > Universal Login > Advanced Options > Custom Text`

Tasks:
- C1. Update login prompt text (title, subtitle, CTA labels, footer links).
- C2. Update signup prompt text and legal/help text.
- C3. Update password reset and blocked-user messages for product tone.
- C4. Verify sign-up footer link text is present so signup entry remains visible.
- C5. Localize text for required languages.

Exit criteria:
- All core prompts use approved copy and no default Auth0 phrasing remains where custom copy is expected.

## Phase D: Application-Level Flow Checks (No UX Rebuild)

Repo touchpoints:
- `frontend/src/components/AuthGuard.tsx`
- `frontend/src/contexts/ApiClientContext.tsx`
- `frontend/src/main.tsx`

Tasks:
- D1. Verify `loginWithRedirect` still carries `appState.returnTo` correctly.
- D2. Verify logout returns to intended URL and branded login appears again.
- D3. Verify unauthorized API reauth redirect behavior still works.
- D4. Optional: add `screen_hint=signup` for explicit signup entry points if product wants direct signup CTA.

Exit criteria:
- No regression in auth redirects; return-to behavior unchanged.

## Phase E: QA and Accessibility Gate

Tasks:
- E1. Test matrix: login, signup, wrong password, reset password, expired session, logout.
- E2. Browser/device checks: Chrome/Safari/Firefox + mobile viewport.
- E3. Contrast/readability check for brand colors and background image.
- E4. Validate social/enterprise connection button layout if used.
- E5. Confirm no mismatch between tenant domain and expected branded page.

Exit criteria:
- QA checklist passes in dev and staging with screenshots archived.

## Phase F: Promotion and Rollout

Tasks:
- F1. Replicate approved customization to staging tenant.
- F2. Run smoke test on staging callback/logout paths.
- F3. Replicate to production tenant in low-traffic window.
- F4. Post-deploy smoke test on prod.
- F5. Document rollback values (previous theme/text snapshots).

Exit criteria:
- Production hosted login is branded and stable with no auth conversion regression.

## 6. Task Backlog (Execution Order)

1. Collect and approve visual tokens/assets.
2. Configure dev Universal Login theme.
3. Configure dev Custom Text for login/signup/reset.
4. Validate auth redirect behavior in app.
5. Execute QA matrix and capture screenshots.
6. Promote to staging and rerun QA.
7. Promote to production and run smoke checks.
8. Document final settings and rollback snapshot.

## 7. Definition of Done

- Hosted Auth0 Universal Login remains in use.
- Login/signup/reset pages match PM Journey brand system.
- Redirect/login/logout behavior remains unchanged functionally.
- Staging + production validations are completed with checklist evidence.
- Rollback instructions and final configuration notes are documented.

## 8. Risks and Mitigations

1. Risk: Text customization accidentally hides signup link.
Mitigation: Explicitly validate `footerLinkText` and signup entry during QA.

2. Risk: Font/background assets fail due to CORS or hosting issues.
Mitigation: Use stable CDN URLs and verify network loading in browser devtools.

3. Risk: Page-template-level expectations without custom domain.
Mitigation: Keep scope to no-code theme + custom text first; treat page templates as a separate tracked enhancement.

4. Risk: Environment drift across tenants.
Mitigation: Promote in order (dev -> staging -> prod) with screenshot checklist and settings log.

## 9. References

- Auth0: Customize Universal Login overview
- Auth0: Customize Universal Login Page Themes (No-code editor)
- Auth0: Customize Universal Login Text Elements
- Auth0: Universal Login Page Templates (for advanced future customization)
