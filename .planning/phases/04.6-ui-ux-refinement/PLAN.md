# Phase 4.6: Advanced UI/UX Refinement - Execution Plan

## Goal
Elevate the user experience through consistent time formatting, improved sidebar aesthetics, and semantic audit trail descriptions.

## Waves

### Wave 1: Component & Infrastructure Upgrades
- [ ] **Task 1: Refactor TimePicker with 12h/24h support and suggestions**
  - Files: `src/components/ui/time-picker.tsx`
  - Details: Add 12h/24h conversion logic, integrate `useSettings`, and implement a "combo box" suggestion list using Shadcn Popover.
- [ ] **Task 2: Upgrade CreateProjectModal with ColorIconPicker**
  - Files: `src/components/create-project-modal.tsx`
  - Details: Replace simple color selection with `ColorIconPicker`, matching `CreateTagModal`. Ensure icon persistence in the mutation.
- [ ] **Task 3: Refine Audit Trail Semantic Descriptions**
  - Files: `src/lib/audit-trail-helpers.tsx`
  - Details: Improve `describeSubtaskAction` regex for parent task extraction and ensure `bold` helper application.

### Wave 2: Global Integration & Layout Polish
- [ ] **Task 4: Integrate Time Format Globally**
  - Files: `src/components/new-task-modal.tsx`, `src/components/task-drawer/MetaSidebar.tsx`, `src/components/audit-trail.tsx`, `src/components/task-card.tsx`
  - Details: Ensure all time displays and inputs respect the `timeFormat` from `useSettings`.
- [ ] **Task 5: Refine Sidebar Aesthetics & Animations**
  - Files: `src/components/sidebar.tsx`
  - Details: 
    - Update Tag rendering to `[Icon] [Dot] [Name]`.
    - Improve sidebar toggle visibility and accessibility.
    - Tune animation durations to `0.3s` for a snappier feel.
- [ ] **Task 6: Project & Tag Icon Persistence**
  - Files: `src/components/sidebar.tsx`
  - Details: Ensure project icons are rendered correctly using the `LucideIcons` lookup.

### Wave 3: Verification & Quality Gate
- [ ] **Task 7: Final Validation**
  - Actions: `npm run lint`, `npm run type-check`.
  - Manual verification of success criteria in `CONTEXT.md`.

---

## Success Criteria
1. Project creation supports icon selection.
2. Sidebar tags show icons and colors.
3. 12h/24h format is consistent across all views and inputs.
4. Time input provides intervals/suggestions.
5. Sidebar toggle is visible and snappy.
6. Audit logs are human-readable (no raw database timestamps).
