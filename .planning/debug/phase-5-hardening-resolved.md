# Debug Session: Phase 5 Hardening & Persistence Issues

## Symptoms
- Potential data loss in offline mode if queries were GC'd before `maxAge` (24h) but after `gcTime` (30m).
- Visual latency (flicker) when updating subtasks or attaching/detaching tags due to lack of optimistic updates.
- Redundant code in `useTasks.ts` (`useCreateTag`) causing potential consistency issues.

## Root Cause Investigation
1. **Persistence Mismatch:** `src/lib/query-client.ts` had `gcTime: 30m`, while `src/main.tsx` had `maxAge: 24h`. TanStack Query requires `gcTime >= maxAge` for reliable persistence.
2. **Missing Optimistic UI:** `useUpdateSubtask`, `useDeleteSubtask`, `useCreateSubtask`, `useAttachTag`, and `useDetachTag` only used `onSuccess` invalidation, causing the UI to wait for server response.
3. **Auth Flow:** Verification of "antigravity" changes confirmed that `ProtectedRoute` and `AuthContext` now correctly handle the unconfirmed email state.

## Resolution
1. **Synchronized Cache Timing:** Updated `src/lib/query-client.ts` to use `gcTime: 24h` to match the offline storage policy.
2. **Comprehensive Optimistic UI:** Implemented `onMutate`, `onError`, and `onSettled` patterns for all subtask and tag-related hooks in `src/hooks/useTasks.ts`.
3. **Code Cleanup:** Removed the redundant `useCreateTag` from `useTasks.ts` in favor of the implementation in `useTags.ts`.
4. **Auth Alignment:** Verified and kept changes in `RegisterForm.tsx`, `LoginPage.tsx`, and `notification-watcher.tsx` to support the `/verify-email` flow.

## Verification Results
- `npm run typecheck`: PASSED.
- `npm test`: PASSED (12/12).
- Manual code review: Logic follows TanStack Query v5 best practices for optimistic updates and persistence.

## Status
**RESOLVED**
