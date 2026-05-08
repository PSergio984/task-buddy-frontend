# Testing Patterns

**Analysis Date:** [YYYY-MM-DD]

## Test Framework

**Runner:**
- Frontend: Playwright (`@playwright/test` ^1.59.1)
  - Config: `playwright.config.ts`
- Backend: Pytest (`pytest` ^7.4.0) with `pytest-asyncio`
  - Config: `pyproject.toml` (`[tool.pytest.ini_options]`)

**Assertion Library:**
- Frontend: Playwright's `expect` matchers.
- Backend: Python built-in `assert`.

**Run Commands:**
```bash
# Frontend
npm run test:e2e       # Run Playwright tests
npm run test:e2e -- --ui # UI mode

# Backend
pytest                 # Run all tests
```

## Test File Organization

**Location:**
- Frontend: Separate `tests/` directory at project root (`tests/auth.spec.ts`).
- Backend: Separate `tests/` directory (`tests/routers/test_task.py`).

**Naming:**
- Frontend: `*.spec.ts` (e.g., `forgot-password.spec.ts`).
- Backend: `test_*.py` (e.g., `test_security.py`).

**Structure:**
```text
[frontend-root]/
├── tests/
│   ├── auth.spec.ts      # Frontend E2E
│   └── landing.spec.ts
```
```text
[backend-root]/
├── tests/
│   ├── routers/
│   │   └── test_task.py  # Backend API tests
```

## Test Structure

**Suite Organization:**
```typescript
// Frontend
import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  })

  test("should do something", async ({ page }) => {
    await test.step("Step 1", async () => {
      // assertions
    })
  })
})
```

```python
# Backend
import pytest

@pytest.mark.anyio
async def test_create_task(db, async_client: AsyncClient, logged_in_token: str):
    response = await async_client.post(...)
    assert response.status_code == 201
```

**Patterns:**
- Frontend uses `test.step()` extensively inside E2E tests to logically group assertion steps within a single test.
- Backend makes heavy use of `@pytest.fixture` to handle setup/teardown (like `created_task`, `logged_in_token`).

## Mocking

**Framework:** Playwright Network Interception (Frontend), Monkeypatch / DB fixtures (Backend).

**Patterns:**
```typescript
// Frontend API mocking
await page.route("**/api/v1/users/token", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ access_token: "test-login-token" }),
  })
})
```

```python
# Backend monkeypatching
def test_create_task_expired_token(monkeypatch):
    monkeypatch.setattr(security, "access_token_expire_time", lambda: -1)
```

**What to Mock:**
- Frontend: Almost all backend endpoints are mocked via `page.route` to isolate the UI logic from the live backend during E2E UI verification.

**What NOT to Mock:**
- Backend tests execute against a real (often test-specific SQLite/PostgreSQL) database, meaning DB connections are real (or mapped to a test DB) rather than mocked.

## Fixtures and Factories

**Test Data:**
```python
# Backend fixture pattern
@pytest.fixture()
async def created_task(db, async_client: AsyncClient, logged_in_token: str) -> dict:
    return await create_task({"title": "Test Task"}, async_client, logged_in_token)
```

**Location:**
- Backend fixtures are either in specific test files or in `tests/conftest.py`.
- Frontend typically clears `localStorage` or uses mock JSON data rather than dedicated fixture factory files.

## Coverage

**Requirements:** None enforced explicitly by CI config blocks shown, but backend uses `pytest-cov`.

**View Coverage:**
```bash
pytest --cov=app
```

## Test Types

**Unit Tests:**
- Backend: Found in `tests/` focusing on specific utility methods like `test_security.py`.

**Integration Tests:**
- Backend: Tests in `tests/routers/` execute HTTP requests against the FastAPI app via `httpx.AsyncClient` hitting a test database.

**E2E Tests:**
- Frontend: Dominant testing pattern using Playwright to navigate the application and assert DOM state via API mocking.

## Common Patterns

**Async Testing:**
- Both frontend and backend rely heavily on async testing (`async ({ page }) => {}` in Playwright and `@pytest.mark.anyio` + `async def` in Pytest).
