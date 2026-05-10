# UI-SPEC Phase 4: Premium UX Hardening & Descriptive History

## 🎨 Visual Persona: The "Command Center"
Following the Linear/Raycast inspiration, this phase transitions the UI from a "standard dashboard" into a highly functional, keyboard-centric command center.

## 📐 Layout & Redundancy Hardening

### 1. Header Cleanup (TasksPage.tsx)
- **Action**: Remove the secondary "New Task" button from the header.
- **Replacement**: Shift the **Sort** and **Filter** controls to the right where the button was.
- **Visual**: Use icon-buttons with subtle tooltips for a cleaner, "studio" feel.

### 2. Navigation Consistency (TopNav.tsx)
- **Global CTA**: Keep the "Create Task" button in the TopNav as the primary entry point.
- **Avatar Dropdown**:
  - Remove "History" link (redundant with sidebar).
  - **Styling**: Change `bg-background/80` to `bg-background/95` (or solid in light mode) to fix overlap transparency issues.
  - **Shadow**: Increase elevation to `shadow-2xl` with a subtle primary-tinted border (`border-primary/10`).

## 🛠️ Feature Refinements

### 3. "Command Palette" Create Task Modal
- **Format**: Transition the modal to a centered "Palette" style.
  - **Width**: `max-w-2xl` (slightly wider than standard).
  - **Backdrop**: Heavier blur (`backdrop-blur-xl`) with a dark overlay.
- **Hover/Focus Fix**:
  - `SelectItem` focus state: `bg-primary/10 text-primary` (light) and `bg-primary/20 text-accent` (dark).
  - Ensure labels remain `text-muted-foreground/40` but focused inputs get a `ring-primary/20` halo.

### 4. Smart Sorting & Persistence
- **Controls**:
  - Dropdown menu for `Priority (High-Low)`, `Deadline (Soonest)`, `Alphabetical`.
- **Logic**:
  - Default: `Deadline (Soonest)`.
  - **Local Persistence**: Save selection to `localStorage.getItem('tb_sort_preference')`.
- **Indicator**: Show an "up/down" arrow next to the active sort label.

### 5. Descriptive Activity History (AuditTrail.tsx)
- **Grouping**: History items must be grouped by date headers (e.g., "Today", "Yesterday", "May 8").
- **Filtering**:
  - **Hard Filter**: Exclude `LOGIN` and `LOGOUT` actions from the UI list.
- **Formatting**:
  - Replace raw keys with human-readable descriptions:
    - `update_task`: "Refined **{task_name}**" or "Updated **{field}** on **{task_name}**".
    - `create_task`: "Orchestrated new task: **{task_name}**".
- **Empty State**: Use the "Silence. No logs found" pattern from DESIGN.md.

## 🚦 Verification Gates
- [ ] Create Task modal hover states are high-contrast and readable in both modes.
- [ ] Sort preference persists after a page reload.
- [ ] History grouping headers appear correctly (Today vs Yesterday).
- [ ] Login/Logout logs are invisible in the activity history.
- [ ] TopNav dropdown no longer looks "transparent/messy" over busy backgrounds.

---
*Generated: 2026-05-10*
