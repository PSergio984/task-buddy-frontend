# Audit Trail Context & Time Formatting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine subtask action descriptions in the audit trail and integrate global time format preferences (12h/24h) across the UI.

**Architecture:** Use the `useSettings` hook to inject the user's `timeFormat` preference into components responsible for time rendering. Refactor `describeSubtaskAction` in `audit-trail-helpers.tsx` to use more robust regex patterns and consistent styling with the `bold` helper.

**Tech Stack:** React 19, Lucide React, Framer Motion, Tailwind CSS.

---

### Task 1: Refine Subtask Action Descriptions

**Files:**
- Modify: `src/lib/audit-trail-helpers.tsx`

- [ ] **Step 1: Update `describeSubtaskAction` implementation**
  Improve the regex for parent task extraction and ensure the `bold` helper is applied to both subtask and parent task names.

```typescript
// src/lib/audit-trail-helpers.tsx

// Ensure getTargetName is robust or updated if needed
// Update describeSubtaskAction:

export function describeSubtaskAction(act: string, details: string): React.ReactNode {
  const subName = getTargetName(details, "subtask")
  // Refined regex to capture parent task name more reliably
  const parentMatch = /(?:to|on|from|in)\s*task\s*['"]?([^'":,]+)['"]?/i.exec(details)
  const parentName = parentMatch?.[1]?.trim()

  const subNode = subName ? bold(subName) : "subtask"
  const parentNode = parentName ? <> to task {bold(parentName)}</> : ""

  if (act.includes("create")) 
    return <span>Added subtask {subNode}{parentNode}</span>
  
  if (act.includes("delete"))
    return <span>Deleted subtask {subNode}{parentNode}</span>
  
  if (act.includes("update")) {
    if (details.toLowerCase().includes("status")) {
      const statusMatch = /status\s*(?:to|is)\s*['"]?([^'":,]+)['"]?/i.exec(details)
      const status = statusMatch?.[1]
      return <span>Updated status of {subNode} to {status || "new status"}{parentNode}</span>
    }
    return <span>Updated subtask {subNode}{parentNode}</span>
  }

  return <span>Activity on subtask {subNode}{parentNode}</span>
}
```

- [ ] **Step 2: Verify `bold` helper exists and is used**
  The `bold` helper should be defined in `src/lib/audit-trail-helpers.tsx`.

- [ ] **Step 3: Commit changes**

```bash
git add src/lib/audit-trail-helpers.tsx
git commit -m "refactor: improve subtask action descriptions in audit trail"
```

### Task 2: Integrate Time Format in Audit Trail

**Files:**
- Modify: `src/components/audit-trail.tsx`

- [ ] **Step 1: Import `useSettings` and update `AuditItem`**
  Inject `timeFormat` into the `toLocaleTimeString` call.

```typescript
// src/components/audit-trail.tsx

import { useSettings } from "@/contexts/SettingsContext"

// ... inside AuditItem component:
function AuditItem({ log, index, isLast }: Readonly<{ log: AuditEntry; index: number; isLast: boolean }>) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === '12h'

  // ...
  // Update time rendering:
  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
    <Clock className="h-3 w-3" />
    {new Date(log.created_at).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: is12h
    })}
  </span>
  // ...
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/components/audit-trail.tsx
git commit -m "feat: integrate time format preference in audit trail"
```

### Task 3: Integrate Time Format in Task Card

**Files:**
- Modify: `src/components/task-card.tsx`

- [ ] **Step 1: Import `useSettings` and update `formatDueDate`**
  Update the `Intl.DateTimeFormat` options.

```typescript
// src/components/task-card.tsx

import { useSettings } from "@/contexts/SettingsContext"

// ... inside TaskCard component:
export function TaskCard({ ... }: TaskCardProps) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === '12h'

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: is12h
    }).format(date)
  }
  // ...
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/components/task-card.tsx
git commit -m "feat: integrate time format preference in task card"
```

### Task 4: Final Verification

- [ ] **Step 1: Verify changes manually or with tests**
  If tests exist, run them. Otherwise, verify that the audit trail now shows "Added subtask 'X' to task 'Y'" and times respect the setting.

- [ ] **Step 2: Run Lint and Type Check**

```bash
npm run lint
npm run type-check # or tsc --noEmit
```
