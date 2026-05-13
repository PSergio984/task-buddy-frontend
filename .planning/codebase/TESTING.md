<!-- generated-by: gsd-doc-writer -->
# Testing Patterns

**Analysis Date: 2024-05-13**

## Test Frameworks

**Unit & Component Testing:**
- Runner: Vitest v4.1.5
- Library: React Testing Library
- Browser Environment: jsdom
- Configuration: `vitest.config.ts`

**End-to-End (E2E) Testing:**
- Runner: Playwright v1.59.1
- Configuration: `playwright.config.ts`

## Run Commands

```bash
# Unit/Component Tests
npm run test           # Run Vitest
npm run test:ui        # Vitest UI mode
npm run test:coverage  # Coverage report

# E2E Tests
npm run test:e2e       # Run Playwright tests
npx playwright show-report # View last E2E report
```

## Test Organization

**Vitest (Unit/Component):**
- Co-located with source code using `.test.ts` or `.test.tsx` suffix.
- Examples: `src/lib/utils.test.ts`, `src/contexts/SettingsContext.test.tsx`.

**Playwright (E2E):**
- Located in the root `tests/` directory.
- Suffix: `.spec.ts`.
- Examples: `tests/auth.spec.ts`, `tests/advanced-tasks.spec.ts`.

## Test Patterns

**Unit Testing Utilities:**
```typescript
// src/lib/utils.test.ts
import { cn } from "./utils"
import { describe, it, expect } from "vitest"

describe("cn", () => {
  it("merges tailwind classes correctly", () => {
    expect(cn("bg-red-500", "p-4")).toBe("bg-red-500 p-4")
  })
})
```

**E2E Functional Steps:**
```typescript
// tests/auth.spec.ts
test("user can login", async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[type="email"]', "test@example.com")
  await page.fill('input[type="password"]', "password")
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL("/dashboard")
})
```

## Mocking Strategies

**Component Tests (Vitest):**
- Use `vi.mock()` for external libraries or complex hooks.
- Mock TanStack Query hooks to return predictable data states.

**E2E Tests (Playwright):**
- **Live Backend:** Default for integration-style E2E.
- **Network Interception:** Use `page.route()` to mock specific API responses for edge-case UI testing (e.g., 500 errors, rate limiting).

## Coverage Requirements

- Coverage is tracked via Vitest using the `v8` or `istanbul` provider.
- Focus areas: `src/lib/` (logic), `src/hooks/` (data flow), and `src/components/` (interaction).

## CI Integration

- Tests are run in GitHub Actions as part of the PR validation workflow.
- E2E tests often run against a preview deployment or a local dev server in the CI environment.

---

*Testing patterns analysis: 2024-05-13*
