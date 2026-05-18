<!-- generated-by: gsd-doc-writer -->
# Architecture

**Analysis Date: 2026-05-13**
**Updated: 2026-05-15**

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                        Pages Layer                           │
├──────────────────┬──────────────────┬───────────────────────┤
│ `TasksPage`      │ `ProfilePage`    │ `TaskDetailPage`      │
│ `AuditLogsPage`  │ `LoginPage`      │ `LandingPage`         │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Components & Hooks Layer                     │
│ `MainLayout` (Persistent shell: Sidebar, TopNav, Outlet)    │
│ `src/components/` (Domain-specific: TaskCard, TaskDrawer)   │
│ `src/hooks/` (Data: useTasks, useNotifications)              │
│ `src/contexts/` (Global: Auth, Settings, Filter)             │
└─────────────────────────────────────────────────────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Client Infrastructure                       │
│ `TanStack Query` (Server State / Cache)                     │
│ `Axios` (HTTP Client / withCredentials: true)               │
│ `Service Worker` (PWA / Push Notifications / Offline)       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Core routing, route guards (`ProtectedRoute`), and PWA updates. | `src/App.tsx` |
| `MainLayout` | Persistent shell with collapsible `Sidebar`, `TopNav`, and `TaskDetailDrawer`. | `src/components/layout/main-layout.tsx` |
| `AuthContext` | Session management via HttpOnly cookies and user metadata hydration. | `src/contexts/AuthContext.tsx` |
| `SettingsContext` | User preferences, theme (dark/light), and PWA install state. | `src/contexts/SettingsContext.tsx` |
| `FilterContext` | Shared task filtering (status, priority, search) across views. | `src/contexts/FilterContext.tsx` |
| Domain Hooks | Data fetching wrappers using TanStack Query for caching and sync. | `src/hooks/` |
| `ui/*` | Atomic UI primitives styled via Tailwind v4 and Radix UI. | `src/components/ui/` |

## Pattern Overview

**Overall:** React 19 Single Page Application (SPA) with TanStack Query for server state management and Tailwind CSS v4 for engine-native styling.

**Key Characteristics:**
- **Server State with TanStack Query:** Data fetching, caching, and background synchronization are managed centrally via Query hooks.
- **Persistent Layout:** The application uses a central `MainLayout` shell providing a consistent `Sidebar` and `TopNav` across authenticated routes.
- **Tailwind CSS v4:** Uses the latest CSS-first configuration engine for improved build performance and modern CSS features.
- **PWA / Service Worker:** Offline capabilities and Push Notifications are handled via `vite-plugin-pwa` and a custom `sw.ts` implementing `injectManifest`.
- **Atomic UI Components:** UI is built on top of `shadcn/ui` primitives, ensuring accessibility and consistency.
- **Context-based Feature State:** Complex shared state (like filters) is managed via React Context to avoid prop-drilling.

## Layers

**Layout Layer:**
- Purpose: Provide a persistent shell (Sidebar, TopNav) for authenticated pages.
- Location: `src/components/layout/`
- Pattern: Uses `Outlet` from `react-router-dom` to render nested page content.

**Pages Layer:**
- Purpose: Orchestrate complex views by assembling components and hooks.
- Location: `src/pages/`
- Pattern: Usually contains logic for layout, route parameters, and high-level data orchestration.

**Components Layer:**
- Purpose: Reusable UI blocks, divided into generic primitives (`ui/`) and domain-specific assemblies.
- Location: `src/components/`
- Pattern: Functional components utilizing Radix UI primitives and Framer Motion for animations.

**Hooks / Data Layer:**
- Purpose: Interface with the backend API and provide cached, synchronized state to components.
- Location: `src/hooks/`
- Pattern: Custom hooks wrapping `useQuery` and `useMutation`.

**Contexts Layer:**
- Purpose: Provide cross-cutting application state (Auth, Theme, Filters).
- Location: `src/contexts/`
- Pattern: Provider-Consumer pattern with custom hooks for access (e.g., `useAuth`).

## Data Flow

### Primary Data Fetching (e.g., Tasks)

1. A component (e.g., `TasksPage`) calls `useTasks()` hook with current filters.
2. `useTasks` uses `useQuery` from TanStack Query.
3. If data is in cache and fresh, it returns immediately.
4. If stale, TanStack Query triggers an `axios` request via `src/lib/api.ts`.
5. On success, the cache is updated, and components re-render with new data.
6. For mutations (creating/deleting tasks), `useMutation` is used, often triggering cache invalidation to refresh related queries.

### PWA & Push Notifications

1. `VitePWA` plugin injects `src/sw.ts` into the build.
2. The Service Worker precaches static assets and listens for `push` events.
3. When a push message arrives, `sw.ts` shows a system notification.
4. Clicking the notification opens or focuses the application window and navigates to the `action_url`.

## Key Abstractions

**Query Hooks:**
- Purpose: Encapsulate endpoint URLs, types, and cache keys.
- Examples: `useTasks`, `useProjects`, `useNotifications`.

**API Client Interceptors:**
- Purpose: Handle global request/response logic (Auth headers, 401 redirects, rate limiting toasts).
- Location: `src/lib/api.ts`.

**Protected Routes:**
- Purpose: Enforce authentication at the routing level.
- Location: `src/contexts/ProtectedRoute.tsx`.

## Entry Points

**Main Script (`src/main.tsx`):**
- Bootstraps React, QueryClientProvider, and global Contexts.

**Application Router (`src/App.tsx`):**
- Defines the URL structure and wraps pages in Layouts and Route Guards.

**Service Worker (`src/sw.ts`):**
- Entry point for background tasks, offline support, and push notifications.

## Architectural Constraints

- **No Direct API Calls:** Components must use custom hooks from `src/hooks/` instead of calling `axios` directly.
- **Server State vs. Client State:** Use TanStack Query for anything that comes from the API; use Context for global settings/auth.
- **Tailwind v4 First:** Avoid inline styles or complex CSS files; prefer Tailwind classes and CSS variables defined in `index.css`.

## Error Handling

- **API Errors:** Handled globally by `api.ts` interceptors (showing toasts for 429s/500s) and locally via Query `error` states.
- **Auth Failures:** Interceptors detect 401s and dispatch a custom event to `AuthContext` to trigger a logout/redirect.

## Cross-Cutting Concerns

- **Authentication:** HttpOnly Cookies (backend-managed) for session security; user metadata in `localStorage` for hydration.
- **Styling:** Tailwind CSS v4 with a unified theme defined in `index.css`.
- **Theming:** `SettingsContext` manages dark/light mode by toggling the `.dark` class on the root element.

## Deployment & Infrastructure

- **Hosting Platform:** Vercel (Frontend SPA).
- **Routing Configuration:** `vercel.json` rewrite rules are mandatory to support client-side routing (React Router) on page refresh (rewriting all requests to `/index.html`).
- **PWA Support:** Service worker (`sw.ts`) managed by `vite-plugin-pwa` for offline caching and push notifications.

---

*Architecture analysis: 2026-05-15*
