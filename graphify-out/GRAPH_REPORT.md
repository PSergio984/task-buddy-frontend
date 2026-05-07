# Graph Report - task-buddy-frontend  (2026-05-07)

## Corpus Check
- 52 files · ~36,469 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 446 nodes · 670 edges · 33 communities (32 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f91e9a2a`
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
- [[_COMMUNITY_Community 32|Community 32]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 27 edges
2. `Task-Buddy Frontend` - 15 edges
3. `useToast()` - 13 edges
4. `cn()` - 13 edges
5. `sanitizePassword()` - 12 edges
6. `Task-Buddy API Integration Guide` - 11 edges
7. `Dashboard()` - 10 edges
8. `useTasks()` - 9 edges
9. `RegisterForm()` - 8 edges
10. `sanitizeUsername()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `TaskBuddy App` --references--> `App Icon`  [INFERRED]
  src/App.tsx → public/task-buddy-icon.svg
- `API Hooks` --implements--> `Backend API Docs`  [INFERRED]
  src/hooks/useApi.ts → API.md
- `handleUpdateUsername()` --calls--> `sanitizeUsername()`  [EXTRACTED]
  src/pages/ProfilePage.tsx → src/lib/auth.ts
- `RegisterForm()` --calls--> `useAuth()`  [EXTRACTED]
  src/components/auth/RegisterForm.tsx → src/contexts/AuthContext.tsx
- `RegisterForm()` --calls--> `useToast()`  [EXTRACTED]
  src/components/auth/RegisterForm.tsx → src/hooks/use-toast.ts

## Communities (33 total, 1 thin omitted)

### Community 0 - "Authentication & Authorization"
Cohesion: 0.06
Nodes (52): met, PASSWORD_RULES, PasswordStrengthMeterProps, { score, label }, RegisterForm(), AuthContext, AuthContextType, AuthUser (+44 more)

### Community 1 - "Core UI Components"
Cohesion: 0.05
Nodes (38): AuditEntry, AuditTrailProps, controller, [currentLimit, setCurrentLimit], [error, setError], filteredLogs, [loading, setLoading], [logs, setLogs] (+30 more)

### Community 2 - "User Navigation & Theme"
Cohesion: 0.05
Nodes (41): Accessibility, Add a new UI component, Add API integration, Adding New Features, API Integration, Architecture, Browser Support, code:block1 (src/) (+33 more)

### Community 3 - "Audit & Activity Logging"
Cohesion: 0.14
Nodes (31): Dashboard(), DashboardProps, Sidebar(), SidebarProps, SystemOverview(), TopNav(), useAuth(), ProtectedRoute() (+23 more)

### Community 4 - "Task Management Forms"
Cohesion: 0.06
Nodes (30): API Endpoints, Base URL Configuration, code:typescript (interface Task {), code:typescript (const { deleteTask, loading, error } = useDeleteTask();), code:typescript (const { tasks, loading, error } = useTasks();), code:block12 (Content-Type: application/json), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:typescript (const { createTask, loading } = useCreateTask();) (+22 more)

### Community 5 - "State Management & Actions"
Cohesion: 0.14
Nodes (17): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+9 more)

### Community 6 - "Theme Utilities"
Cohesion: 0.13
Nodes (11): ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, useTheme() (+3 more)

### Community 7 - "Testing & Validation"
Cohesion: 0.15
Nodes (12): [confirmPassword, setConfirmPassword], [currentPassword, setCurrentPassword], handleUpdateUsername(), [isUpdatingPassword, setIsUpdatingPassword], [isUpdatingUsername, setIsUpdatingUsername], met, navigate, [newPassword, setNewPassword] (+4 more)

### Community 8 - "API Documentation & Integration"
Cohesion: 0.2
Nodes (10): Build, code:bash (# Install dependencies), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:bash (# Start dev server), code:bash (# Build for production), Configuration, Development, Getting Started (+2 more)

### Community 9 - "Main Application Shell"
Cohesion: 0.2
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 10 - "Data Models & Entities"
Cohesion: 0.24
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 11 - "Linting Configuration"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 12 - "Playwright Testing Config"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 13 - "Tailwind CSS Styling"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 14 - "Build & Vite Configuration"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 15 - "Project Documentation"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (47  |             user: { id: "user-1", username: "demo.user), Error details, Instructions, Page snapshot, Test info, Test source

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 22 - "Community 22"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 23 - "Community 23"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (28  |   })), Error details, Instructions, Page snapshot, Test info, Test source

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (3): payload, strengthBar, strengthLabel

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (4): Audit Trail, Backend API Docs, API Hooks, Dashboard Page

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (3): TaskBuddy App, Auth Context, App Icon

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (3): Subtask Model, Tag Model, Task Model

## Knowledge Gaps
- **233 isolated node(s):** `{ token }`, `AuditEntry`, `AuditTrailProps`, `[logs, setLogs]`, `[currentLimit, setCurrentLimit]` (+228 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Audit & Activity Logging` to `Authentication & Authorization`, `Core UI Components`, `Theme Utilities`, `Testing & Validation`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Task-Buddy Frontend` connect `User Navigation & Theme` to `API Documentation & Integration`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `cn()` connect `Core UI Components` to `Audit & Activity Logging`, `State Management & Actions`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `{ token }`, `AuditEntry`, `AuditTrailProps` to the rest of the system?**
  _233 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `User Navigation & Theme` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._