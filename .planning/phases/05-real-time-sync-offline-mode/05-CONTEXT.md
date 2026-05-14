# Phase 5: Real-time Sync, Offline Mode, & UX Hardening - Context

**Status:** Ready for research/planning
**Phase:** 05
**Domain:** Reliability, Consistency, and Polish

<domain>
## Phase Boundary
This phase transitions Task Buddy from a purely online-dependent application to a resilient, offline-capable productivity tool. It focuses on real-time synchronization, persistent offline storage, and resolving critical UX frictions related to authentication loops, semantic feedback (toasts), and historical transparency (audit logs). It also includes surgical fixes for UI bugs and redundant save interactions.
</domain>

<decisions>
## Implementation Decisions

### 1. Sync & Offline Strategy
- **D-01: Conflict Resolution (Last-Write-Wins):** Simple timestamp-based resolution where the most recent update reaching the server persists.
- **D-02: Core Offline Cache:** Persist `Tasks`, `Projects`, and `Tags` locally using TanStack Query's persistent cache (IndexedDB). Audit logs remain online-only to minimize local storage bloat.
- **D-03: Optimistic UI:** All task mutations (Create, Update, Delete, Toggle) must reflect in the UI immediately while the sync happens in the background.

### 2. Authentication & Redirection Hardening
- **D-04: Strict Verification Flow:** `AuthContext` must confirm session validity via `refreshUser` on mount before allowing access to `ProtectedRoute`. This prevents the "Dashboard -> Login" redirection loop caused by stale local storage tokens.
- **D-05: Dedicated Verification Landing:** If a user logs in with an unconfirmed email, redirect them to a dedicated `/verify-email` page instead of displaying "Invalid Credentials".
- **D-06: Semantic Error Parsing:** Update `getAuthErrorMessage` to explicitly detect unconfirmed email status (Backend status codes/details) and provide accurate feedback.

### 3. Semantic Feedback & History Refinement
- **D-07: Contextual Toasts:** Success toasts for task/project/tag creation must include the item name (e.g., `Task "Clean Room" created`).
- **D-08: Task Lifecycle Audit Logs:** The Audit Trail will focus strictly on workspace events: `Created`, `Updated` (with diffs), and `Completed`.
- **D-09: Filtered Activity:** `LOGIN` and `LOGOUT` events are strictly excluded from the user-facing Audit Trail to improve signal-to-noise ratio.

### 4. UI Interactivity & Bug Fixes
- **D-10: Global Dirty Checks:** Disable the "Save" or "Update" buttons in the Task Drawer and all Create/Edit modals if the current state matches the initial state (no changes detected).
- **D-11: Skeleton Component Fix:** Fix the `ReferenceError: Skeleton is not defined` in `audit-trail.tsx` by adding the missing `@/components/ui/skeleton` import.

## Operational Constraints
- **Testing:** Do **NOT** write any Playwright E2E tests for this phase.
- **Verification:** `npm run lint` and `npm run typecheck` must pass before completion.
- **Performance:** Ensure IndexedDB writes do not block the main thread.
</decisions>

<canonical_refs>
## Canonical References
- `src/contexts/AuthContext.tsx` — Auth state and error handling logic.
- `src/contexts/ProtectedRoute.tsx` — Navigation guards and redirection.
- `src/components/audit-trail.tsx` — Historical event rendering.
- `src/lib/audit-trail-helpers.tsx` — Action description and filtering logic.
- `src/lib/api.ts` — Idempotency and Axios configuration.
</canonical_refs>

<code_context>
## Codebase Insights

### Redirection Loop Fix
The current `App.tsx` redirects to `/dashboard` based on a stale `user` object in `localStorage`. `ProtectedRoute` must wait for `loading` to be false and `AuthContext` must ensure `user` is fully verified.

### Audit Trail Filter
Ensure `isExcluded` in `audit-trail-helpers.tsx` is properly called in the `useAuditTrail` hook or the filtering logic in `AuditTrail.tsx`.
</code_context>
