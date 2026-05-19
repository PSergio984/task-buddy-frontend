---
status: gathering
trigger: "Investigate frontend bugs: (1) creating two tasks with same name consecutively shows only one task in UI though backend allows duplicates; (2) updating a task name and clicking out shows old name until reopening, then new name shows. Use scientific method: inspect task list rendering, keying, client-side de-dupe, query cache updates, optimistic updates, sorting, and React keys. Look for deduping by title or non-unique keys. Identify root cause and propose fixes; if code change is needed, note exact files/lines and change suggestions. Return a concise Root Cause Report with evidence."
created: 2026-05-20T00:00:00Z
updated: 2026-05-20T00:00:00Z
---

## Current Focus

<!-- OVERWRITE on each update - reflects NOW -->

hypothesis:
test:
expecting:
next_action: implement fixes

## Symptoms

<!-- Written during gathering, then IMMUTABLE -->

expected:
actual:
errors:
reproduction:
started:

## Eliminated

<!-- APPEND only - prevents re-investigating -->

## Evidence

<!-- APPEND only - facts discovered -->

- src/lib/api.ts: POST interceptor sets X-Idempotency-Key from a deterministic hash of method/url/body/params, so identical create payloads share the same key.
- src/components/task-detail-drawer.tsx TitleSection renders task?.title in read-only mode, so local edits are not shown until the task query updates.

## Resolution

<!-- OVERWRITE as understanding evolves -->

root_cause: Deterministic idempotency keys for POST cause backend de-dupe of identical create payloads; TitleSection read-only view uses task data instead of local draft, so edits appear stale until refresh.
fix: Add per-request nonce to idempotency key generation; show local title draft in read-only view.
verification: Create two tasks with same title consecutively and confirm both render; edit a title, click outside, and confirm the new title shows immediately.
files_changed: - src/lib/api.ts - src/components/task-detail-drawer.tsx
