# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## Constitution Check *(must be addressed in this spec)*

- Default offline-first operation with localStorage/IndexedDB, autosave per message/evaluation, and evaluation disabled offline unless API is available over HTTPS.
- Independent, prioritized user stories that can ship/test in isolation (Home/Scenario/History slices).
- Evaluation integrity: tagging of decisions/risks/assumptions/next actions, progress flags, history/export paths, and safe reset/clear behavior.
- Accessibility/responsiveness/bilingual UI: WCAG AA, responsive layouts (desktop two-column, stacked mobile), Japanese-first scenario content with bilingual chrome, no Slack/command artifacts.
- Contract-driven delivery with observability and tests: OpenAPI/utoipa alignment, lifecycle logging hooks, and Playwright/Vitest/cargo coverage for affected surfaces; performance targets (load <3s on 4G, evaluation <10s).

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when offline during messaging/evaluation or when storage is near capacity?
- How does system handle evaluation failure/retry, session reset/clear with export, or concurrent updates (if API-enabled)?

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST default to client-side persistence (localStorage/IndexedDB), autosave after each user/agent message and evaluation, and queue offline sends while disabling evaluation until online.
- **FR-002**: System MUST keep user stories independent and testable (Home/Scenario/History or equivalent slices) with acceptance criteria and demo paths per story.
- **FR-003**: UI MUST meet WCAG AA, be responsive (desktop two-column, stacked mobile), avoid Slack/command artifacts, and present Japanese-first content with bilingual chrome/tooltips where feasible.
- **FR-004**: System MUST tag and persist decisions/risks/assumptions/next actions, maintain progress flags, and support history review/export with safe reset/clear confirmations.
- **FR-005**: API/clients MUST adhere to OpenAPI/utoipa contracts, log session lifecycle/evaluation/export events, meet performance targets (load <3s on 4G; evaluation <10s), and use HTTPS when remote.

*Example of marking unclear requirements:*

- **FR-006**: Observability hooks for [NEEDS CLARIFICATION: which events? start/resume/evaluate/export?]
- **FR-007**: Data retention/archival rules for [NEEDS CLARIFICATION: how long to keep local/API data?]

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Performance metric, e.g., "Initial load <3s on 4G; evaluation results <10s with guidance when slower"]
- **SC-002**: [Resilience metric, e.g., "Offline queue preserves 100% of messages; evaluation remains disabled until online"]
- **SC-003**: [Accessibility/UX metric, e.g., "WCAG AA audit passes for focus/ARIA/contrast; mobile layout avoids horizontal scroll"]
- **SC-004**: [Data integrity metric, e.g., "100% of decisions/risks/assumptions/next actions persisted to history/export with timestamps"]
