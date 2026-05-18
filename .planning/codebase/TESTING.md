<!-- generated-by: gsd-doc-writer -->
# Testing Strategy

This document details the testing strategy for the Task Buddy Frontend project, utilizing Vitest for unit/integration tests and Playwright for end-to-end tests.

## Overview

We follow a balanced testing pyramid:
- **Unit Tests (Vitest):** Fast tests for utility functions, hooks, and individual components.
- **Integration Tests (Vitest + RTL):** Testing groups of components and their interactions with contexts.
- **End-to-End Tests (Playwright):** Full user flow validation, including authentication and persistent layout.

## Unit & Integration Testing (Vitest)

### Setup
- **Framework:** [Vitest](https://vitest.dev/)
- **Environment:** `jsdom`
- **Configuration:** `vitest.config.ts`
- **Setup File:** `src/test/setup.ts` (includes `@testing-library/jest-dom` matchers)

### Running Tests
```bash
# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Conventions
- Test files should be named `*.test.tsx` or `*.test.ts` and placed alongside the file they test.
- Use `screen` from `@testing-library/react` for querying.
- Mock external dependencies (like Axios) using Vitest mocks.

## End-to-End Testing (Playwright)

### Setup
- **Framework:** [Playwright](https://playwright.dev/)
- **Configuration:** `playwright.config.ts`
- **Test Directory:** `tests/`

### Running Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npx playwright test --ui
```

### Strategy
- **Authentication:** Tests verify the login/logout flow and persistence across page reloads.
- **Layout Persistence:** Validates that the `Sidebar` and `TopNav` remain stable during navigation.
- **Task Management:** Covers creating, updating, and deleting tasks, including drag-and-drop interactions.

## Continuous Integration

Tests are run on every pull request to ensuring no regressions are introduced.

| Test Type | Runner | Enforcement |
|-----------|--------|-------------|
| Unit/Integration | Vitest | CI Job (Build/Test) |
| E2E | Playwright | CI Job (E2E) |
| Linting | ESLint | CI Job (Lint) |
| Type Checking | TypeScript | CI Job (Build) |
