<!-- refreshed: [YYYY-MM-DD] -->
# Architecture

**Analysis Date:** [YYYY-MM-DD]

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        Pages Layer                           │
├──────────────────┬──────────────────┬───────────────────────┤
│ `LandingPage`    │ `LoginPage`      │ `DashboardLayout`     │
│ `src/pages/`     │ `src/pages/`     │ `src/App.tsx`         │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Components & Hooks Layer                     │
│ `src/components/`                                            │
│ `src/hooks/useApi.ts`                                        │
│ `src/contexts/AuthContext.tsx`                               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                API Client & State Store                      │
│ `axios` / `localStorage`                                     │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Core routing and route protection logic (`PublicRoute`, `ProtectedRoute`) | `src/App.tsx` |
| `AuthProvider` | Manages authentication state (token, user), `localStorage` persistence, and login/register functions | `src/contexts/AuthContext.tsx` |
| `DashboardLayout` | Central layout for authenticated users, managing tasks state and rendering `Sidebar` and `Dashboard` | `src/App.tsx` |
| API Hooks | Data fetching wrappers (e.g. `useTasks`, `useStats`) over `axios`, handling loading/error states | `src/hooks/useApi.ts` |
| `ui/*` | Reusable primitive UI components styled via Tailwind and Radix UI | `src/components/ui/` |

## Pattern Overview

**Overall:** React Single Page Application (SPA) with Context-based Auth and Custom Hooks for Data Fetching.

**Key Characteristics:**
- **Custom Hooks for Data:** Backend interactions are fully abstracted inside custom hooks (`useApi.ts`).
- **Context API:** Global state is minimized, using React Context primarily for cross-cutting concerns like Authentication and Theme.
- **Component Composition:** Complex views are composed of functional components using Shadcn UI primitives.
- **Client-Side Routing:** `react-router-dom` is used to navigate between views, enforcing access control at the route level.

## Layers

**Pages Layer:**
- Purpose: Defines view-level assemblies mapped to routes.
- Location: `src/pages/` and routing defined in `src/App.tsx`
- Contains: `LoginPage.tsx`, `LandingPage.tsx`, `AuditLogsPage.tsx`
- Depends on: Components, Hooks, Contexts.
- Used by: Route Definitions (`src/App.tsx`)

**Components Layer:**
- Purpose: Reusable and domain-specific UI blocks.
- Location: `src/components/`
- Contains: `dashboard.tsx`, `sidebar.tsx`, `task-card.tsx`, `ui/button.tsx`
- Depends on: React, Radix UI, Tailwind utils (`src/lib/utils.ts`).
- Used by: Pages layer.

**Hooks / API Layer:**
- Purpose: Interface with the backend API and provide data/status to components.
- Location: `src/hooks/`
- Contains: `useApi.ts` (API interaction hooks), `use-toast.ts`
- Depends on: `axios`, `AuthContext` (for tokens).
- Used by: Pages and Domain Components (e.g., `DashboardLayout`).

## Data Flow

### Primary Request Path (Task Fetching)

1. `DashboardLayout` in `src/App.tsx` calls `useTasks(activeFilter)` hook.
2. `useTasks()` in `src/hooks/useApi.ts` retrieves the `token` from `useAuth()`.
3. An `axios.get` call is fired to the backend `/api/v1/tasks/` endpoint with the `Authorization: Bearer` header.
4. The hook updates its internal `tasks`, `loading`, and `error` states, triggering a re-render of `DashboardLayout`.
5. `DashboardLayout` passes the `tasks` data down to the `Dashboard` component via props.

### Authentication Flow

1. User submits `RegisterForm.tsx` or `LoginPage.tsx`.
2. Component calls `login` or `register` from `useAuth()`.
3. `AuthContext.tsx` issues API request using `axios`.
4. On success, `AuthContext` stores the token and user in `localStorage` and updates its React state.
5. React Router's `PublicRoute` detects the token and redirects the user to `/dashboard`.

**State Management:**
- Application state is mostly ephemeral and tied to component lifecycle or data-fetching hooks.
- Global state is handled via `React.createContext` (`AuthContext`, `ThemeContext`).

## Key Abstractions

**Custom Data Hooks:**
- Purpose: Encapsulate data fetching logic, keeping components clean.
- Examples: `src/hooks/useApi.ts` (`useTasks`, `useCreateTask`, `useStats`)
- Pattern: Hook pattern exposing `{ data, loading, error, refreshAction }`.

**Route Protectors:**
- Purpose: Control access to application routes based on auth state.
- Examples: `src/contexts/ProtectedRoute.tsx` (`ProtectedRoute`, `PublicRoute`)
- Pattern: Wrapper components that conditionally render `children` or `<Navigate />`.

## Entry Points

**Main Script:**
- Location: `src/main.tsx`
- Triggers: Browser loading the app
- Responsibilities: Bootstraps React, applies global Context Providers (`AuthProvider`, `ThemeProvider`), and renders `App`.

**Application Router:**
- Location: `src/App.tsx`
- Triggers: `main.tsx` rendering
- Responsibilities: Maps URL paths to Page components, handles layouts and route guards.

## Architectural Constraints

- **Global state:** Restricted to `Context`. Avoid large global stores unless necessary (though `zustand` is installed, its usage isn't central based on initial inspection).
- **API Coupling:** Components should not use `axios` or `fetch` directly. All API interaction must go through custom hooks in `src/hooks/useApi.ts`.

## Anti-Patterns

### Direct API Calls in Components

**What happens:** Components using `axios` directly.
**Why it's wrong:** Duplicates loading/error handling logic and bypasses centralized auth token injection.
**Do this instead:** Create a custom hook in `src/hooks/useApi.ts` and call it from the component.

## Error Handling

**Strategy:** Error boundaries are not heavily prominent, but data-level errors are handled locally by API hooks and bubbled to the UI via `Toast` notifications or inline error messages.

**Patterns:**
- Hooks capture `axios` errors, normalize them into `Error` objects, and expose an `error` state.
- `AuthContext` catches auth failures, extracts the message using `getAuthErrorMessage` in `src/lib/auth.ts`, and updates the context `error` state.

## Cross-Cutting Concerns

**Logging:** Standard `console` logging for development; no comprehensive remote logging client identified in the core flows.
**Authentication:** Managed via JWT tokens stored in `localStorage`, injected into API requests dynamically by `useApi` hooks taking the token from `useAuth()`.
**Styling & Theming:** Handled via Tailwind CSS (`tailwindcss`) and centralized in `ThemeProvider` (`src/components/theme-provider.tsx`) toggling a `dark` class on the root document.

---

*Architecture analysis: [YYYY-MM-DD]*
