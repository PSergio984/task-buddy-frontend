# Protocol: Council of Three Spec Audit

## The Council
1.  **Auditor A (Claude 3.5 Sonnet)**: Focus on logic, architecture, and React 19 patterns.
2.  **Auditor B (GPT-4o)**: Focus on security, edge cases, and API contract compliance.
3.  **Auditor C (Gemini 1.5 Pro)**: Focus on performance, scale, and synchronization logic.

## Scrutiny Areas
- **React 19 Concurrent Features**: Are we using `useTransition` and `useActionState` correctly?
- **Offline Integrity**: Does the IndexedDB schema match the API schema character-for-character?
- **Authorization**: Does every API endpoint verify user ownership of the resource?

## Triage Rules
- **Triple-Match**: All three auditors agree it's a bug. Priority 1 Fix.
- **Double-Match**: Two auditors agree. Priority 2 Fix.
- **Single-Match**: One auditor identifies a risk. Flag as "Refinement Needed".
