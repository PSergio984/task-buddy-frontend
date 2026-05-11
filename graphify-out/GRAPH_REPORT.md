# Graph Report - task-buddy-frontend  (2026-05-11)

## Corpus Check
- 92 files · ~127,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 958 nodes · 1551 edges · 78 communities (74 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `043a9bc2`
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
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 77|Community 77]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 44 edges
2. `cn()` - 35 edges
3. `useToast()` - 24 edges
4. `useTaskDrawerState()` - 16 edges
5. `toast()` - 15 edges
6. `Task-Buddy Frontend` - 15 edges
7. `Task` - 14 edges
8. `sanitizePassword()` - 13 edges
9. `TasksPage()` - 13 edges
10. `Task-Buddy API Integration Guide` - 11 edges

## Surprising Connections (you probably didn't know these)
- `TaskBuddy App` --references--> `App Icon`  [INFERRED]
  src/App.tsx → public/task-buddy-icon.svg
- `API Hooks` --implements--> `Backend API Docs`  [INFERRED]
  src/hooks/useApi.ts → API.md
- `App()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.tsx → src/contexts/AuthContext.tsx
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/components/create-project-modal.tsx → src/hooks/use-toast.ts
- `handleSubmit()` --calls--> `sanitizeUsername()`  [EXTRACTED]
  src/components/auth/RegisterForm.tsx → src/lib/auth.ts

## Communities (78 total, 4 thin omitted)

### Community 0 - "Authentication & Authorization"
Cohesion: 0.06
Nodes (64): Dashboard(), { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId 
  }, categories, { data: groups = [] }, { data: projects = [] }, { data: tags = [] }, { groups }, handleLogout() (+56 more)

### Community 1 - "Core UI Components"
Cohesion: 0.04
Nodes (45): attachTag, createSubtask, createTag, createTask, { data: allTags = [] }, { data: fetchedTask }, { data: projects = [] }, [deleteSnapshot, setDeleteSnapshot] (+37 more)

### Community 2 - "User Navigation & Theme"
Cohesion: 0.06
Nodes (34): [color, setColor], COLORS, createProject, CreateProjectModalProps, handleSubmit(), [name, setName], { toast }, handleAddSubtask() (+26 more)

### Community 3 - "Audit & Activity Logging"
Cohesion: 0.06
Nodes (29): [color, setColor], COLORS, createGroup, CreateGroupModalProps, [name, setName], { toast }, [activeTab, setActiveTab], DashboardProps (+21 more)

### Community 4 - "Task Management Forms"
Cohesion: 0.06
Nodes (28): AuditEntry, AuditTrailProps, controller, [currentLimit, setCurrentLimit], [error, setError], EXCLUDED_ACTIONS, fetchAuditLog, fieldChanges (+20 more)

### Community 5 - "State Management & Actions"
Cohesion: 0.06
Nodes (30): API Endpoints, Base URL Configuration, code:typescript (interface Task {), code:typescript (const { deleteTask, loading, error } = useDeleteTask();), code:typescript (const { tasks, loading, error } = useTasks();), code:block12 (Content-Type: application/json), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:typescript (const { createTask, loading } = useCreateTask();) (+22 more)

### Community 6 - "Theme Utilities"
Cohesion: 0.11
Nodes (21): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, handleSubmit(), navigate, [password, setPassword], passwordError (+13 more)

### Community 7 - "Testing & Validation"
Cohesion: 0.09
Nodes (21): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, code:css (@import url('https://fonts.googleapis.com/css2?family=Fira+C), code:css (/* Primary Button */), code:css (.card {), code:css (.input {) (+13 more)

### Community 8 - "API Documentation & Integration"
Cohesion: 0.1
Nodes (20): sanitizeUsername(), [confirmPassword, setConfirmPassword], [currentPassword, setCurrentPassword], getErrorMessage(), handleUpdateUsername(), [isInitialized, setIsInitialized], [isUpdatingPassword, setIsUpdatingPassword], [isUpdatingUsername, setIsUpdatingUsername] (+12 more)

### Community 9 - "Main Application Shell"
Cohesion: 0.12
Nodes (15): Project, DirtySections, [hours, minutes], MetaSidebar(), MetaSidebarProps, newDate, [popoverOpen, setPopoverOpen], PRIORITY_STYLES (+7 more)

### Community 10 - "Data Models & Entities"
Cohesion: 0.13
Nodes (17): Tag, TaskPriority, tasksApi, {
    data: task,
    isLoading,
    error,
  }, deleteMutation, { id }, [isDeleting, setIsDeleting], navigate (+9 more)

### Community 11 - "Linting Configuration"
Cohesion: 0.12
Nodes (13): useCreateProject(), Group, isLogoutRequest, projectsApi, Subtask, subtasksApi, TagDistribution, tagsApi (+5 more)

### Community 12 - "Playwright Testing Config"
Cohesion: 0.11
Nodes (19): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, handleSubmit(), met, navigate, PASSWORD_RULES (+11 more)

### Community 13 - "Tailwind CSS Styling"
Cohesion: 0.1
Nodes (19): A premium productivity application with a dual-identity design:, Brand Identity, Cards, clean & minimal in light mode, deep navy & warm amber in dark mode., Color Usage Rules, Component Patterns, Dual-Mode Identity, Empty States (+11 more)

### Community 14 - "Build & Vite Configuration"
Cohesion: 0.11
Nodes (14): [category, setCategory], { data: groups = [] }, { data: projects = [] }, [description, setDescription], [dueDate, setDueDate], [groupId, setGroupId], { groups }, [lastOpen, setLastOpen] (+6 more)

### Community 15 - "Project Documentation"
Cohesion: 0.32
Nodes (15): useProjects(), useTags(), useTaskDrawerState(), UseTaskDrawerStateProps, useAttachTag(), useCreateSubtask(), useCreateTag(), useCreateTask() (+7 more)

### Community 16 - "Community 16"
Cohesion: 0.19
Nodes (8): ColorIconPickerProps, PRESET_COLORS, PRESET_ICONS, cn(), result, InputProps, labelVariants, TextareaProps

### Community 17 - "Community 17"
Cohesion: 0.15
Nodes (8): LogoutDialogProps, containerVariants, itemVariants, buttonVariants, extraProps, isDisabled, Calendar(), CalendarProps

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (13): bold(), createdName, fieldChanges, fieldsMatch, getAuditIcon(), handleTaskUpdate(), IconConfig, name (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.19
Nodes (10): TaskCard(), LayoutContext, PRIORITY_ORDER, SORT_LABELS, SortMode, Badge(), BadgeProps, badgeVariants (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (8): ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, AuthProvider()

### Community 21 - "Community 21"
Cohesion: 0.14
Nodes (13): createButton, filtered, method, mockTags, mockTasks, newTask, payload, subtaskCheckbox (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): 1) Architectural Style, 2) System Flow, 3) Layer/Module Responsibilities, 4) Reused Patterns, 5) Graphify Insights (Core Abstractions), 5) Known Architectural Risks, 6) Evidence, 6) Known Architectural Risks (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.23
Nodes (11): AuthContext, AuthContextType, AuthUser, BackendErrorDetail, extractAccessToken(), formatFirstBackendError(), getAuthErrorMessage(), getPasswordStrength() (+3 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (12): sanitizeEmail(), [email, setEmail], emailError, handleSubmit(), { login, loading }, { login, loading, error }, navigate, [password, setPassword] (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): Browser Support, code:env (# API Configuration), Color Palette, Contributing, Design System, Environment Variables, License, Overview (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (11): API Integration, Architecture, code:block1 (src/), code:typescript (// Fetch all tasks), `dashboard.tsx`, Key Components, `new-task-modal.tsx`, Project Structure (+3 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (10): 1) Naming Rules, 2) Formatting and Linting, 3) Import and Module Conventions, 4) Error and Logging Conventions, 5) Testing Conventions, 6) Evidence, code:bash (npm run lint), Coding Conventions (+2 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (10): 1) Test Stack and Commands, 2) Test Layout, 3) Test Scope Matrix, 4) Mocking and Isolation Strategy, 5) Coverage and Quality Signals, 6) Evidence, code:bash (npm test              # Run Unit tests), Core Sections (Required) (+2 more)

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (5): categoryConfig, priorityConfig, TaskCardProps, Task, DropdownMenu()

### Community 30 - "Community 30"
Cohesion: 0.2
Nodes (10): Build, code:bash (# Install dependencies), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:bash (# Start dev server), code:bash (# Build for production), Configuration, Development, Getting Started (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.2
Nodes (9): Color Overrides, Component Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides, Tasks Page Overrides (+1 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (9): 1) Top Risks (Prioritized), 2) Technical Debt, 3) Security Concerns, 4) Performance and Scaling Concerns, 5) Fragile/High-Churn Areas, 6) `[ASK USER]` Questions, 7) Evidence, Codebase Concerns (+1 more)

### Community 33 - "Community 33"
Cohesion: 0.2
Nodes (9): 1) Integration Inventory, 2) Data Stores, 3) Secrets and Credentials Handling, 4) Reliability and Failure Behavior, 5) Observability for Integrations, 6) Evidence, Core Sections (Required), Extended Sections (Optional) (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.2
Nodes (9): 1) Runtime Summary, 2) Production Frameworks and Dependencies, 3) Development Toolchain, 4) Key Commands, 5) Environment and Config, 6) Evidence, code:bash (npm install), Core Sections (Required) (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.2
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.24
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.22
Nodes (8): 1. Karpathy Behavioral Guidelines, 2. Type Safety & Standards, 3. Accessibility (WCAG), 4. React 19 Compatibility, 5. Code Quality & Patterns, 6. Project-Specific Context, code:tsx (// Correct), Frontend Standards & Guidelines (Task Buddy)

### Community 40 - "Community 40"
Cohesion: 0.22
Nodes (9): Add a new UI component, Add API integration, Adding New Features, code:bash (# Create in src/components/ui/), code:typescript (// Add new hook to src/hooks/useApi.ts), code:css (:root {), Common Tasks, Customize colors (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (8): 1) Top-Level Map, 2) Entry Points, 3) Module Boundaries, 4) Naming and Organization Rules, 5) Evidence, Codebase Structure, Core Sections (Required), Extended Sections (Optional)

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (47  |             user: { id: "user-1", username: "demo.user), Error details, Instructions, Page snapshot, Test info, Test source

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (28  |   })), Error details, Instructions, Page snapshot, Test info, Test source

### Community 55 - "Community 55"
Cohesion: 0.29
Nodes (4): met, PASSWORD_RULES, PasswordStrengthMeterProps, { score, label }

### Community 56 - "Community 56"
Cohesion: 0.33
Nodes (5): useAuditTrail(), UseAuditTrailOptions, api, AuditEntry, groupByDate()

### Community 57 - "Community 57"
Cohesion: 0.33
Nodes (5): code:tsx (import { Button } from "@/components/ui/button"), code:bash (git add src/components/task-drawer/MetaSidebar.tsx), Fix Missing Button Import in MetaSidebar Implementation Plan, Task 1: Add Button Import to MetaSidebar.tsx, Task 2: Verification

### Community 58 - "Community 58"
Cohesion: 0.4
Nodes (5): handleCreateProject(), handleDateSelect(), handleDescriptionBlur(), handleTitleBlur(), handleUpdate()

### Community 59 - "Community 59"
Cohesion: 0.4
Nodes (5): Accessibility, Modern React Patterns, Performance, State Management, Type Safety

### Community 61 - "Community 61"
Cohesion: 0.5
Nodes (3): payload, strengthBar, strengthLabel

### Community 62 - "Community 62"
Cohesion: 0.5
Nodes (3): profileLink, sidebar, toggleButton

### Community 63 - "Community 63"
Cohesion: 0.5
Nodes (4): Dashboard Insights, Features, Task Management, User Experience

### Community 64 - "Community 64"
Cohesion: 0.5
Nodes (4): Audit Trail, Backend API Docs, API Hooks, Dashboard Page

### Community 65 - "Community 65"
Cohesion: 1.0
Nodes (3): sanitizePassword(), validatePassword(), handleUpdatePassword()

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (3): TaskBuddy App, Auth Context, App Icon

### Community 67 - "Community 67"
Cohesion: 0.67
Nodes (3): Subtask Model, Tag Model, Task Model

## Knowledge Gaps
- **543 isolated node(s):** `AuditTrailProps`, `{
    loading, error, search, setSearch,
    currentLimit, setCurrentLimit,
    filteredLogs, groupedLogs, fetchAuditLog
  }`, `skeletonIds`, `PRESET_ICONS`, `ColorIconPickerProps` (+538 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Authentication & Authorization` to `Audit & Activity Logging`, `Task Management Forms`, `Theme Utilities`, `API Documentation & Integration`, `Linting Configuration`, `Playwright Testing Config`, `Project Documentation`, `Community 19`, `Community 23`, `Community 56`, `Community 24`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 16` to `Authentication & Authorization`, `Core UI Components`, `User Navigation & Theme`, `Audit & Activity Logging`, `Task Management Forms`, `API Documentation & Integration`, `Main Application Shell`, `Data Models & Entities`, `Linting Configuration`, `Build & Vite Configuration`, `Community 17`, `Community 19`, `Community 60`, `Community 29`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Authentication & Authorization` to `Core UI Components`, `User Navigation & Theme`, `Audit & Activity Logging`, `Theme Utilities`, `API Documentation & Integration`, `Data Models & Entities`, `Playwright Testing Config`, `Project Documentation`, `Community 19`, `Community 24`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `AuditTrailProps`, `{
    loading, error, search, setSearch,
    currentLimit, setCurrentLimit,
    filteredLogs, groupedLogs, fetchAuditLog
  }`, `skeletonIds` to the rest of the system?**
  _543 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `User Navigation & Theme` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._