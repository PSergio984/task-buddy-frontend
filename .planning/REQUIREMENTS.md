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

# Phase 3.8: Sidebar Organization & DND — Requirements

## Sidebar Interactions

| Req ID | Requirement | Source |
|--------|-------------|--------|
| SIDE-01 | **Drag-and-Drop Reordering**: Users can reorder Projects and Tags within their sections via a vertical grip handle. | CONTEXT.md / RESEARCH.md |
| SIDE-02 | **Sidebar CRUD Menu**: Each Project and Tag item (except system lists) must have an ellipsis menu for actions. | CONTEXT.md |
| SIDE-03 | **Inline Edit/Delete**: Ellipsis menu provides "Edit" (opens modal) and "Delete" (opens confirmation) actions. | CONTEXT.md |
| SIDE-04 | **Active Filter Auto-Reset**: Deleting the currently active Project or Tag filter must reset the view to "All Tasks". | CONTEXT.md |

# Phase 05: Real-time Sync & Offline Mode — Requirements

## Synchronization & Reliability

| Req ID | Requirement | Source |
|--------|-------------|--------|
| SYNC-01 | **Offline Cache (IndexedDB)**: Persist Tasks, Projects, and Tags using TanStack Query's persistent cache (IndexedDB via idb-keyval). | RESEARCH.md / D-02 |
| SYNC-02 | **Optimistic UI Updates**: All task, project, and tag mutations (Create, Update, Delete, Toggle) MUST reflect in the UI immediately. | RESEARCH.md / D-03 |
| SYNC-03 | **Real-time Sync Protocol**: Use WebSockets for live updates with a 30s heartbeat. Implement delta-sync on reconnect to fetch missed updates since `last_sync_timestamp`. | RESEARCH.md / D-12 |
| SYNC-04 | **Conflict Resolution (LWW)**: Implement Last-Write-Wins strategy. Server overwrites client if timestamps conflict; UI must notify user if a local change was discarded. | CONTEXT.md / D-13 |
| SYNC-05 | **Reconnection & Backoff**: Exponential backoff (initial 1s, max 30s) for WebSocket reconnection. UI must show "Offline" and "Syncing" states. | CONTEXT.md / D-14 |

## Authentication Hardening

| Req ID | Requirement | Source |
|--------|-------------|--------|
| AUTH-01 | **Strict Session Verification**: `AuthContext` must confirm session validity via `refreshUser` on mount before allowing access to `ProtectedRoute`. | CONTEXT.md / D-04 |
| AUTH-02 | **Verification Landing Page**: Implement a dedicated `/verify-email` page for users with unconfirmed accounts. | CONTEXT.md / D-05 |
| AUTH-03 | **Semantic Auth Errors**: `getAuthErrorMessage` must explicitly detect and handle "Email not confirmed" status. | CONTEXT.md / D-06 |

## UX Polish & History

| Req ID | Requirement | Source |
|--------|-------------|--------|
| UX-01 | **Global Dirty Checks**: Disable "Save" or "Update" buttons in all creation/edit forms if no changes are detected. | CONTEXT.md / D-10 |
| UX-02 | **Skeleton UI Consistency**: Ensure all major views (Audit, Dashboard, Tasks) use consistent shimmering skeleton patterns. | CONTEXT.md / D-11 |
| UX-03 | **Contextual Toasts**: Success toasts for creation actions must include the item name. | CONTEXT.md / D-07 |
| UX-04 | **Refined Audit Trail**: Strictly exclude login/logout events and focus on workspace lifecycle events (Create/Update/Complete). | CONTEXT.md / D-08, D-09 |
