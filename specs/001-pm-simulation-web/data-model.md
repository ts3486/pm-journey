# Data Model: Olivia PM Simulation Web Experience

## Entities

### Scenario
- **Fields**: `id` (string), `title` (string), `description` (string), `product` (object: name, summary, audience, problems, goals, differentiators, scope, constraints, timeline, successCriteria, uniqueEdge, techStack, coreFeatures), `mode` (enum: freeform), `kickoffPrompt` (string), `evaluationCriteria` (array of categories with `name`, `weight`, `passingScore` shared).
- **Rules**: Category weights sum to 100; passingScore default 70.
- **Relationships**: One-to-many with Sessions.

### Session
- **Fields**: `id` (string), `scenarioId` (string), `status` (enum: active/completed/evaluated), `startedAt` (datetime), `endedAt` (datetime, optional), `lastActivityAt` (datetime), `userName` (string, optional), `progressFlags` (booleans: requirements, priorities, risks, acceptance), `evaluationRequested` (bool), `storageLocation` (enum: local/api).
- **Rules**: `scenarioId` must match an existing Scenario; `lastActivityAt` updates on message save; `status` becomes evaluated only when evaluation payload present.
- **Relationships**: One-to-many with Messages and one-to-one with Evaluation.

### Message
- **Fields**: `id` (string), `sessionId` (string), `role` (enum: user/agent/system), `content` (markdown string), `createdAt` (datetime), `tags` (set: decision/assumption/risk/next_action/summary), `queuedOffline` (bool, optional).
- **Rules**: Tags are additive; `queuedOffline` true means pending sync; timestamps server-ordered when API-backed.
- **Relationships**: Belongs to Session.

### Evaluation
- **Fields**: `sessionId` (string), `overallScore` (0-100), `passing` (bool), `categories` (array of objects: `name`, `weight`, `score`, `feedback`), `summary` (string), `improvementAdvice` (string).
- **Rules**: `passing` true when `overallScore` >= passingScore; category weights mirror Scenario criteria.
- **Relationships**: Belongs to Session; referenced by HistoryItem.

### HistoryItem
- **Fields**: `sessionId` (string), `metadata` (duration, messageCount), `actions` (array of tagged Message refs), `evaluation` (Evaluation snapshot), `storageLocation` (enum: local/api).
- **Rules**: Snapshot data must align with the session state at time of save/export.
- **Relationships**: Mirrors Session/Evaluation for listing and detail views.
