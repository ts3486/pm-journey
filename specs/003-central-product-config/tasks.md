# 003-central-product-config - Implementation Tasks

## Phase 1: Backend Foundation

- [ ] **T-001**: Create database migration for `product_config` table
- [ ] **T-002**: Create `ProductConfig` model struct with serde/sqlx derives
- [ ] **T-003**: Define default product constant (copy from frontend `sharedProduct`)
- [ ] **T-004**: Implement `get_product_config` handler (return custom or default)
- [ ] **T-005**: Implement `update_product_config` handler (upsert logic)
- [ ] **T-006**: Implement `reset_product_config` handler (delete + return default)
- [ ] **T-007**: Add routes to Axum router (`/api/product-config`)
- [ ] **T-008**: Add utoipa OpenAPI annotations
- [ ] **T-009**: Write backend unit tests
- [ ] **T-010**: Write backend integration tests

## Phase 2: Frontend API Layer

- [ ] **T-011**: Create TypeScript types for ProductConfig
- [ ] **T-012**: Create API client functions in `services/`
- [ ] **T-013**: Create TanStack Query hooks (`useProductConfig`, `useUpdateProductConfig`, `useResetProductConfig`)
- [ ] **T-014**: Add Zod validation schema for product config form

## Phase 3: Settings UI

- [ ] **T-015**: Create Settings page layout at `app/settings/page.tsx`
- [ ] **T-016**: Create ProductConfigForm component with all fields
- [ ] **T-017**: Implement form submission with mutation
- [ ] **T-018**: Implement "Reset to Default" with confirmation dialog
- [ ] **T-019**: Add success/error toast notifications
- [ ] **T-020**: Add Settings link to header navigation

## Phase 4: Integration

- [ ] **T-021**: Update Scenario page to fetch product from API (not from scenario object)
- [ ] **T-022**: Update ScenarioCreateForm to remove product fields section
- [ ] **T-023**: Add info box in ScenarioCreateForm linking to Settings
- [ ] **T-024**: Update custom scenario save logic (exclude product field)

## Phase 5: Cleanup & Testing

- [ ] **T-025**: Remove/deprecate `product` field from Scenario type
- [ ] **T-026**: Remove `sharedProduct` from `scenarios.ts` (after API integration complete)
- [ ] **T-027**: Write frontend component tests
- [ ] **T-028**: Write E2E tests for settings flow
- [ ] **T-029**: Manual QA across all scenarios

## Dependencies

```
T-001 → T-002 → T-003 → T-004, T-005, T-006 → T-007 → T-008
                                                    ↓
T-011 → T-012 → T-013 → T-014 → T-015 → T-016 → T-017 → T-018 → T-019 → T-020
                          ↓
                        T-021 → T-022 → T-023 → T-024 → T-025 → T-026
```

## Notes

- Phase 1 can be developed independently and tested via API
- Phase 2-3 can proceed once backend endpoints are stable
- Phase 4 requires both backend and frontend to be complete
- Keep `sharedProduct` as fallback during transition until API is fully integrated
