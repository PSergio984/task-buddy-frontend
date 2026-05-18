# AGENTS.md

## Project: Task Buddy
A production-grade task management system built with React 19 and FastAPI.

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query.
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL (prod) / SQLite (test).
- **Quality**: Vitest, Playwright, IndexedDB (Offline cache).

## Quality Playbook (READ FIRST)
- `quality/QUALITY.md`: The Quality Constitution and fitness scenarios.
- `quality/TEST_CASES.md`: 115+ detailed test cases (Positive/Negative/Edge).
- `quality/test_functional.test.ts`: Automated functional test suite.
- `quality/RUN_CODE_REVIEW.md`: AI-powered code review protocol.
- `quality/RUN_INTEGRATION_TESTS.md`: E2E integration test protocol.
- `quality/RUN_SPEC_AUDIT.md`: Council of Three multi-model audit protocol.

## Core Workflows
1. **Adding a Feature**:
   - Check `quality/TEST_CASES.md` for relevant edge cases.
   - Implement feature and add a functional test in `quality/`.
   - Run `npm test` to verify.

2. **Fixing a Bug**:
   - Create a regression test.
   - Apply fix using the `quality/RUN_CODE_REVIEW.md` guardrails.

3. **Running E2E**:
   - Follow `quality/RUN_INTEGRATION_TESTS.md`.
