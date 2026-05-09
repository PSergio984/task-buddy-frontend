# Testing Patterns

## Core Sections (Required)

### 1) Test Stack and Commands

- Primary test framework: Vitest (Unit), Playwright (E2E)
- Assertion/mocking tools: Vitest/RTL (Unit), Playwright builtin assertions (E2E).
- Commands:

```bash
npm test              # Run Unit tests
npm run test:ui       # Unit tests UI
npm run test:e2e      # Run E2E tests
```

### 2) Test Layout

- Test file placement pattern: `*.test.ts` next to source (Unit), `tests/` directory (E2E).
- Naming convention: `*.test.ts` (Unit), `*.spec.ts` (E2E)
- Setup files and where they run: `vitest.config.ts`, `src/test/setup.ts`, `playwright.config.ts`

### 3) Test Scope Matrix

| Scope | Covered? | Typical target | Notes |
|-------|----------|----------------|-------|
| Unit | Yes | Utils, Hooks, Components | Configured via Vitest. |
| Integration | Partial | Component interaction | Covered by E2E tests. |
| E2E | Yes | User flows (Login, Tasks, Landing) | `tests/auth.spec.ts`, `tests/layout.spec.ts`. |

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
