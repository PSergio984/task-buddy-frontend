# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Playwright
- Assertion/mocking tools: Playwright builtin assertions (`expect`), possible MSW (not explicitly in dependencies).
- Commands:

```bash
npm run test:e2e
npx playwright test --ui
npx playwright test tests/auth.spec.ts
```

### 2) Test Layout

- Test file placement pattern: Separate `tests/` directory in root.
- Naming convention: `*.spec.ts`
- Setup files and where they run: `playwright.config.ts`

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | No | - | Not explicitly configured in `package.json` (no Vitest/Jest). |
| Integration | Partial | Component interaction | Covered by E2E tests. |
| E2E | Yes | User flows (Login, Tasks, Landing) | `tests/auth.spec.ts`, `tests/landing.spec.ts`. |

### 4) Mocking and Isolation Strategy

- Main mocking approach: Browser-level automation; API mocking via Playwright `route` (assumed).
- Isolation guarantees: New browser context per test.
- Common failure mode in tests: Flakiness due to timing or backend unavailability.

### 5) Coverage and Quality Signals

- Coverage tool + threshold: [TODO]
- Current reported coverage: [TODO]
- Known gaps/flaky areas: Authentication flows with external states.

### 6) Evidence

- `package.json`
- `playwright.config.ts`
- `tests/` directory

## Extended Sections (Optional)

- Test results location: `test-results/`, `playwright-report/`.
