---
phase: 03-task-grouping-and-due-time
reviewed: 2026-05-09T00:15:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/hooks/useApi.ts
findings:
  critical: 2
  warning: 1
  info: 1
  total: 4
status: issues_found
---

# Phase 03: Code Review Report - Task 4 (Frontend API Hook Updates)

**Reviewed:** 2026-05-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

The implementation of Task 4 successfully updates the `Task` and `Group` interfaces and adds the `useGroups` hook as requested. However, the changes introduce significant breaking defects in the frontend and a functional gap with the backend that prevents the new filtering logic from working.

## Critical Issues

### CR-01: Destructive Interface Update (Broken Build)

**File:** `src/hooks/useApi.ts:18`
**Issue:** Removing the `category` field from the `Task` interface while it is still actively used in several components (e.g., `src/components/new-task-modal.tsx`, `src/components/dashboard.tsx`) causes immediate TypeScript compilation errors.
**Fix:** Update all component references to `category` to use the new `group` structure, or keep `category` as an optional deprecated field until components are fully migrated.

### CR-02: Backend Integration Gap (Broken Filter)

**File:** `src/hooks/useApi.ts:88`
**Issue:** The `useTasks` hook has been updated to send a `group_id` query parameter to the `GET /api/v1/tasks/` endpoint. However, the current backend implementation (as verified in `app/api/routers/task.py`) does not support this parameter in the list endpoint, meaning the filter will be ignored by the server.
**Fix:** The backend `get_all_tasks` router and corresponding CRUD `get_tasks` must be updated to accept and filter by `group_id`.

## Warnings

### WR-01: Inconsistent Response Parsing

**File:** `src/hooks/useApi.ts:145`
**Issue:** Unlike `useTasks` (which handles both array and `{ items: [] }` responses), `useGroups` assumes the API will always return a raw array: `setGroups(response.data)`. This inconsistency makes the hook fragile if the backend API structure changes to a standard paginated/wrapped response.
**Fix:** Apply the same defensive parsing logic used in `useTasks`:
```typescript
const data = response.data;
setGroups(Array.isArray(data) ? data : data.items || []);
```

## Info

### IN-01: Falsy Check on group_id

**File:** `src/hooks/useApi.ts:88`
**Issue:** Using `if (group_id)` to decide whether to append the query parameter will fail if `group_id` is `0`. While database IDs usually start at 1, if `0` is used for "Uncategorized" or "No Group", the filter will not be applied.
**Fix:** Use an explicit null/undefined check:
```typescript
if (group_id !== undefined && group_id !== null) {
  params.append("group_id", group_id.toString())
}
```

---

_Reviewed: 2026-05-09_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
