# Research: Phase 2 - Advanced Features & Architectural Hardening

## Overview
Phase 2 transitions the Task Buddy application from a prototype shell into a robust, feature-rich platform. This involves implementing advanced task management (subtasks, tags), hardening security with server-side session invalidation, and modernizing the frontend data layer with TanStack Query.

## Stated Requirements (from ROADMAP/Feedback)
- **Advanced Task Management**: Subtasks, Tags, Priorities.
- **Architectural Hardening**: Decompose `App.tsx`/`MainLayout.tsx`.
- **Data Layer Modernization**: Migrate from manual Axios to TanStack Query (React Query).
- **Security**: Implement server-side JWT blacklisting (Redis).

## Implementation Research

### 1. TanStack Query Migration (Frontend)
- **Problem**: Manual `useEffect` and `useState` in `useApi.ts` lead to complex loading/error states and lack of caching.
- **Solution**: Install `@tanstack/react-query`.
- **Strategy**:
  - Create `src/lib/query-client.ts` to initialize the client.
  - Wrap `App` in `QueryClientProvider`.
  - Refactor `useTasks`, `useStats`, etc., into `useQuery` and `useMutation` hooks.
  - Implement optimistic updates for task completion and subtask toggling.

### 2. Component Refactoring (Frontend)
- **Problem**: `MainLayout.tsx` and `App.tsx` are "God Components" managing too much state and routing.
- **Strategy**:
  - Decompose `MainLayout` into `Sidebar`, `TopNav`, and a new `LayoutContext` if needed.
  - Move Task/Filter state from `MainLayout` into TanStack Query cache or a dedicated `useTaskFilters` store (Zustand).
  - Extract the `NewTaskModal` logic into a feature-based folder (`src/features/tasks/`).

### 3. Server-Side Session Invalidation (Backend)
- **Problem**: Stateless JWTs cannot be invalidated before expiration (Security Concern).
- **Solution**: Use Redis to store a "blacklist" of logged-out tokens or a "whitelist" of active sessions.
- **Strategy**:
  - Add `redis` to `docker-compose.yml`.
  - Update `app/config.py` for Redis connection strings.
  - Modify `logout` endpoint to add the current token to Redis with an expiry matching the JWT's `exp` claim.
  - Update `get_current_user` dependency to check Redis before authorizing.

### 4. Advanced Task Features
- **Subtasks**: Backend already has `/api/v1/tasks/subtask` endpoints. Frontend needs to render these in `TaskCard`.
- **Tags**: Backend already has `/api/v1/tasks/tags` endpoints. Frontend needs a tag management UI (possibly in `NewTaskModal` or a dedicated tag manager).
- **Priorities**: Backend models need to be updated to include a `priority` field (Enum: LOW, MEDIUM, HIGH).

## Proposed Sub-Plans for Phase 2
- **02-01-PLAN**: Architectural Foundation (Redis setup, TanStack Query integration).
- **02-02-PLAN**: Component Decomposition & Feature Extraction.
- **02-03-PLAN**: Advanced Task Features (Subtasks UI, Tagging system, Priority implementation).
- **02-04-PLAN**: Real-time Polish & E2E Validation.

## Evidence
- `task-buddy-backend/app/api/routers/task.py` (Existing subtask/tag routes)
- `task-buddy-frontend/src/hooks/useApi.ts` (Manual fetch logic to be replaced)
- `task-buddy-frontend/src/components/layout/main-layout.tsx` (Target for refactoring)
