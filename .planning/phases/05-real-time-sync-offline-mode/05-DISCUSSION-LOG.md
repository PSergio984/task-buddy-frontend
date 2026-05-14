# Phase 5: Real-time Sync & Offline Mode - Discussion Log

## Areas Discussed

### Sync & Offline Strategy
- **Options:** Last-Write-Wins vs. User Confirmation.
- **Selection:** **Last-Write-Wins**. 
- **Rationale:** Minimal friction for a single-user task manager.
- **Options:** Core Only (Tasks/Projects/Tags) vs. Full Offline Cache.
- **Selection:** **Core Only**.
- **Rationale:** Keep the IndexedDB size small and focus on high-utility data.

### Auth & Redirection Fixes
- **Options:** Verify Email Page vs. Inline Notice.
- **Selection:** **Verify Email Page**.
- **Rationale:** Clearer user journey for unconfirmed accounts.
- **Options:** Strict Verification vs. Lazy Verification.
- **Selection:** **Strict Verification**.
- **Rationale:** Prevents the Dashboard -> Login bouncing by ensuring the session is valid *before* routing.

### Semantic Feedback & History
- **Options:** 'Finished' vs. 'Completed'.
- **Selection:** **'Completed'**.
- **Rationale:** Maintain consistency with the existing technical terminology while improving detail.
- **Options:** Strict Lifecycle vs. Full Workspace Events.
- **Selection:** **Full Workspace Events**.
- **Rationale:** User wants to see all meaningful changes (tasks, projects, tags) but hide noise (login/logout).

### UI Polish & Bug Fixes
- **Options:** Task Drawer Only vs. Global Modal Dirty Checks.
- **Selection:** **Global Modal Dirty Checks**.
- **Rationale:** Ensure consistent "save only when changed" behavior across the entire app.

## Deferred Ideas
- **Backlog:** Background sync for Audit Logs (Performance concerns).
- **Backlog:** Conflict resolution UI (If the app ever moves to multi-user collaboration).
