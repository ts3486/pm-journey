# Data Model: Olivia PM Simulation Web Experience

## Entities

### Scenario
- **Fields**: `id` (string), `title` (string), `discipline` (enum: BASIC | CHALLENGE), `description` (string), `product` (object: name, summary, audience, problems, goals, differentiators, scope, constraints, timeline, successCriteria, uniqueEdge, techStack, coreFeatures), `mode` (enum: freeform | guided), `kickoffPrompt` (string), `evaluationCriteria` (array of categories with `name`, `weight`, `passingScore` shared), `missions` (array of Mission), `supplementalInfo` (markdown/string for side info).
- **Rules**: Category weights sum to 100; passingScore default 70; discipline drives agent profile selection and evaluation behavior; missions are ordered and shown on Scenario page.
- **Relationships**: One-to-many with Sessions; embeds Missions for UI.

### HomeScenarioCatalog (UI grouping)
- **Fields**: `categories` (array of { `id`, `title`, `subcategories` }), `subcategories` (array of { `id`, `title`, `scenarios` (Scenario summary: id, title, description, discipline) }).
- **Rules**: Large categories are `PMアシスタント` and `PM`; each subcategory must contain 2+ scenarios; category/subcategory order defines Home layout; catalog is local for offline-first rendering and maps to Scenario IDs for session creation/resume.
- **Relationships**: Drives available options for Session creation; Scenario IDs remain the source of truth for history and resume.

### Mission
- **Fields**: `id` (string), `title` (string), `description` (string, optional), `order` (number).
- **Rules**: Mission IDs are stable per scenario; completion status is tracked per session.
- **Relationships**: Embedded in Scenario; referenced by Session missionStatus.

### Session
- **Fields**: `id` (string), `scenarioId` (string), `scenarioDiscipline` (BASIC | CHALLENGE), `status` (enum: active/completed/evaluated), `startedAt` (datetime), `endedAt` (datetime, optional), `lastActivityAt` (datetime), `userName` (string, optional), `progressFlags` (booleans: requirements, priorities, risks, acceptance), `missionStatus` (array of { missionId, completedAt? }), `evaluationRequested` (bool), `storageLocation` (enum: local/api).
- **Rules**: `scenarioId` must match an existing Scenario; `lastActivityAt` updates on message save; `status` becomes evaluated only when evaluation payload present; auto-eval may trigger when all missions complete and online.
- **Relationships**: One-to-many with Messages and one-to-one with Evaluation; missionStatus references Missions.

### Message
- **Fields**: `id` (string), `sessionId` (string), `role` (enum: user/agent/system), `content` (markdown string), `createdAt` (datetime), `tags` (set: decision/assumption/risk/next_action/summary), `queuedOffline` (bool, optional).
- **Rules**: Tags are additive; `queuedOffline` true means pending sync; timestamps server-ordered when API-backed.
- **Relationships**: Belongs to Session.

### Evaluation
- **Fields**: `sessionId` (string), `overallScore` (0-100), `passing` (bool), `categories` (array of objects: `name`, `weight`, `score`, `feedback`), `summary` (string), `improvementAdvice` (string).
- **Rules**: `passing` true when `overallScore` >= passingScore; category weights mirror Scenario criteria.
- **Relationships**: Belongs to Session; referenced by HistoryItem.

### HistoryItem
- **Fields**: `sessionId` (string), `scenarioId` (string), `scenarioDiscipline` (BASIC | CHALLENGE), `metadata` (duration, messageCount), `actions` (array of tagged Message refs), `evaluation` (Evaluation snapshot), `storageLocation` (enum: local/api).
- **Rules**: Snapshot data must align with the session state at time of save/export.
- **Relationships**: Mirrors Session/Evaluation for listing and detail views.

### ManagerComment
- **Fields**: `id` (string), `sessionId` (string), `authorName` (string, optional), `content` (string), `createdAt` (datetime).
- **Rules**: Optional author for local/anonymous mode; if API-authenticated, author should match user identity.
- **Relationships**: Belongs to Session; shown on history detail.
