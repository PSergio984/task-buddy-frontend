# Graph Report - task-buddy-frontend  (2026-05-11)

## Corpus Check
- 84 files · ~124,266 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 889 nodes · 1396 edges · 67 communities (65 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e37e1c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Authentication & Authorization|Authentication & Authorization]]
- [[_COMMUNITY_Core UI Components|Core UI Components]]
- [[_COMMUNITY_User Navigation & Theme|User Navigation & Theme]]
- [[_COMMUNITY_Audit & Activity Logging|Audit & Activity Logging]]
- [[_COMMUNITY_Task Management Forms|Task Management Forms]]
- [[_COMMUNITY_State Management & Actions|State Management & Actions]]
- [[_COMMUNITY_Theme Utilities|Theme Utilities]]
- [[_COMMUNITY_Testing & Validation|Testing & Validation]]
- [[_COMMUNITY_API Documentation & Integration|API Documentation & Integration]]
- [[_COMMUNITY_Main Application Shell|Main Application Shell]]
- [[_COMMUNITY_Data Models & Entities|Data Models & Entities]]
- [[_COMMUNITY_Linting Configuration|Linting Configuration]]
- [[_COMMUNITY_Playwright Testing Config|Playwright Testing Config]]
- [[_COMMUNITY_Tailwind CSS Styling|Tailwind CSS Styling]]
- [[_COMMUNITY_Build & Vite Configuration|Build & Vite Configuration]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 42 edges
2. `cn()` - 32 edges
3. `useToast()` - 22 edges
4. `toast()` - 15 edges
5. `Task-Buddy Frontend` - 15 edges
6. `sanitizePassword()` - 13 edges
7. `TasksPage()` - 13 edges
8. `Task` - 11 edges
9. `Task-Buddy API Integration Guide` - 11 edges
10. `useTasks()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `TaskBuddy App` --references--> `App Icon`  [INFERRED]
  src/App.tsx → public/task-buddy-icon.svg
- `API Hooks` --implements--> `Backend API Docs`  [INFERRED]
  src/hooks/useApi.ts → API.md
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/components/create-project-modal.tsx → src/hooks/use-toast.ts
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/pages/ForgotPasswordPage.tsx → src/hooks/use-toast.ts
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/contexts/AuthContext.tsx

## Communities (67 total, 2 thin omitted)

### Community 0 - "Authentication & Authorization"
Cohesion: 0.05
Nodes (80): [activeTab, setActiveTab], Dashboard(), DashboardProps, filteredTasks, handleDelete, handleDeleteSubtask, handleDetachTag, handleToggleComplete (+72 more)

### Community 1 - "Core UI Components"
Cohesion: 0.05
Nodes (42): ColorIconPickerProps, PRESET_COLORS, PRESET_ICONS, [color, setColor], COLORS, createGroup, CreateGroupModalProps, [name, setName] (+34 more)

### Community 2 - "User Navigation & Theme"
Cohesion: 0.06
Nodes (35): categoryConfig, priorityConfig, TaskCard(), TaskCardProps, api, Group, isLogoutRequest, Project (+27 more)

### Community 3 - "Audit & Activity Logging"
Cohesion: 0.05
Nodes (40): attachTag, createSubtask, createTag, createTask, { data: allTags = [] }, { data: fetchedTask }, { data: projects = [] }, [deleteSnapshot, setDeleteSnapshot] (+32 more)

### Community 4 - "Task Management Forms"
Cohesion: 0.05
Nodes (36): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), listeners, memoryState, reducer() (+28 more)

### Community 5 - "State Management & Actions"
Cohesion: 0.06
Nodes (29): [color, setColor], COLORS, createProject, CreateProjectModalProps, handleSubmit(), [name, setName], { toast }, { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId 
  } (+21 more)

### Community 6 - "Theme Utilities"
Cohesion: 0.06
Nodes (29): AuditEntry, AuditTrailProps, controller, [currentLimit, setCurrentLimit], [error, setError], EXCLUDED_ACTIONS, fetchAuditLog, fieldChanges (+21 more)

### Community 7 - "Testing & Validation"
Cohesion: 0.06
Nodes (30): API Endpoints, Base URL Configuration, code:typescript (interface Task {), code:typescript (const { deleteTask, loading, error } = useDeleteTask();), code:typescript (const { tasks, loading, error } = useTasks();), code:block12 (Content-Type: application/json), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:typescript (const { createTask, loading } = useCreateTask();) (+22 more)

### Community 8 - "API Documentation & Integration"
Cohesion: 0.09
Nodes (21): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, code:css (@import url('https://fonts.googleapis.com/css2?family=Fira+C), code:css (/* Primary Button */), code:css (.card {), code:css (.input {) (+13 more)

### Community 9 - "Main Application Shell"
Cohesion: 0.1
Nodes (19): A premium productivity application with a dual-identity design:, Brand Identity, Cards, clean & minimal in light mode, deep navy & warm amber in dark mode., Color Usage Rules, Component Patterns, Dual-Mode Identity, Empty States (+11 more)

### Community 10 - "Data Models & Entities"
Cohesion: 0.12
Nodes (18): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, [password, setPassword], passwordError, { register, loading, error }, { register, loading, error: _error } (+10 more)

### Community 11 - "Linting Configuration"
Cohesion: 0.11
Nodes (17): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, met, PASSWORD_RULES, [password, setPassword], passwordError (+9 more)

### Community 12 - "Playwright Testing Config"
Cohesion: 0.14
Nodes (10): ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, useTheme() (+2 more)

### Community 13 - "Tailwind CSS Styling"
Cohesion: 0.14
Nodes (13): createButton, filtered, method, mockTags, mockTasks, newTask, payload, subtaskCheckbox (+5 more)

### Community 14 - "Build & Vite Configuration"
Cohesion: 0.14
Nodes (13): 1) Architectural Style, 2) System Flow, 3) Layer/Module Responsibilities, 4) Reused Patterns, 5) Graphify Insights (Core Abstractions), 5) Known Architectural Risks, 6) Evidence, 6) Known Architectural Risks (+5 more)

### Community 15 - "Project Documentation"
Cohesion: 0.18
Nodes (12): sanitizeEmail(), [email, setEmail], emailError, handleSubmit(), { login, loading }, { login, loading, error }, navigate, [password, setPassword] (+4 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): Browser Support, code:env (# API Configuration), Color Palette, Contributing, Design System, Environment Variables, License, Overview (+4 more)

### Community 17 - "Community 17"
Cohesion: 0.27
Nodes (9): AuthContext, AuthContextType, AuthUser, BackendErrorDetail, extractAccessToken(), formatFirstBackendError(), getAuthErrorMessage(), normalizeAuthUser() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (10): 1) Naming Rules, 2) Formatting and Linting, 3) Import and Module Conventions, 4) Error and Logging Conventions, 5) Testing Conventions, 6) Evidence, code:bash (npm run lint), Coding Conventions (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.18
Nodes (10): 1) Test Stack and Commands, 2) Test Layout, 3) Test Scope Matrix, 4) Mocking and Isolation Strategy, 5) Coverage and Quality Signals, 6) Evidence, code:bash (npm test              # Run Unit tests), Core Sections (Required) (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (10): handleSubmit(), navigate, getPasswordStrength(), normalizeText(), sanitizePassword(), sanitizeUsername(), validatePassword(), handleUpdatePassword() (+2 more)

### Community 21 - "Community 21"
Cohesion: 0.2
Nodes (10): Build, code:bash (# Install dependencies), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:bash (# Start dev server), code:bash (# Build for production), Configuration, Development, Getting Started (+2 more)

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (9): Color Overrides, Component Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides, Tasks Page Overrides (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (9): 1) Top Risks (Prioritized), 2) Technical Debt, 3) Security Concerns, 4) Performance and Scaling Concerns, 5) Fragile/High-Churn Areas, 6) `[ASK USER]` Questions, 7) Evidence, Codebase Concerns (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.2
Nodes (9): 1) Integration Inventory, 2) Data Stores, 3) Secrets and Credentials Handling, 4) Reliability and Failure Behavior, 5) Observability for Integrations, 6) Evidence, Core Sections (Required), Extended Sections (Optional) (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.2
Nodes (9): 1) Runtime Summary, 2) Production Frameworks and Dependencies, 3) Development Toolchain, 4) Key Commands, 5) Environment and Config, 6) Evidence, code:bash (npm install), Core Sections (Required) (+1 more)

### Community 26 - "Community 26"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 27 - "Community 27"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 28 - "Community 28"
Cohesion: 0.2
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.24
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (9): Add a new UI component, Add API integration, Adding New Features, code:bash (# Create in src/components/ui/), code:typescript (// Add new hook to src/hooks/useApi.ts), code:css (:root {), Common Tasks, Customize colors (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (8): 1) Top-Level Map, 2) Entry Points, 3) Module Boundaries, 4) Naming and Organization Rules, 5) Evidence, Codebase Structure, Core Sections (Required), Extended Sections (Optional)

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 35 - "Community 35"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 37 - "Community 37"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 38 - "Community 38"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (47  |             user: { id: "user-1", username: "demo.user), Error details, Instructions, Page snapshot, Test info, Test source

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (28  |   })), Error details, Instructions, Page snapshot, Test info, Test source

### Community 45 - "Community 45"
Cohesion: 0.25
Nodes (8): handleAddSubtask(), handleAttachTag(), handleCreate(), handleCreateAndAttachTag(), handleDelete(), genId(), toast(), handleUpdateUsername()

### Community 46 - "Community 46"
Cohesion: 0.29
Nodes (4): met, PASSWORD_RULES, PasswordStrengthMeterProps, { score, label }

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (6): `dashboard.tsx`, Key Components, `new-task-modal.tsx`, `sidebar.tsx`, `task-card.tsx`, `topnav.tsx`

### Community 48 - "Community 48"
Cohesion: 0.4
Nodes (5): handleCreateProject(), handleDateSelect(), handleDescriptionBlur(), handleTitleBlur(), handleUpdate()

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (5): API Integration, Architecture, code:block1 (src/), code:typescript (// Fetch all tasks), Project Structure

### Community 50 - "Community 50"
Cohesion: 0.4
Nodes (5): Accessibility, Modern React Patterns, Performance, State Management, Type Safety

### Community 51 - "Community 51"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (3): payload, strengthBar, strengthLabel

### Community 54 - "Community 54"
Cohesion: 0.5
Nodes (3): profileLink, sidebar, toggleButton

### Community 55 - "Community 55"
Cohesion: 0.5
Nodes (4): Dashboard Insights, Features, Task Management, User Experience

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (4): Audit Trail, Backend API Docs, API Hooks, Dashboard Page

### Community 57 - "Community 57"
Cohesion: 0.67
Nodes (3): TaskBuddy App, Auth Context, App Icon

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (3): Subtask Model, Tag Model, Task Model

## Knowledge Gaps
- **505 isolated node(s):** `AuditEntry`, `AuditTrailProps`, `isUncompleted`, `isTagAttached`, `isTagDetached` (+500 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Authentication & Authorization` to `Core UI Components`, `User Navigation & Theme`, `Task Management Forms`, `State Management & Actions`, `Theme Utilities`, `Data Models & Entities`, `Linting Configuration`, `Project Documentation`, `Community 17`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Authentication & Authorization` to `Core UI Components`, `User Navigation & Theme`, `Audit & Activity Logging`, `Task Management Forms`, `State Management & Actions`, `Data Models & Entities`, `Linting Configuration`, `Project Documentation`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `cn()` connect `Core UI Components` to `Authentication & Authorization`, `User Navigation & Theme`, `Audit & Activity Logging`, `Task Management Forms`, `State Management & Actions`, `Theme Utilities`, `Community 51`, `Community 52`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `AuditEntry`, `AuditTrailProps`, `isUncompleted` to the rest of the system?**
  _505 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `User Navigation & Theme` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._