# Phase 3.9 Plan: UI and Idempotency Overhaul

## 1. Backend Idempotency Implementation
- [ ] Create `app/middleware/idempotency.py` to handle `X-Idempotency-Key` tracking and Redis caching.
- [ ] Register `IdempotencyMiddleware` in `app/main.py`.
- [ ] Update `app/config.py` if needed for Redis-specific idempotency settings.
- [ ] Verify middleware correctly ignores `GET` requests and handles errors gracefully.

## 2. Frontend Idempotency & UI Foundation
- [ ] Update `src/lib/api.ts` (Axios) to attach a UUIDv4 as `X-Idempotency-Key` to all mutating requests.
- [ ] Implement `isLoading` state management in `Button` and action-oriented components to prevent double clicks.
- [ ] Install `react-time-picker` and `react-clock` dependencies.

## 3. UI Component Rework
- [ ] Implement `Skeleton` component with shimmering effect in `src/components/ui/skeleton.tsx`.
- [ ] Implement `ConfirmationModal` component in `src/components/ui/confirmation-modal.tsx`.
- [ ] Replace custom time picker with `react-time-picker` in `NewTaskModal` and `TaskDrawer`.

## 4. Performance & Polish
- [ ] Simplify `LoadingScreen` component (reduce blur/complex SVGs, use `translateZ(0)`).
- [ ] Update global animation configs in `src/lib/animations.ts` (or equivalent) for snappier transitions.
- [ ] Add `Skeleton` loaders to:
    - `Overview` (Dashboard)
    - `AuditTrail`
    - `StatusWidgets`
    - `TasksPage` (Task Cards)
- [ ] Integrate `ConfirmationModal` into task/subtask completion toggles.

## 5. Verification
- [ ] Verify no duplicate tasks are created on rapid clicks.
- [ ] Verify confirmation modal appears for all completion actions.
- [ ] Verify time picker is stable and supports selected time formats.
- [ ] Verify loading performance on low-end device simulation.
