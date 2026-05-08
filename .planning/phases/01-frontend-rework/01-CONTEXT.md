# Phase 1 Context: Frontend UX & Integration Rework

**Date:** 2026-05-08

<domain>
Frontend user experience improvements, layout refactoring (sidebar, dashboard, landing page), and data integration alignment with the backend.
</domain>

## Decisions Captured
<decisions>
### UI / UX Overhaul
- **Overall Style:** Remove over-engineered or unnatural "AI slop" design elements while keeping the parts that work. Use the `ui-ux-pro-max` skill for design intelligence.
- **Dashboard & Sidebar Layout:**
  - Stop the header and sidebar from reloading or animating on every page change. They should remain static/persistent across route transitions.
  - "Massively improve" the sidebar: make it collapsible.
  - Remove redundant user profile/session info from the sidebar/dashboard if it's unnecessary, including the "disconnect session" (logout) button there.
- **Typography & Copy:** 
  - Change unnatural wording (e.g., replace "forge task" with standard wording like "Create Task" or "Add Task").
  - Change the font of the "executive dashboard" header to something more appropriate.
- **Loading States:** Improve the plain/inadequate loading bar. Use a more polished loading indicator.
- **Icons:** Add more icons throughout the UI to improve visual hierarchy.

### Landing Page
- **Refinements:** Keep the existing great overall design but improve it slightly.
- **Watch Demo:** Remove or fix the "watch demo" button since there is no demo video.
- **Footer:** Update the hardcoded copyright year to be dynamic.

### Data Integration
- **Backend Sync:** Ensure the frontend pulls the correct information from the backend, accommodating recent backend schema/data changes.
</decisions>

## Canonical References
<canonical_refs>
- `docs/codebase/STACK.md` (Design system constraints and technology stack)
</canonical_refs>

## Code Context
<code_context>
- Frontend is using React 19, Tailwind CSS v4, and shadcn/ui. 
- Global states are likely handled via Zustand and Context API.
</code_context>

## Deferred Ideas
<deferred>
- None.
</deferred>
