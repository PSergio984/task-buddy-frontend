# Research Phase 05: Real-time Sync & Offline Mode

## 1. Sync & Offline Strategy (TanStack Query Persistence)
- **Standard Stack:** Use `@tanstack/react-query-persist-client` with `idb-keyval` to wrap IndexedDB.
- **Implementation:** Use `experimental_createPersister` (v5 standard) for granular, per-query persistence. This avoids large blob writes and improves performance.
- **Key Configuration:** Ensure `gcTime` (formerly `cacheTime`) is at least as long as the persister's `maxAge`. Enable `buster` for cache invalidation during schema changes.
- **Don't Hand-Roll:** Use the official TanStack Query persistence plugin rather than manual `useEffect` + `localStorage/IndexedDB` sync.

## 2. Optimistic UI Hooks
The following hooks in `src/hooks/useTasks.ts` and `src/hooks/useProjects.ts` require (or need refinement of) optimistic updates:
- **Tasks:** `useCreateTask` (add to list), `useUpdateTask` (modify item), `useDeleteTask` (remove from list).
- **Subtasks:** `useCreateSubtask`, `useUpdateSubtask`, `useDeleteSubtask`, `useReorderSubtasks`.
- **Projects:** `useCreateProject`, `useUpdateProject`, `useDeleteProject`, `useReorderProjects` (already has basic logic).

## 3. Authentication & Redirection Hardening
- **Backend Error Mapping:** The backend returns `401 Unauthorized` with `detail: "Email not confirmed"` when a user attempts to log in or access `/me` with an unverified account.
- **Detection Logic:** Update `getAuthErrorMessage` in `src/lib/auth.ts` to explicitly detect this string or use a specific error code if available.
- **Redirection:** `ProtectedRoute.tsx` must wait for `loading === false` from `AuthContext`. If `user` is present but `!user.confirmed` (or if the server returns the confirmation error), redirect to `/verify-email`.

## 4. Global Dirty Checks
- **NewTaskModal:** Add an `isDirty` state comparing current inputs (`title`, `description`, `projectId`, etc.) to their initial empty values. Disable the "Create Task" button if not dirty or if the title is empty.
- **TaskDetailDrawer:** The drawer already utilizes `useTaskDrawerState` which calculates `hasChanges`. The `ActionFooter` uses this for the "Update" button, but "Discard" logic and `AlertDialog` should be strictly synced with this state.

## 5. Audit Trail Refinement
- **Lifecycle Events:** The backend emits `create`, `update`, `delete`, `login`, and `logout`. 
- **Filtering:** Update `isExcluded` in `src/lib/audit-trail-helpers.tsx` to ensure `login` and `logout` (and variations like `user_login`) are strictly filtered out of the user-facing timeline.
- **Bug Fix:** Add `import { Skeleton } from "@/components/ui/skeleton"` to `src/components/audit-trail.tsx` to resolve the `ReferenceError`.

## 6. Project Constraints (from CONTEXT.md)
- **Sync:** Last-Write-Wins strategy.
- **Scope:** Audit logs remain online-only (no local persistence).
- **Forbidden:** No Playwright E2E tests for this phase.
- **Success Criteria:** `npm run lint` and `npm run typecheck` must pass.

## Open Questions / Risks (RESOLVED)
- **Offline Writes (RESOLVED):** While reads are handled by persistence, offline writes (mutations) in this phase will rely on TanStack Query's `onMutate` optimistic UI updates. A full persistent offline mutation queue is deferred.
- **RefreshUser Loop (RESOLVED):** `AuthContext` will be updated to skip `refreshUser` if `navigator.onLine` is false or if the request returns a network error, preventing redirection loops during offline transitions.
