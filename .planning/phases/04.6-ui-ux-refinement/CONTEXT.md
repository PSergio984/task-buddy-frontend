# Phase 4.6: Advanced UI/UX Refinement - Implementation Context

## Implementation Decisions

### 1. Time Input & Format Consistency
- **12h/24h Global Alignment**: `NewTaskModal` and `MetaSidebar` (Task Drawer) will now receive the `timeFormat` from `useSettings`.
- **TimePicker Refactor**:
  - Update `TimePicker` to handle both 12h and 24h internal logic.
  - Implement a "Combo Box" suggestion list: When the input is focused or typed into, show a dropdown with fixed intervals (e.g., :00, :15, :30, :45 for the current/typed hour).
- **Viewing/Creating Logic**: Ensure that the "View" mode in the Task Drawer also respects the time format when displaying the deadline.

### 2. Sidebar Aesthetics & Interactivity
- **Tag Rendering**: Sidebar tags will be updated to the format: `[Lucide Icon] [Color Dot] [Tag Name]`.
- **Animation Snappiness**: Transition durations for sidebar width and collapsible sections will be reduced to `0.3s` using `easeOut` or `spring(stiff)` for a high-velocity feel.
- **Toggle Accessibility**: The sidebar collapse button will be styled to match the primary sidebar icons (high contrast, consistent backgrounds) to fix visibility issues in both light and dark modes.

### 3. Project & Tag Consistency
- **Project Creation**: Update `CreateProjectModal` to include the `ColorIconPicker` component, matching the functionality of `CreateTagModal`.
- **Icon Persistence**: Ensure the selected icon is correctly sent to the backend and rendered in the sidebar.

### 4. Semantic Audit Trail
- **Detail Parsing**: Implement a parser for the `details` field in `audit-trail-helpers.tsx` specifically to identify date/time change patterns (e.g., `due_date from '...' to '...'`).
- **Formatting**: Convert raw ISO strings in audit logs to human-readable relative or short absolute dates (e.g., "from Yesterday 2pm to Today 4pm") depending on the proximity to the current time.

## Operational Constraints
- **Linting & Quality**: `npm run lint` and `ruff check .` (backend) must be executed and passing before any phase is considered complete. These are hard gates for implementation.

## Success Criteria
1. Project creation supports icon selection.
2. Sidebar tags show icons and colors.
3. 12h/24h format is consistent across all views and inputs.
4. Time input provides intervals/suggestions.
5. Sidebar toggle is visible and snappy.
6. Audit logs are human-readable (no raw database timestamps).
