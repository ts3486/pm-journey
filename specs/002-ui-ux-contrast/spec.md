# 002-ui-ux-contrast

## Summary
Improve overall readability and scannability across Home, Scenario, and History pages by increasing contrast, clarifying hierarchy, and making key actions more discoverable.

## Goals
- Increase perceived contrast and legibility without changing the core visual identity.
- Make primary user actions obvious at a glance (start/resume/complete).
- Improve information scanning on dense pages (Scenario + History).

## Non-Goals
- No layout overhaul or new design system.
- No changes to data model or API behavior.
- No new pages or features beyond UI/UX enhancements.

## User Experience Principles
- **Clarity first:** content hierarchy should be unmistakable on first glance.
- **Action discovery:** primary actions must be visible and consistent.
- **Scan quickly:** repeated patterns should be visually distinguishable.

## Scope
### Home
- Emphasize last session resume state when available.
- Make scenario cards easier to scan with small metadata row.
- Make “Saved” state more visible.

### Scenario
- Add session status display near header (Active/Complete/Offline).
- Keep completion CTA visible; enabled only when requirements are met.
- Improve mission list readability (visual completion indicator per item).
- Improve supplemental info separation with clearer section styling.

### History List
- Strengthen selected state visibility.
- Improve status readability (Passing/Pending) with clear pill + icon.

### History Detail
- Section headers and spacing improvements for long content blocks.
- Improve scenario info accordion contrast and affordance.

## Functional Requirements
- **FR-001:** Primary actions (start/resume/complete) are clearly visible.
- **FR-002:** Completion CTA is always visible but disabled until requirements are met.
- **FR-003:** Mission items show completion state visually (badge or left border).
- **FR-004:** History list selected item is clearly highlighted.
- **FR-005:** Scenario info accordion is visually distinct and has clear affordance.

## Visual Requirements
- Increase contrast for body text and supporting text on card surfaces.
- Add stronger borders or background tones to distinguish section blocks.
- Use consistent spacing between blocks (standard vertical rhythm).

## Acceptance Criteria
- All pages show improved contrast and legibility without breaking layout.
- Completion CTA is visible at all times on Scenario page, enabled only when valid.
- Mission items and history cards show clear state with a quick scan.
- Selected history card is unambiguous.

## Test Plan
- Manual QA on Home, Scenario, History list, History detail.
- Verify CTA states (disabled/enabled) align with progress flags.
- Check visual contrast across light backgrounds and cards.
- Ensure no regressions in layout or click targets.

