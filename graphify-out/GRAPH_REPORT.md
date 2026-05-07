# Graph Report - .  (2026-05-07)

## Corpus Check
- Corpus is ~36,384 words - fits in a single context window. You may not need a graph.

## Summary
- 213 nodes · 422 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 1,500 input · 500 output

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
- [[_COMMUNITY_Project Documentation|Project Documentation]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 25 edges
2. `cn()` - 12 edges
3. `useToast()` - 11 edges
4. `sanitizePassword()` - 11 edges
5. `Dashboard()` - 10 edges
6. `useTasks()` - 9 edges
7. `Sidebar()` - 7 edges
8. `TopNav()` - 7 edges
9. `Card` - 7 edges
10. `sanitizeUsername()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `TaskBuddy App` --references--> `App Icon`  [INFERRED]
  src/App.tsx → public/task-buddy-icon.svg
- `API Hooks` --implements--> `Backend API Docs`  [INFERRED]
  src/hooks/useApi.ts → API.md
- `handleUpdateUsername()` --calls--> `sanitizeUsername()`  [EXTRACTED]
  src/pages/ProfilePage.tsx → src/lib/auth.ts
- `useDeleteTag()` --calls--> `useAuth()`  [EXTRACTED]
  src/hooks/useApi.ts → src/contexts/AuthContext.tsx
- `DashboardLayout()` --calls--> `useCreateTask()`  [EXTRACTED]
  src/App.tsx → src/hooks/useApi.ts

## Communities (16 total, 1 thin omitted)

### Community 0 - "Authentication & Authorization"
Cohesion: 0.07
Nodes (47): AuthContext, AuthContextType, AuthUser, BackendErrorDetail, extractAccessToken(), formatFirstBackendError(), getAuthErrorMessage(), getPasswordStrength() (+39 more)

### Community 1 - "Core UI Components"
Cohesion: 0.15
Nodes (29): Dashboard(), DashboardProps, Sidebar(), SidebarProps, SystemOverview(), TopNav(), useAuth(), ProtectedRoute() (+21 more)

### Community 2 - "User Navigation & Theme"
Cohesion: 0.1
Nodes (19): LogoutDialogProps, useTheme(), ThemeToggle(), TopNavProps, [confirmPassword, setConfirmPassword], [currentPassword, setCurrentPassword], handleUpdateUsername(), [isUpdatingPassword, setIsUpdatingPassword] (+11 more)

### Community 3 - "Audit & Activity Logging"
Cohesion: 0.09
Nodes (19): AuditEntry, controller, [error, setError], filteredLogs, [loading, setLoading], [logs, setLogs], [search, setSearch], { token } (+11 more)

### Community 4 - "Task Management Forms"
Cohesion: 0.13
Nodes (13): [category, setCategory], [description, setDescription], [dueDate, setDueDate], NewTaskModalProps, [priority, setPriority], [title, setTitle], cn(), InputProps (+5 more)

### Community 5 - "State Management & Actions"
Cohesion: 0.14
Nodes (17): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+9 more)

### Community 6 - "Theme Utilities"
Cohesion: 0.15
Nodes (8): ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, AuthProvider()

### Community 7 - "Testing & Validation"
Cohesion: 0.5
Nodes (3): payload, strengthBar, strengthLabel

### Community 8 - "API Documentation & Integration"
Cohesion: 0.5
Nodes (4): Audit Trail, Backend API Docs, API Hooks, Dashboard Page

### Community 9 - "Main Application Shell"
Cohesion: 0.67
Nodes (3): TaskBuddy App, Auth Context, App Icon

### Community 10 - "Data Models & Entities"
Cohesion: 0.67
Nodes (3): Subtask Model, Tag Model, Task Model

## Knowledge Gaps
- **104 isolated node(s):** `{ token }`, `AuditEntry`, `[logs, setLogs]`, `[loading, setLoading]`, `[error, setError]` (+99 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Core UI Components` to `Authentication & Authorization`, `User Navigation & Theme`, `Audit & Activity Logging`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `cn()` connect `Task Management Forms` to `Core UI Components`, `User Navigation & Theme`, `Audit & Activity Logging`, `State Management & Actions`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Core UI Components` to `Authentication & Authorization`, `User Navigation & Theme`, `State Management & Actions`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **What connects `{ token }`, `AuditEntry`, `[logs, setLogs]` to the rest of the system?**
  _104 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `User Navigation & Theme` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Audit & Activity Logging` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._