---
phase: 03-task-grouping-and-due-time
reviewed: 2026-05-09T00:30:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/components/new-task-modal.tsx
  - src/components/task-card.tsx
  - src/components/sidebar.tsx
  - src/components/layout/main-layout.tsx
findings:
  critical: 1
  warning: 2
  info: 2
  total: 5
status: issues_found
---

# Phase 03: Code Review Report - Task 5 (Task Grouping & Due Time)

**Reviewed:** 2026-05-09
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

The implementation successfully introduces task grouping and due time management, with a high-quality UI consistent with the project's modern aesthetic. However, a critical logic flaw was discovered in the state management of filters that effectively breaks the dashboard view when categories or groups are selected. There are also several minor quality issues related to dead code and type safety.

## Critical Issues

### CR-01: Filter State Collision (Broken Dashboard View)

**File:** `src/components/layout/main-layout.tsx`, `src/components/dashboard.tsx`
**Issue:** The `activeFilter` state is overloaded and shared between the `Sidebar` (Categories/Groups) and the `Dashboard` (Status: All/Pending/Completed). This causes two major failures:
1. **Broken Rendering:** When a Group or Category is selected in the Sidebar (e.g., `group:1` or `work`), the `Dashboard` tabs attempt to match this value against their allowed values (`all`, `pending`, `completed`). Since it doesn't match, the `TabsContent` fails to render, leaving the task list empty/hidden.
2. **Mutual Exclusivity:** Selecting a status tab in the Dashboard overwrites the category/group filter from the Sidebar, making it impossible to filter by both (e.g., "Pending tasks in Work group").

**Fix:** Separate the filter states in `MainLayout`. Maintain a `statusFilter` and a `sidebarFilter` (Category/Group). Update `useTasks` to accept both, and pass both down via the `Outlet` context.

```typescript
// src/components/layout/main-layout.tsx
const [statusFilter, setStatusFilter] = useState("all");
const [sidebarFilter, setSidebarFilter] = useState("all");

// Update useTasks call to use both
const { tasks } = useTasks(
  sidebarFilter === "all" ? statusFilter : sidebarFilter, 
  isGroup ? groupId : undefined
);
```

## Warnings

### WR-01: Unused Imports (Linting/Dead Code)

**Files:** `src/components/sidebar.tsx`, `src/components/task-card.tsx`
**Issue:** Several imported components and icons are not used in the implementation, increasing bundle size and cluttering the code.
- `src/components/sidebar.tsx`: `user`, `LogOut`, `Settings`, `ChevronLeft`, `ChevronRight`, `AnimatePresence`.
- `src/components/task-card.tsx`: `Layers`.
**Fix:** Remove unused imports to maintain clean code standards.

### WR-02: Type Safety Loss (Use of `any`)

**File:** `src/components/new-task-modal.tsx:237`
**Issue:** The `onValueChange` handler for the Category (Domain) select uses the `any` type: `(v: any) => setCategory(v)`. This bypasses TypeScript's type checking for the category values.
**Fix:** Use the explicit category type:
```typescript
onValueChange={(v: "work" | "personal" | "school" | "health" | "other") => setCategory(v)}
```

## Info

### IN-01: Missing Accessibility Labels

**File:** `src/components/task-card.tsx:162`
**Issue:** The `DropdownMenuTrigger` button for task actions lacks an `aria-label`, making it difficult for screen reader users to identify the button's purpose (it only contains an icon).
**Fix:** Add `aria-label="Task actions"` or `aria-label={`Actions for ${task.title}`}` to the `Button`.

### IN-02: User-Facing "Legacy" Label

**File:** `src/components/new-task-modal.tsx:230`
**Issue:** The label "Domain (Legacy)" is displayed to the end-user. "Legacy" is a technical term that might be confusing or imply a broken feature to non-technical users.
**Fix:** If the feature is being phased out, consider a more user-friendly label or hide it if it's no longer intended for use.

---

_Reviewed: 2026-05-09_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
