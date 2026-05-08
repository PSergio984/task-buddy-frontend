# Phase 1: Frontend UX & Integration Rework — Requirements

## UI/UX Refactoring

| Req ID | Requirement | Source |
|--------|-------------|--------|
| UI-01 | **Persistent Layout Architecture**: Move `Sidebar` and `TopNav` into a `MainLayout` wrapper using React Router's `<Outlet />`. Navigation MUST NOT re-mount shell components. | RESEARCH.md / UI-SPEC.md |
| UI-02 | **Collapsible Sidebar**: Implement expanded (280px) and collapsed (72px) states with icon-only view and tooltips in collapsed state. 200ms transition. | CONTEXT.md / UI-SPEC.md |
| UI-03 | **Sidebar Cleanup**: Remove redundant user profile info and logout button from the sidebar. | CONTEXT.md |
| UI-04 | **Design System Implementation**: Apply `Plus Jakarta Sans` font, 4px-multiples spacing scale, and specific color palette (#F8FAFC, #0F172A, #0369A1). | UI-SPEC.md |
| UI-05 | **Card Refinement**: Update border-radius to `1rem` (16px) across all task cards and dashboard containers. | UI-SPEC.md |
| UI-06 | **Copywriting Cleanup**: Change "Forge Task" to "Create Task", "Logout Label" to "Log Out". Remove "Operational Status: Optimal". | CONTEXT.md / UI-SPEC.md |
| UI-07 | **Polished Loading States**: Replace generic loaders with `Skeleton` screens for dashboard content and `Loader2` (lucide-react) for interactive elements. | CONTEXT.md / UI-SPEC.md |
| UI-08 | **Landing Page Fixes**: Remove "Watch Demo" button. Make copyright year dynamic. | CONTEXT.md / UI-SPEC.md |

## Backend Integration

| Req ID | Requirement | Source |
|--------|-------------|--------|
| INT-01 | **API Schema Sync**: Align `useApi.ts` with backend CRUD standardization (Phase 1/2 of backend rework). Ensure response interfaces match backend models. | CONTEXT.md / RESEARCH.md |

## Verification

| Req ID | Requirement | Source |
|--------|-------------|--------|
| VERI-01 | **Persistence Verification**: E2E test proves that TopNav/Sidebar do not unmount during route transitions. | RESEARCH.md |
| VERI-02 | **Style Compliance**: Visual check (checkpoint) for typography, spacing, and icon consistency. | UI-SPEC.md |
