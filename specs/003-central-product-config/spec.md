# 003-central-product-config

**Feature Branch**: `003-central-product-config`
**Created**: 2026-01-31
**Status**: Draft

## Summary

Introduce a single, user-configurable product/project that all scenarios (built-in and custom) reference. The product configuration is managed via a Settings screen and stored in the backend database, replacing the current hardcoded `sharedProduct` in `frontend/src/config/scenarios.ts`.

## Goals

- Provide a single source of truth for product/project information across all scenarios.
- Allow users to customize the product context to match their real-world project.
- Persist product configuration in the backend database for multi-device sync.
- Simplify scenario definitions by removing per-scenario product duplication.

## Non-Goals

- Multiple product configurations (only one global product is supported).
- Per-scenario product overrides (all scenarios use the same global product).
- Import/export of product configurations (may be added later).
- Product versioning or history.

## Current State

All scenarios currently share a single `sharedProduct` object hardcoded in `frontend/src/config/scenarios.ts`:
- Product: "在庫最適化ダッシュボード" (Inventory Optimization Dashboard)
- Fields: name, summary, audience, problems[], goals[], differentiators[], scope[], constraints[], timeline, successCriteria[], uniqueEdge, techStack[], coreFeatures[]

This object is referenced by all built-in scenarios but cannot be edited by users.

## Requirements

### Functional Requirements

- **FR-001**: Provide a Settings page accessible from main navigation with a "Product Configuration" section.
- **FR-002**: Settings page must display a form to edit all product fields (name, summary, audience, problems, goals, differentiators, scope, constraints, timeline, successCriteria, uniqueEdge, techStack, coreFeatures).
- **FR-003**: Product configuration must be stored in the backend database and retrieved via API.
- **FR-004**: Provide a "Reset to Default" action that restores the built-in default product.
- **FR-005**: All scenarios (built-in and custom) must fetch and display product info from the central configuration, not from hardcoded scenario data.
- **FR-006**: ScenarioCreateForm must no longer include product fields; instead show a read-only preview of the global product with a link to Settings.
- **FR-007**: If no custom product exists in the database, the system must return the default product (current "在庫最適化ダッシュボード").
- **FR-008**: Product changes must take effect immediately for new sessions; existing sessions retain their original product context.

### Non-Functional Requirements

- **NFR-001**: Product fetch must complete within 500ms under normal conditions.
- **NFR-002**: Form validation must match existing Zod schemas for product fields.
- **NFR-003**: Settings page must be mobile-responsive.

## Key Entities

### ProductConfig (new)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| name | string | Yes | Product name |
| summary | string | Yes | High-level product overview |
| audience | string | Yes | Target users |
| problems | string[] | Yes | Business problems solved |
| goals | string[] | Yes | Product goals |
| differentiators | string[] | No | Unique selling points |
| scope | string[] | No | Features/components in scope |
| constraints | string[] | No | Limitations/requirements |
| timeline | string | No | Project timeline |
| successCriteria | string[] | No | Success metrics |
| uniqueEdge | string | No | Unique angle |
| techStack | string[] | No | Technology stack |
| coreFeatures | string[] | No | Core features |
| createdAt | timestamp | Yes | Creation timestamp |
| updatedAt | timestamp | Yes | Last update timestamp |

