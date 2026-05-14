# Roadmap: Task Buddy Frontend

## Overview

The frontend roadmap focuses on transforming the application from an "AI-generated prototype" into a professional-grade product. This involves refactoring the layout for persistence, cleaning up copywriting and design "slop," and ensuring tight integration with the refined backend API.

## Phases

- [x] **Phase 1: Frontend UX & Integration Rework** - Layout persistence, collapsible sidebar, design system alignment, and backend sync.
- [x] **Phase 2: Enhanced Interactivity & State** - Real-time updates, advanced filtering, and offline support. (Superseded by Phase 05)
- [ ] **Phase 3: Performance & Accessibility** - Optimization, a11y audit, and mobile responsiveness polish.
- [x] **Phase 3.8: Sidebar Organization & DND** - Sidebar CRUD actions, DND reordering, and ellipsis menus.
- [x] **Phase 3.9: UI and Idempotency Overhaul** - Stable time picker, performance skeletons, and backend idempotency.
- [x] **Phase 4: Premium UX Hardening & Descriptive History** - Command-palette modals, sorting persistence, and refined timeline.
- [x] **Phase 4.1: Advanced UI/UX & Feature Refinement** - Boxed sidebar toggle, Task Drawer, and Advanced Filtering.
- [x] **Phase 4.2: High-Velocity Polish & Feature Hardening** - Subtask fixes, interaction refinements, and searchable creation.
- [x] **Phase 4.3: Task Interaction Precision & Information Density** - Full creation support (subtasks/tags), time-aware deadlines, color-coding, and layout polish.
- [x] **Phase 4.5: UI/UX & Functional Refinement** - Sidebar workspace controls, activity history context, and profile settings.
- [x] **Phase 4.6: Advanced UI/UX Refinement** - Dashboard responsiveness, color-icon picker, and enhanced audit trail.
- [ ] **Phase 05: Real-time Sync & Offline Mode** - TanStack Query persistence, optimistic UI, and auth hardening.


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

### Phase 3: Performance & Accessibility
**Goal**: Optimization, a11y audit, and mobile responsiveness polish.
*(Details TBD)*

### Phase 3.8: Sidebar Organization & DND
**Goal**: Refine the sidebar with CRUD actions and Drag-and-Drop functionality for Projects and Tags.     
**Depends on**: Phase 3 (or current state)
**Requirements**: SIDE-01, SIDE-02, SIDE-03, SIDE-04
**Success Criteria**:
  1. [x] Projects and Tags can be reordered via drag-and-drop within their respective sections.
  2. [x] Projects and Tags can be edited and deleted via a "More" (ellipsis) dropdown menu on hover.      
  3. [x] Active project/tag filter resets to "All Tasks" if the active item is deleted.
  4. [x] UI state remains consistent across all views after CRUD actions.

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
  1. [x] Sidebar "Projects" and "Focus Tags" sections are individually collapsible.
  2. [x] Projects and Tags render their custom user-selected icons and colors in the Sidebar.
  3. [x] Clicking an active Sidebar filter reverts the view to "All Tasks".
  4. [x] "Create Tag" action is accessible directly from the Sidebar.
  5. [x] Audit Trail uses natural language for updates and preserves parent-task context for subtasks.        
  6. [x] User can toggle between 12h and 24h time formats in Profile settings.
  7. [x] Collapsed sidebar icon is perfectly centered and aligned.

### Phase 05: Real-time Sync & Offline Mode
**Goal**: Transform Task Buddy into a resilient, offline-capable tool with real-time synchronization and hardened authentication.
**Depends on**: Phase 4.6, Phase 3.9
**Requirements**: SYNC-01, SYNC-02, AUTH-01, AUTH-02, AUTH-03, UX-01, UX-02, UX-03, UX-04
**Success Criteria**:
  1. [ ] Core entities (Tasks/Projects/Tags) are cached offline in IndexedDB.
  2. [ ] All workspace mutations reflect in the UI optimistically.
  3. [ ] Redirection loops are resolved; unconfirmed users see a dedicated landing page.
  4. [ ] Audit Trail is clean, bug-free, and provides natural feedback.
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md — Auth Hardening & Verify Email Landing
- [ ] 05-02-PLAN.md — Real-time Sync & Offline Cache
- [ ] 05-03-PLAN.md — UX Hardening & Audit Trail Refinement

---
*Roadmap updated: 2026-05-14*
