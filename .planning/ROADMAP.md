# Roadmap: Task Buddy Frontend

## Overview

The frontend roadmap focuses on transforming the application from an "AI-generated prototype" into a professional-grade product. This involves refactoring the layout for persistence, cleaning up copywriting and design "slop," and ensuring tight integration with the refined backend API.

## Phases

- [ ] **Phase 1: Frontend UX & Integration Rework** - Layout persistence, collapsible sidebar, design system alignment, and backend sync.
- [ ] **Phase 2: Enhanced Interactivity & State** - Real-time updates, advanced filtering, and offline support.
- [ ] **Phase 3: Performance & Accessibility** - Optimization, a11y audit, and mobile responsiveness polish.
- [x] **Phase 4: Premium UX Hardening & Descriptive History** - Command-palette modals, sorting persistence, and refined timeline.
- [x] **Phase 4.1: Advanced UI/UX & Feature Refinement** - Boxed sidebar toggle, Task Drawer, and Advanced Filtering.
- [ ] **Phase 4.2: High-Velocity Polish & Feature Hardening** - Subtask fixes, interaction refinements, and searchable creation.
- [ ] **Phase 4.3: Task Interaction Precision & Information Density** - Full creation support (subtasks/tags), time-aware deadlines, color-coding, and layout polish.


## Phase Details

### Phase 1: Frontend UX & Integration Rework
**Goal**: Implement a persistent layout, collapsible sidebar, and professional design system while aligning with backend API changes.
**Depends on**: Backend Phase 1 & 2
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, INT-01
**Success Criteria**:
  1. Navigation between pages is seamless (no shell re-mounting).
  2. Sidebar is collapsible with icon-only state.
  3. Typography uses Plus Jakarta Sans and standard professional copy.
  4. Backend sync is verified with no type mismatches.
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Layout & Sidebar refactor (Persistence, Collapsibility, DS Foundation)
- [ ] 01-02-PLAN.md — Component UX, Copy, & Landing Page (Cleanup, Modern Loaders)
- [ ] 01-03-PLAN.md — Backend Sync & Verification (API Hooks, E2E Tests)

### Phase 4: Premium UX Hardening & Descriptive History
**Goal**: Transform core interactions into a keyboard-centric command center style while cleaning up design "slop" and improving historical scannability.
**Depends on**: Phase 1, 2, 3.75
**Requirements**: UI-09, UI-10, UI-11, UI-12
**Success Criteria**:
  1. Create Task modal feels like a command palette and has high-contrast focus states.
  2. Sorting works and persists across sessions via local storage.
  3. Activity history is grouped by date and free of login/logout noise.
  4. Redundant UI elements are removed for a cleaner workspace.


### Phase 4.1: Advanced UI/UX & Feature Refinement
**Goal**: Elevate the workspace with a high-velocity sidebar, premium task drawer, and dedicated filtering hub.
**Depends on**: Phase 4
**Requirements**: UI-13, UI-14, UI-15, UI-16
**Success Criteria**:
  1. Sidebar uses "boxed" toggle and reorganization (Smart Lists, Tasks, Projects, Tags).
  2. Task viewing/editing uses a premium 2-column Side-Drawer.
  3. Filtering hub is a dedicated expandable bar with multi-select support.
  4. Search-and-create inline flow for Tags/Projects is functional.

### Phase 4.2: High-Velocity Polish & Feature Hardening
**Goal**: Resolve functional gaps from 4.1 (subtasks, search-and-create) and refine UX for high-velocity usage.
**Depends on**: Phase 4.1
**Requirements**: UI-17, UI-18, UI-19, UI-20
**Success Criteria**:
  1. Subtask creation and updates are fully functional in the Task Drawer.
  2. Clicking anywhere on a task card opens the viewing/editing drawer.
  3. Dashboard status widgets provide granular time-based filtering.
  4. Tags and Projects support "Search and Create" (Press Enter to create).
  5. Audit Trail descriptions are natural and concise.

### Phase 4.3: Task Interaction Precision & Information Density
**Goal**: Finalize premium task interactions with full field support during creation, time-aware deadlines, and visual color-coding for projects/tags.
**Depends on**: Phase 4.2
**Requirements**: UI-21, UI-22, UI-23, UI-24, UI-25, UI-26, UI-27
**Success Criteria**:
  1. Task creation flow supports subtasks and tags with "Search and Create" functionality.
  2. Due dates include time selection; past dates/times are disabled in the picker.
  3. Tags and Projects feature distinct icons and user-defined color coding.
  4. Activity history specifies exactly which task was created/updated/deleted.
  5. UI contrast in filtering and sidebars meets high-readability standards.
  6. Layout includes the requested blue gradient accent and optimized title padding.

---
*Roadmap updated: 2026-05-11*
