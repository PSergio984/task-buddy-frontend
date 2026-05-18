# Protocol: Integration Testing (Task Buddy)

## Safety Constraints
- Use `test.db` for backend (SQLite).
- Do not run against production API.
- Clear IndexedDB before each run.

## Execution UX
1.  **Plan**: Show a table of E2E scenarios to be tested.
2.  **Progress**: Print `✓ [Scenario ID]` or `✗ [Scenario ID]` as they complete.
3.  **Summary**: Report final pass/fail counts.

## Test Matrix

| ID | Scenario | Verification |
|----|----------|--------------|
| E2E-01 | Full Auth Flow | Register -> Logout -> Login -> Access Dashboard. |
| E2E-02 | Offline Mutation | Disable network -> Create Task -> Enable network -> Verify server sync. |
| E2E-03 | Sidebar Organization | Create Project -> Drag to top -> Refresh -> Verify order persists. |
| E2E-04 | Real-time Sync | Open two tabs -> Edit task in Tab A -> Verify Tab B updates via WS. |

## Field Reference Table
| Field Name | Type | Allowed Values |
|------------|------|----------------|
| priority | integer | 1 (Low), 2 (Medium), 3 (High), 4 (Urgent) |
| status | string | "pending", "completed", "in_progress" |
| tag_limit | integer | 50 (max) |
