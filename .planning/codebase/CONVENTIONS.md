# Coding Conventions

**Analysis Date:** [YYYY-MM-DD]

## Naming Patterns

**Files:**
- Frontend: Kebab-case for component files (e.g., `task-card.tsx`), CamelCase for hooks/utilities (`use-toast.ts`, `useApi.ts`), PascalCase for pages (`LoginPage.tsx`).
- Backend: Snake_case for Python modules and files (e.g., `test_security.py`, `logging_conf.py`).

**Functions:**
- Frontend: CamelCase (e.g., `sanitizeEmail`, `TaskCard`), PascalCase for React Components.
- Backend: Snake_case for normal functions (e.g., `create_task`, `create_access_token`).

**Variables:**
- Frontend: CamelCase for variables and state (e.g., `emailError`, `submitAttempted`). UPPER_SNAKE_CASE for constants (e.g., `EMAIL_REGEX`).
- Backend: Snake_case (e.g., `logged_in_token`, `async_client`).

**Types:**
- Frontend: PascalCase for Interfaces and Types (e.g., `AuthUser`, `TaskCardProps`).
- Backend: PascalCase for Pydantic Models and SQLAlchemy classes.

## Code Style

**Formatting:**
- Frontend: Prettier with `prettier-plugin-tailwindcss` (`semi: false`, `singleQuote: false`, `tabWidth: 2`, `printWidth: 80`).
- Backend: Black (`line-length = 100`).

**Linting:**
- Frontend: ESLint (flat config) using `@eslint/js`, `typescript-eslint`, and React plugins.
- Backend: Ruff (configured to select E, W, F, I, C, B, UP), Mypy for static type checking.

## Import Organization

**Order:**
1. External libraries (e.g., `react`, `framer-motion`, `pytest`, `fastapi`).
2. Internal aliases/modules (Frontend: `@/components/...`, `@/lib/...`; Backend: `app.security`).
3. Local relative imports.

**Path Aliases:**
- Frontend: `@/` maps to `src/`.
- Backend: Uses absolute imports starting from `app.` (e.g., `from app import security`).

## Error Handling

**Patterns:**
- Frontend: Centralized error handling helpers (e.g., `getAuthErrorMessage` recursively parses nested backend errors). Specific error messages parsed from Axios responses using `err.response?.data`. Uses custom `useToast` hook to present error feedback via toast notifications.
- Backend: Standard FastAPI HTTPExceptions returning error responses in specific shapes (`{"detail": "..."}`).

## Logging

**Framework:** Backend uses `python-json-logger` for structured logging, `rich` for console output, `sentry-sdk` and `asgi-correlation-id`.
**Patterns:**
- Errors and metrics are captured as JSON payloads for structured logging.

## Comments

**When to Comment:**
- Mostly self-documenting code. Comments used occasionally to explain complex regexes or non-obvious configurations.

**JSDoc/TSDoc:**
- Type definitions define prop constraints in TS, inline docs sparse. Python uses type hints rather than docstrings extensively.

## Function Design

**Size:** Concise, functional utilities. React components tend to break out sub-renders but can be somewhat monolithic for forms.
**Parameters:**
- Frontend: Object parameter destructuring for React Components (`{ task, onToggleComplete }: TaskCardProps`).
- Backend: Direct positional and keyword arguments, extensive use of FastAPI Dependency Injection (e.g., `db`, `async_client: AsyncClient`).

## Module Design

**Exports:** 
- Frontend: Named exports preferred for utilities and components (`export function TaskCard(...)`). Default exports used mostly for configs (`vite.config.ts`, `eslint.config.js`).
- Backend: Implicit module exports, typical Python structure.

**Barrel Files:** 
- Not heavily used in frontend (uses direct `@/components/ui/button` imports rather than `components/index.ts`). Used in backend via `__init__.py`.
