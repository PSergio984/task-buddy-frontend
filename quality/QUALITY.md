# Quality Constitution: Task Buddy

## 1. Purpose
The purpose of Task Buddy is to provide a highly reliable, high-performance task management experience that remains functional even under poor network conditions. "Working correctly" means:
- **Zero Data Loss**: Every user mutation (create, edit, delete) must be persisted locally and synced to the server eventually.
- **Optimistic Responsiveness**: The UI must reflect user intent immediately, even before server confirmation.
- **Contextual Accuracy**: Filters, stats, and search results must always reflect the current local state accurately.

## 2. Coverage Targets

| Subsystem | Target | Rationale |
|-----------|--------|-----------|
| Auth & Security | 100% | Critical for data privacy; session handling must be airtight. |
| Task Mutations | 90% | Core value proposition; must handle edge cases like limits and offline state. |
| Synchronization | 80% | Complex logic involving WebSockets and IndexedDB; high risk of race conditions. |
| Sidebar & Navigation | 70% | High impact on UX; reordering and filtering must be consistent. |

## 3. Coverage Theater Prevention
- **Don't test the Framework**: Avoid tests that merely verify shadcn/ui components render or that `useState` works.
- **Don't test the Mock**: Ensure tests assert on the *result* of an operation, not just that a mocked function was called with certain arguments.
- **Real Data Shapes**: Always use fixtures that match the backend Pydantic schemas character-for-character.

## 4. Fitness-to-Purpose Scenarios

### Scenario 1: The Mid-Write Crash (Resilience)
- **Vulnerability**: If the browser is closed or crashes during an IndexedDB write for a large batch of synced tasks.
- **Risk**: Corrupted local state leading to JSON parsing errors on next load.
- **Detection**: Check `idb-keyval` integrity on boot.
- **Verification**: `ARCH-04` - Malformed JSON in IndexedDB test case.

### Scenario 2: The Rapid Toggle (Consistency)
- **Vulnerability**: User clicks completion checkbox 10 times in 2 seconds.
- **Risk**: Race condition where the final UI state doesn't match the final server state due to out-of-order network responses.
- **Detection**: Implement debouncing or sequence numbering for mutations.
- **Verification**: `ARCH-02` - Rapidly toggle completion test case.

### Scenario 3: The Limit Breach (Stability)
- **Vulnerability**: User hits the 1000 task limit or 50 tag limit.
- **Risk**: Backend rejects request with 400, but UI might remain in an optimistic "success" state if error handling is shallow.
- **Detection**: Ensure all `useApi` hooks rollback local state on server failure.
- **Verification**: `TASK-09`, `TAG-05` - Limit breach test cases.

## 5. AI Session Quality Discipline
- Every new feature must include a corresponding functional test in `quality/`.
- Never bypass the `useApi` hooks for data mutations.
- All PRs must pass the `quality/test_functional.test.ts` suite.

## 6. The Human Gate
- Visual design consistency (spacing, typography) requires manual inspection or screenshot comparison.
- "Feel" of DnD reordering smoothness cannot be fully automated and must be verified by a human.
