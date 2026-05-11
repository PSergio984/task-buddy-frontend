# Phase 4.5: UI/UX & Functional Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the user experience through sidebar workspace controls, activity history context, and personalized profile settings.

**Architecture:**
- Introduce a `SettingsContext` to manage global UI preferences (e.g., Time Format).
- Refactor `Sidebar` to support individually collapsible sections and dynamic project/tag icons.
- Harden `Audit Trail` natural language processing for better activity context.
- Standardize "Search and Create" and "Create" flows for Tags in the Sidebar.

**Tech Stack:** React 19, TypeScript, Lucide Icons, Framer Motion, TanStack Query.

---

### Task 1: Global Settings Management

**Files:**
- Create: `src/contexts/SettingsContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Create SettingsContext**
  Define a context to manage `timeFormat` ('12h' | '24h') and persist it to `localStorage`.

```typescript
import { createContext, useContext, useState, useMemo, useEffect, type ReactNode } from "react"

export type TimeFormat = '12h' | '24h'

interface SettingsContextType {
  timeFormat: TimeFormat
  setTimeFormat: (format: TimeFormat) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(() => {
    const saved = globalThis.localStorage.getItem('pref_time_format')
    return (saved as TimeFormat) || '12h'
  })

  useEffect(() => {
    globalThis.localStorage.setItem('pref_time_format', timeFormat)
  }, [timeFormat])

  const value = useMemo(() => ({
    timeFormat,
    setTimeFormat
  }), [timeFormat])

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
```

- [ ] **Step 2: Wrap App with SettingsProvider**
  In `src/App.tsx`, wrap the `AuthProvider` or internal content with `SettingsProvider`.

- [ ] **Step 3: Implement Preference Toggle in ProfilePage**
  Add a "Preferences" card to `src/pages/ProfilePage.tsx` with a toggle for time format. Use the existing Card/Button/Label patterns.

- [ ] **Step 4: Commit**
  `git add src/contexts/SettingsContext.tsx src/App.tsx src/pages/ProfilePage.tsx`
  `git commit -m "feat: add SettingsContext and Time Format toggle in Profile"`

### Task 2: Sidebar Workspace Controls & Collapsibility

**Files:**
- Modify: `src/components/sidebar.tsx`
- Modify: `src/lib/api.ts`
- Modify: `src/hooks/useTags.ts`
- Create: `src/components/create-tag-modal.tsx`

- [ ] **Step 1: Implement Collapsible Sections**
  Add `isProjectsCollapsed` and `isTagsCollapsed` states in `Sidebar`. Use `AnimatePresence` for smooth list transitions. Add `ChevronDown` icons to headers.

- [ ] **Step 2: Dynamic Project Icons & Colors**
  In the `Sidebar` project loop, use `(LucideIcons as any)[project.icon || "Layers"]` to render the correct icon. Ensure `project.color` is applied consistently.

- [ ] **Step 3: Filter Revert Logic**
  Update `onClick` for Projects/Tags: if `activeSidebarFilter === filterId`, set `setActiveSidebarFilter("all")`.

- [ ] **Step 4: Tag Creation Flow**
  Implement `tagsApi.create` in `src/lib/api.ts` if missing. Create `useCreateTag` in `src/hooks/useTags.ts`. Add a `Plus` button to the Tags header in `Sidebar` that opens `CreateTagModal`.

- [ ] **Step 5: Commit**
  `git commit -m "feat: collapsible sidebar sections, dynamic project icons, and tag creation"`

### Task 3: Audit Trail Context & Time Formatting

**Files:**
- Modify: `src/lib/audit-trail-helpers.tsx`
- Modify: `src/components/audit-trail.tsx`
- Modify: `src/components/task-card.tsx`

- [ ] **Step 1: Refine Subtask Action Descriptions**
  Update `describeSubtaskAction` in `audit-trail-helpers.tsx` to better handle the "Updated subtask 'X' on task 'Y'" format and ensure parent context is clear.

- [ ] **Step 2: Apply Time Format Preference**
  Use `useSettings()` in `audit-trail.tsx` and `task-card.tsx`. Adjust `toLocaleTimeString` and `Intl.DateTimeFormat` options based on `timeFormat` ('12h' uses `hour12: true`, '24h' uses `hour12: false`).

- [ ] **Step 3: Commit**
  `git commit -m "feat: natural language audit trail and time format integration"`

### Task 4: UI/UX Precision & Validation

**Files:**
- Modify: `src/components/sidebar.tsx`
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Centering Collapsed Sidebar**
  Adjust the `PanelLeftOpen`/`PanelLeftClose` button and branding container in `sidebar.tsx` for perfect centering in the 96px collapsed state.

- [ ] **Step 2: Final Layout Audit**
  Check contrast and spacing of the new Profile cards and Sidebar controls.

- [ ] **Step 3: Build & Lint**
  Run `npm run build` to verify no TypeScript or linting errors.

- [ ] **Step 4: Commit**
  `git commit -m "fix: sidebar alignment and layout polish"`
