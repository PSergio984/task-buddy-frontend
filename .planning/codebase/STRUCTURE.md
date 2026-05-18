<!-- generated-by: gsd-doc-writer -->
# Project Structure

This document describes the directory layout and architectural organization of the Task Buddy Frontend.

## Root Directory

- `.planning/`: Documentation of project goals, phases, and technical decisions.
- `docs/`: Supplemental documentation and codebase scans.
- `public/`: Static assets (icons, manifest).
- `src/`: Application source code.
- `tests/`: Playwright E2E tests.

## Source Directory (`src/`)

The application follows a modular, feature-based structure within `src/`.

### `assets/`
Images and global styles (including `index.css` which houses Tailwind v4 directives).

### `components/`
Reusable UI and layout components, grouped by feature:
- `auth/`: Authentication forms and password strength logic.
- `layout/`: Main application shells (`main-layout.tsx`, navigation).
- `sidebar/`: Complex sidebar components (projects, tags, smart lists).
- `task-drawer/`: Specialized components for the task detail view.
- `ui/`: Design system primitives (buttons, inputs, dialogs), based on Shadcn/Radix.

### `contexts/`
React Context providers for global application state:
- `AuthContext.tsx`: Authentication state and cookie handling.
- `FilterContext.tsx`: Shared task filtering logic.
- `SettingsContext.tsx`: User preferences and theme management.

### `hooks/`
Custom hooks containing business logic and API interactions. Examples:
- `useTasks.ts`: CRUD operations and state for tasks.
- `useProjects.ts`: Management of user projects.
- `useSidebarActions.ts`: Logic for sidebar interactions and Drag-and-Drop.

### `lib/`
Configuration and utility libraries:
- `api.ts`: Axios instance and API function definitions.
- `auth.ts`: Authentication helper functions and types.
- `query-client.ts`: TanStack Query configuration.
- `utils.ts`: Shared helper functions (e.g., `cn` for Tailwind class merging).

### `pages/`
The main views of the application, corresponding to top-level routes:
- `LoginPage.tsx` / `RegisterPage.tsx`: Auth views.
- `TasksPage.tsx`: The primary task management interface.
- `DashboardDemo.tsx`: High-level overview and statistics.
- `ProfilePage.tsx`: User settings and profile management.

### `test/`
Vitest setup and unit test utilities.
