<!-- generated-by: gsd-doc-writer -->
# Codebase Structure

**Analysis Date: 2024-05-13**

## Directory Layout

```
[project-root]/
├── public/                 # Static public assets (icons, images)
├── src/                    # Primary source code directory
│   ├── assets/             # Media assets imported via bundler
│   ├── components/         # React UI components
│   │   ├── auth/           # Authentication related components
│   │   ├── layout/         # Shared layout components (Sidebar, TopNav)
│   │   ├── task-drawer/    # Task detail and edit drawer components
│   │   └── ui/             # Generic shadcn/ui primitives
│   ├── contexts/           # React Context providers (Auth, Settings, Filter)
│   ├── hooks/              # Custom React hooks (TanStack Query wrappers)
│   ├── lib/                # Utility functions, API client, and helpers
│   ├── pages/              # View-level route components
│   └── sw.ts               # Service Worker implementation (PWA)
├── tests/                  # E2E Tests (Playwright)
├── playwright-report/      # E2E Test reports
└── dist/                   # Production build output
```

## Directory Purposes

**`src/pages/`:**
- Purpose: Route entry points and full-page assemblies.
- Key files:
  - `TasksPage.tsx`: Primary task management view.
  - `TaskDetailPage.tsx`: Detailed view for a single task.
  - `ProfilePage.tsx`: User profile and settings.
  - `AuditLogsPage.tsx`: History of actions.
  - `LandingPage.tsx`: Marketing/Welcome page.
  - `LoginPage.tsx`, `RegisterPage.tsx`: Auth entry points.

**`src/hooks/`:**
- Purpose: Encapsulate data fetching (TanStack Query) and component logic.
- Key files:
  - `useTasks.ts`: CRUD operations for tasks.
  - `useProjects.ts`, `useTags.ts`: Metadata management.
  - `useNotifications.ts`: Push notification and alert management.
  - `useTaskDrawerState.ts`: UI state management for task interactions.
  - `use-toast.ts`: shadcn/ui toast notifications.

**`src/components/ui/`:**
- Purpose: Atomic UI primitives (shadcn/ui), styled with Tailwind v4.
- Contains: Button, Input, Dialog, Drawer, Popover, Toast, etc.

**`src/contexts/`:**
- Purpose: Global application state and configuration.
- Key files:
  - `AuthContext.tsx`: Session and identity management.
  - `SettingsContext.tsx`: User preferences and theme state.
  - `FilterContext.tsx`: Shared task filtering logic across pages.

**`src/lib/`:**
- Purpose: Non-React utilities and shared configurations.
- Key files:
  - `api.ts`: Central Axios instance with interceptors.
  - `utils.ts`: Tailwind class merging and formatting helpers.
  - `auth.ts`: Validation and sanitization logic.

**`src/sw.ts`:**
- Purpose: Service Worker for PWA support, handling precaching and push notifications.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM hydration and root provider setup.
- `src/App.tsx`: Central router configuration and protected route logic.
- `src/index.css`: Tailwind v4 configuration and global styles.

**Configuration:**
- `vite.config.ts`: Vite config with PWA and Tailwind v4 plugins.
- `tailwind.config.js`: (Legacy/Bridge) Tailwind configuration.
- `playwright.config.ts`: E2E test runner setup.
- `vitest.config.ts`: Unit/Component test runner setup.

## Naming Conventions

**Files:**
- React Components/Pages: PascalCase (e.g., `TaskCard.tsx`, `TasksPage.tsx`).
- Hooks: camelCase with `use` prefix (e.g., `useTasks.ts`, `use-toast.ts`).
- Utility/Lib: camelCase or kebab-case (e.g., `api.ts`, `auth-helpers.ts`).
- Tests: `.test.ts`, `.test.tsx` (Vitest) or `.spec.ts` (Playwright).

**Directories:**
- Kebab-case (lowercase, hyphen-separated).

## Where to Add New Code

**New API Interaction:**
- Create/update hook in `src/hooks/` using `useQuery` or `useMutation`.
- Define TypeScript interfaces in `src/lib/api.ts` if shared.

**New Feature View:**
- Add page component to `src/pages/`.
- Register route in `src/App.tsx`.

**New UI Primitive:**
- Add to `src/components/ui/` (usually via `npx shadcn@latest add`).

---

*Structure analysis: 2024-05-13*
