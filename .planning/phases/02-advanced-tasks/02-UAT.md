---
status: testing
phase: 02-advanced-tasks
source:
  - .planning/phases/02-advanced-tasks/02-01-SUMMARY.md
  - .planning/phases/02-advanced-tasks/02-02-SUMMARY.md
  - .planning/phases/02-advanced-tasks/02-03-SUMMARY.md
  - .planning/phases/02-advanced-tasks/02-04-SUMMARY.md
started: 2026-05-09T14:55:00Z
updated: 2026-05-09T14:55:00Z
---

## Current Test

number: 2
name: Logout & Session Invalidation
expected: |
  Logging out should blacklist the JWT in Redis (backend) and delete the cookie (frontend). Attempting to access `/me` or other protected routes after logout should return a 401 Unauthorized error.
awaiting: user response

## Tests

### 1. Cold Start Smoke Test
expected: |
  Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch using `docker-compose up`. Server boots without errors, Redis connects, migrations complete, and the frontend loads successfully at `http://localhost:3000`.
result: pass

### 2. Logout & Session Invalidation
expected: |
  Logging out should blacklist the JWT in Redis (backend) and delete the cookie (frontend). Attempting to access `/me` or other protected routes after logout should return a 401 Unauthorized error.
result: [pending]

### 3. Dashboard Data Loading (Skeletons)
expected: |
  When the dashboard loads or fetches new data, skeleton loaders (TaskListSkeleton, StatsOverviewSkeleton) should be visible instead of a blank screen or a generic "Loading" text, providing a smooth perceived performance.
result: [pending]

### 4. Advanced Task Creation (Priority & Tags)
expected: |
  In the New Task Modal, selecting a priority (High, Medium, Low) and entering comma-separated tags should correctly persist these values. The created task card should display the correct priority color-coded badge and tag badges.
result: [pending]

### 5. Subtask Interaction
expected: |
  Subtasks should be visible on the TaskCard. Toggling a subtask checkbox should update its completion status immediately (optimistic UI) and persist the change in the database.
result: [pending]

### 6. Tag Filtering via Sidebar
expected: |
  Clicking a tag in the "Browse Tags" section of the sidebar should filter the dashboard to only show tasks associated with that tag. The filter should be reflected in the UI (e.g., a "filtered by tag" indicator).
result: [pending]

### 7. Optimistic Updates Performance
expected: |
  Updating or deleting a task should feel instantaneous. The UI should reflect the change immediately without waiting for the server response, and it should not "flicker" or show a loading state for the specific action.
result: [pending]

### 8. Auth Persistence (HttpOnly Cookies)
expected: |
  After logging in, the user session should persist across page reloads. The application should correctly use the `access_token` cookie for all API requests without exposing the token to JavaScript.
result: [pending]

## Summary

total: 8
passed: 1
issues: 0
pending: 7
skipped: 0

## Gaps

[none yet]
