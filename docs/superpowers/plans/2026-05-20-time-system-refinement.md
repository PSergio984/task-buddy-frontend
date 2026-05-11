# Time System Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the 12h/24h time format preference is respected globally in inputs and displays, and implement a "combo box" suggestion list for the TimePicker.

**Architecture:** 
- `TimePicker` will be refactored to use `useSettings` for determining input/display format.
- It will internalize the 12h/24h conversion logic while still communicating with parents via a standard 24h string ("HH:mm") if possible, or adapted to the format. Actually, the requirement says "The TimePicker should now handle both 12h and 24h input/display logic". To keep integration simple, `onChange` should probably still emit a standard format or the `dueDate` object should be updated correctly.
- A suggestions list will be added using a `Popover` that triggers on input focus.

**Tech Stack:** React, Tailwind CSS, Lucide icons, date-fns, Shadcn UI (Popover, Input).

---

### Task 1: Refactor TimePicker with Format Support and Suggestions

**Files:**
- Modify: `src/components/ui/time-picker.tsx`

- [ ] **Step 1: Update imports and add helper functions for time conversion**

```tsx
import { useSettings } from "@/contexts/SettingsContext"
import { format, parse, isValid } from "date-fns"

// Helper to convert 12h to 24h
const to24h = (time12h: string): string => {
  try {
    const date = parse(time12h, "hh:mm a", new Date())
    return isValid(date) ? format(date, "HH:mm") : ""
  } catch {
    return ""
  }
}

// Helper to convert 24h to 12h
const to12h = (time24h: string): string => {
  try {
    const date = parse(time24h, "HH:mm", new Date())
    return isValid(date) ? format(date, "hh:mm a") : ""
  } catch {
    return ""
  }
}
```

- [ ] **Step 2: Implement Suggestions Logic**
Generate a list of times (e.g., every 30 minutes) based on the current input.

- [ ] **Step 3: Update TimePicker Component**
- Use `useSettings()` to get `timeFormat`.
- Update `handleInputChange` to handle 12h format (including AM/PM).
- Add a `Popover` to show suggestions.

- [ ] **Step 4: Verify with a manual check or test**
Verify that toggling settings changes the TimePicker display.

### Task 2: Integrate Time Format in NewTaskModal

**Files:**
- Modify: `src/components/new-task-modal.tsx`

- [ ] **Step 1: Update format in value prop**
- Use `useSettings()` to get `timeFormat`.
- Change `value={dueDate ? format(dueDate, "HH:mm") : "09:00"}` to use the correct format string based on `timeFormat`.

### Task 3: Integrate Time Format in MetaSidebar

**Files:**
- Modify: `src/components/task-drawer/MetaSidebar.tsx`

- [ ] **Step 1: Update display format in the trigger button**
- Use `useSettings()` to get `timeFormat`.
- Change `format(dueDate, "EEE, MMM d 'at' HH:mm")` to use the correct format string.

- [ ] **Step 2: Update TimePicker value prop**
- Ensure it uses the correct format string.

---

## Verification Plan

### Manual Verification
1. Open Task Buddy.
2. Go to Settings and set Time Format to 12h.
3. Open "New Task" modal.
4. Verify TimePicker shows "09:00 AM" (or similar).
5. Focus TimePicker and verify suggestions appear (e.g., "09:00 AM", "09:30 AM").
6. Type "1" and verify suggestions include "01:00 AM", "01:30 AM", etc.
7. Select a time and save task.
8. Open the task in the drawer and verify the deadline display uses 12h format (e.g., "Wed, May 20 at 09:00 PM").
9. Repeat steps with 24h format.

### Automated Tests
Run existing tests to ensure no regressions:
`npm test tests/layout.spec.ts` (if applicable)