## API Design

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/product-config` | Get current product config (returns default if none exists) |
| `PUT` | `/api/product-config` | Create or update product config |
| `POST` | `/api/product-config/reset` | Reset to default product |

### GET /api/product-config

**Response 200**:
```json
{
  "id": "uuid",
  "name": "在庫最適化ダッシュボード",
  "summary": "...",
  "audience": "...",
  "problems": ["..."],
  "goals": ["..."],
  "differentiators": ["..."],
  "scope": ["..."],
  "constraints": ["..."],
  "timeline": "...",
  "successCriteria": ["..."],
  "uniqueEdge": "...",
  "techStack": ["..."],
  "coreFeatures": ["..."],
  "isDefault": true,
  "createdAt": "2026-01-31T00:00:00Z",
  "updatedAt": "2026-01-31T00:00:00Z"
}
```

### PUT /api/product-config

**Request Body**: Same as response (without id, isDefault, createdAt, updatedAt)

**Response 200**: Updated product config

### POST /api/product-config/reset

**Response 200**: Default product config (deletes custom config if exists)

## User Interface

### Settings Page (`/settings`)

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Product Configuration                                       │
│  ──────────────────────                                      │
│  Configure the product/project context used across all       │
│  scenarios.                                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Product Name *                                          ││
│  │ [在庫最適化ダッシュボード                              ]││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Summary *                                               ││
│  │ [                                                       ]││
│  │ [                                                       ]││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Target Audience *                                       ││
│  │ [                                                       ]││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ... (remaining fields)                                      │
│                                                              │
│  ┌────────────────┐  ┌─────────────────────┐                │
│  │  Save Changes  │  │  Reset to Default   │                │
│  └────────────────┘  └─────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Updates

- Add "Settings" link to header navigation (gear icon)
- Settings accessible from user menu or main nav

### Scenario Page Changes

- Fetch product from `/api/product-config` instead of `scenario.product`
- Display in existing sidebar location (no UI changes needed)

### ScenarioCreateForm Changes

- Remove product fields section entirely
- Add info box: "All scenarios use the global product configuration. [Edit in Settings →]"

## Database Schema

### Migration: `YYYYMMDD_product_config.sql`

```sql
CREATE TABLE product_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  summary TEXT NOT NULL,
  audience TEXT NOT NULL,
  problems JSONB NOT NULL DEFAULT '[]',
  goals JSONB NOT NULL DEFAULT '[]',
  differentiators JSONB DEFAULT '[]',
  scope JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '[]',
  timeline TEXT,
  success_criteria JSONB DEFAULT '[]',
  unique_edge TEXT,
  tech_stack JSONB DEFAULT '[]',
  core_features JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one row exists
CREATE UNIQUE INDEX product_config_singleton ON product_config ((true));
```

## Implementation Tasks

### Backend (Rust/Axum)

1. Add database migration for `product_config` table
2. Create `ProductConfig` model in `backend/src/models/`
3. Create handlers in `backend/src/features/product_config/`
   - `get_product_config` - returns custom or default
   - `update_product_config` - upsert
   - `reset_product_config` - delete custom, return default
4. Add routes to router
5. Add OpenAPI documentation via utoipa
6. Write unit and integration tests

### Frontend (Next.js/React)

1. Create Settings page at `frontend/app/settings/page.tsx`
2. Create ProductConfigForm component
3. Add TanStack Query hooks for product config
   - `useProductConfig` - fetch
   - `useUpdateProductConfig` - mutation
   - `useResetProductConfig` - mutation
4. Update Scenario page to fetch product from API
5. Update ScenarioCreateForm to remove product fields
6. Add Settings link to navigation
7. Add Zod schema for product config form validation
8. Write component tests

### Data Migration

1. Define default product in backend (copy from current `sharedProduct`)
2. Remove `sharedProduct` from `frontend/src/config/scenarios.ts`
3. Remove `product` field from scenario type (or mark as deprecated)

## Acceptance Criteria

- [ ] Settings page is accessible from main navigation
- [ ] User can edit all product fields and save changes
- [ ] "Reset to Default" restores the original product configuration
- [ ] All scenarios display product info from the central configuration
- [ ] ScenarioCreateForm no longer shows product fields
- [ ] Product changes apply immediately to new sessions
- [ ] API returns default product when no custom configuration exists
- [ ] Form validation prevents saving invalid data

## Test Plan

### Backend Tests

- GET returns default product when no custom config exists
- GET returns custom product when configured
- PUT creates new config when none exists
- PUT updates existing config
- POST /reset deletes custom config and returns default
- Validation rejects invalid data

### Frontend Tests

- Settings page renders product form
- Form displays current product values
- Save button triggers mutation and shows success
- Reset button triggers confirmation and reset
- Scenario page fetches and displays product from API
- ScenarioCreateForm shows product info box instead of fields

### E2E Tests

- User navigates to Settings, edits product, saves
- User resets product to default
- User starts scenario and sees updated product info
