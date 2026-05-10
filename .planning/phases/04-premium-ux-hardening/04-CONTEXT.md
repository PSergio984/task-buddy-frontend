# Phase 4 Context: Premium UX Hardening & Descriptive History

## Domain
Frontend UX/UI cleanup, functional sorting with local persistence, and refined activity history logic.

## Decisions

### Modal & Palette
- The "Create Task" modal must shift to a centered "Command Palette" style (`max-w-2xl`, heavier blur).
- Fixed the hover/focus contrast issue in `SelectItem` by using `bg-primary/10 text-primary`.

### Layout & Redundancy
- Remove the "New Task" button from `TasksPage.tsx` to eliminate redundancy with the `TopNav` button.
- Remove the "History" link from the `TopNav` avatar dropdown.
- Update `TopNav` dropdown background to `bg-background/95` with `shadow-2xl` to prevent messy transparency overlaps.

### Sorting & State
- Implement sorting by `Priority`, `Due Date`, and `Title`.
- Persist sorting preference in `localStorage` (`tb_sort_preference`).

### Activity History
- Group logs by date (Today, Yesterday, Date).
- Remove `LOGIN` and `LOGOUT` events from the display.
- Improve log descriptions to be more human-readable (e.g., "Refined {task}" instead of "update_task").

## Canonical References
- [UI-SPEC Phase 4](./04-UI-SPEC.md)
- Design System: DESIGN.md
- Inspiration: Images 1, 2, and 5 provided by user.

---
*Created: 2026-05-10*
