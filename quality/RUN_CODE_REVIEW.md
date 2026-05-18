# Protocol: AI-Powered Code Review (Task Buddy)

## Guardrails
- **Line Numbers Mandatory**: Every bug finding must include a specific line number.
- **Read Bodies**: Do not judge code by function signatures alone. Read the implementation.
- **Grep Before Claiming**: If you think a component or hook is missing, grep for it in `src/` first.
- **No Style Nitpicks**: Focus on correctness, logic errors, and security vulnerabilities.

## Focus Areas
1.  **Auth (src/contexts/AuthContext.tsx)**: Verify token persistence and HttpOnly cookie handling.
2.  **Sync (src/hooks/useTaskDrawerSync.ts)**: Check for potential race conditions in WebSocket updates.
3.  **Limits**: Ensure `MAX_TAGS` and `MAX_TASKS` are enforced in both UI and API interactions.
4.  **Optimistic UI**: Verify mutation rollbacks on server failure in `useMutation` hooks.

## Regression Protocol
For every BUG finding:
1.  Write a reproduction test case in `quality/test_regression.test.ts`.
2.  Confirm the test fails on current code.
3.  Apply fix.
4.  Confirm test passes.
