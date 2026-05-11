# Roadmap: Task Buddy Frontend

## Overview

The frontend roadmap focuses on transforming the application from an "AI-generated prototype" into a professional-grade product. This involves refactoring the layout for persistence, cleaning up copywriting and design "slop," and ensuring tight integration with the refined backend API.

## Phases

- [ ] **Phase 1: Frontend UX & Integration Rework** - Layout persistence, collapsible sidebar, design system alignment, and backend sync.
- [ ] **Phase 2: Enhanced Interactivity & State** - Real-time updates, advanced filtering, and offline support.
- [ ] **Phase 3: Performance & Accessibility** - Optimization, a11y audit, and mobile responsiveness polish.
- [x] **Phase 4: Premium UX Hardening & Descriptive History** - Command-palette modals, sorting persistence, and refined timeline.
- [x] **Phase 4.1: Advanced UI/UX & Feature Refinement** - Boxed sidebar toggle, Task Drawer, and Advanced Filtering.
- [x] **Phase 4.2: High-Velocity Polish & Feature Hardening** - Subtask fixes, interaction refinements, and searchable creation.
- [x] **Phase 4.3: Task Interaction Precision & Information Density** - Full creation support (subtasks/tags), time-aware deadlines, color-coding, and layout polish.
- [x] **Phase 4.5: UI/UX & Functional Refinement** - Sidebar workspace controls, activity history context, and profile settings.
- [x] **Phase 4.6: Advanced UI/UX Refinement** - Dashboard responsiveness, color-icon picker, and enhanced audit trail.


## Phase Details

### Phase 1: Frontend UX & Integration Rework
**Goal**: Implement a persistent layout, collapsible sidebar, and professional design system while aligning with backend API changes.
**Depends on**: Backend Phase 1 & 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, INT-01
**Success Criteria**:
  1. [x] Navigation between pages is seamless (no shell re-mounting).
  2. [x] Sidebar is collapsible with icon-only state.
  3. [x] Typography uses Plus Jakarta Sans and standard professional copy.
  4. [x] Backend sync is verified with no type mismatches.
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Layout & Sidebar refactor (Persistence, Collapsibility, DS Foundation)
- [x] 01-02-PLAN.md — Component UX, Copy, & Landing Page (Cleanup, Modern Loaders)
- [x] 01-03-PLAN.md — Backend Sync & Verification (API Hooks, E2E Tests)

### Phase 4: Premium UX Hardening & Descriptive History
**Goal**: Transform core interactions into a keyboard-centric command center style while cleaning up design "slop" and improving historical scannability.
**Depends on**: Phase 1, 2, 3.75
**Requirements**: UI-09, UI-10, UI-11, UI-12
**Success Criteria**:
  1. [x] Create Task modal feels like a command palette and has high-contrast focus states.
  2. [x] Sorting works and persists across sessions via local storage.
  3. [x] Activity history is grouped by date and free of login/logout noise.
  4. [x] Redundant UI elements are removed for a cleaner workspace.


### Phase 4.1: Advanced UI/UX & Feature Refinement
**Goal**: Elevate the workspace with a high-velocity sidebar, premium task drawer, and dedicated filtering hub.
**Depends on**: Phase 4
**Requirements**: UI-13, UI-14, UI-15, UI-16
**Success Criteria**:
  1. [x] Sidebar uses "boxed" toggle and reorganization (Smart Lists, Tasks, Projects, Tags).
  2. [x] Task viewing/editing uses a premium 2-column Side-Drawer.
  3. [x] Filtering hub is a dedicated expandable bar with multi-select support.
  4. [x] Search-and-create inline flow for Tags/Projects is functional.

### Phase 4.2: High-Velocity Polish & Feature Hardening
**Goal**: Resolve functional gaps from 4.1 (subtasks, search-and-create) and refine UX for high-velocity usage.
**Depends on**: Phase 4.1
**Requirements**: UI-17, UI-18, UI-19, UI-20
**Success Criteria**:
  1. [x] Subtask creation and updates are fully functional in the Task Drawer.
  2. [x] Clicking anywhere on a task card opens the viewing/editing drawer.
  3. [ ] Dashboard status widgets provide granular time-based filtering.
  4. [x] Tags and Projects support "Search and Create" (Press Enter to create).
  5. [x] Audit Trail descriptions are natural and concise.
  6. [x] Sidebar Smart Lists sync with Task Page filter hub (Unified Context).

### Phase 4.3: Task Interaction Precision & Information Density
**Goal**: Finalize premium task interactions with full field support during creation, time-aware deadlines, and visual color-coding for projects/tags.
**Depends on**: Phase 4.2
**Requirements**: UI-21, UI-22, UI-23, UI-24, UI-25, UI-26, UI-27
**Success Criteria**:
  1. [x] Premium custom time picker (HH:mm) with consistent `Plus Jakarta Sans` typography.
  2. [x] "Labels" renamed to "Tags" across the entire frontend.
  3. [x] "No Project" labeled as "Inbox" in the UI for a premium feel.
  4. [x] Subtasks list supports "Show more" expansion (initial 5 visible).
  5. [x] Toast notifications color-coded by status (`success`, `destructive`, `warning`, `info`).
  6. [x] Audit trail includes parent task info for subtasks and specific field change details.
  7. [x] Tags and Projects feature distinct icons and user-defined color coding.
  8. [x] Task creation flow supports subtasks and tags with "Search and Create" functionality.
  9. [ ] UI contrast in filtering and sidebars meets high-readability standards.
  10. [x] Layout includes the requested blue gradient accent and optimized title padding.

### Phase 4.5: UI/UX & Functional Refinement
**Goal**: Elevate the user experience through sidebar workspace controls, activity history context, and personalized profile settings.
**Depends on**: Phase 4.3
**Requirements**: UI-28, UI-29, UI-30, UI-31, UI-32, UI-33, UI-34, UI-35
**Success Criteria**:
  1. Sidebar "Projects" and "Focus Tags" sections are individually collapsible.
  2. Projects and Tags render their custom user-selected icons and colors in the Sidebar.
  3. Clicking an active Sidebar filter reverts the view to "All Tasks".
  4. "Create Tag" action is accessible directly from the Sidebar.
  5. Audit Trail uses natural language for updates and preserves parent-task context for subtasks.
  6. User can toggle between 12h and 24h time formats in Profile settings.
  7. Collapsed sidebar icon is perfectly centered and aligned.

---
*Roadmap updated: 2026-05-11*
