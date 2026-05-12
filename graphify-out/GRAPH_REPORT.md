# Graph Report - task-buddy-frontend  (2026-05-12)

## Corpus Check
- 106 files · ~135,556 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1105 nodes · 1762 edges · 86 communities (82 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8b64e86f`
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
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 85|Community 85]]

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 44 edges
2. `cn()` - 38 edges
3. `useToast()` - 27 edges
4. `toast()` - 17 edges
5. `useTaskDrawerState()` - 16 edges
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
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/components/create-project-modal.tsx → src/hooks/use-toast.ts
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/components/create-tag-modal.tsx → src/hooks/use-toast.ts
- `handleSubmit()` --calls--> `toast()`  [EXTRACTED]
  src/pages/ForgotPasswordPage.tsx → src/hooks/use-toast.ts

## Communities (86 total, 4 thin omitted)

### Community 0 - "Authentication & Authorization"
Cohesion: 0.06
Nodes (55): [activeTab, setActiveTab], DashboardProps, filteredTasks, handleDelete, handleDeleteSubtask, handleDetachTag, handleToggleComplete, handleToggleSubtask (+47 more)

### Community 1 - "Core UI Components"
Cohesion: 0.07
Nodes (51): Dashboard(), LogoutDialogProps, NewTaskModal(), Sidebar(), TopNav(), TopNavProps, useAuth(), FilterContext (+43 more)

### Community 2 - "User Navigation & Theme"
Cohesion: 0.04
Nodes (46): attachTag, createSubtask, createTag, createTask, { data: allTags = [] }, { data: fetchedTask }, { data: projects = [] }, [deleteSnapshot, setDeleteSnapshot] (+38 more)

### Community 3 - "Audit & Activity Logging"
Cohesion: 0.05
Nodes (38): ColorIconPickerProps, PRESET_COLORS, PRESET_ICONS, [color, setColor], COLORS, createProject, CreateProjectModalProps, handleSubmit() (+30 more)

### Community 4 - "Task Management Forms"
Cohesion: 0.06
Nodes (36): [color, setColor], COLORS, createGroup, CreateGroupModalProps, [name, setName], { toast }, { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId 
  }, { 
    activeSidebarFilter, 
    setActiveSidebarFilter,
    activeTagId,
    setActiveTagId,
    setSelectedPriorities,
    setSelectedProjects,
    setSelectedTags
  } (+28 more)

### Community 5 - "State Management & Actions"
Cohesion: 0.06
Nodes (29): AuditEntry, AuditTrailProps, controller, [currentLimit, setCurrentLimit], [error, setError], EXCLUDED_ACTIONS, fetchAuditLog, fieldChanges (+21 more)

### Community 6 - "Theme Utilities"
Cohesion: 0.06
Nodes (30): API Endpoints, Base URL Configuration, code:typescript (interface Task {), code:typescript (const { deleteTask, loading, error } = useDeleteTask();), code:typescript (const { tasks, loading, error } = useTasks();), code:block12 (Content-Type: application/json), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:typescript (const { createTask, loading } = useCreateTask();) (+22 more)

### Community 7 - "Testing & Validation"
Cohesion: 0.1
Nodes (16): [category, setCategory], { data: groups = [] }, { data: projects = [] }, [description, setDescription], [dueDate, setDueDate], [groupId, setGroupId], { groups }, [lastOpen, setLastOpen] (+8 more)

### Community 8 - "API Documentation & Integration"
Cohesion: 0.09
Nodes (21): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, code:css (@import url('https://fonts.googleapis.com/css2?family=Fira+C), code:css (/* Primary Button */), code:css (.card {), code:css (.input {) (+13 more)

### Community 9 - "Main Application Shell"
Cohesion: 0.15
Nodes (10): { activeSidebarFilter, setActiveSidebarFilter, activeTagId, setActiveTagId }, { data: projects = [] }, { data: tags = [] }, MobileDrawerProps, cn(), result, InputProps, labelVariants (+2 more)

### Community 10 - "Data Models & Entities"
Cohesion: 0.11
Nodes (19): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, handleSubmit(), met, navigate, PASSWORD_RULES (+11 more)

### Community 11 - "Linting Configuration"
Cohesion: 0.12
Nodes (19): [confirmPassword, setConfirmPassword], confirmPasswordError, [email, setEmail], emailError, [password, setPassword], passwordError, { register, loading }, { register, loading, error } (+11 more)

### Community 12 - "Playwright Testing Config"
Cohesion: 0.13
Nodes (17): Tag, TaskPriority, {
    data: task,
    isLoading,
    error,
  }, deleteMutation, { id }, [isDeleting, setIsDeleting], navigate, queryClient (+9 more)

### Community 13 - "Tailwind CSS Styling"
Cohesion: 0.11
Nodes (18): bold(), createdName, date, fieldChanges, fieldsMatch, getAuditIcon(), handleTaskUpdate(), IconConfig (+10 more)

### Community 14 - "Build & Vite Configuration"
Cohesion: 0.1
Nodes (19): A premium productivity application with a dual-identity design:, Brand Identity, Cards, clean & minimal in light mode, deep navy & warm amber in dark mode., Color Usage Rules, Component Patterns, Dual-Mode Identity, Empty States (+11 more)

### Community 15 - "Project Documentation"
Cohesion: 0.11
Nodes (18): [confirmPassword, setConfirmPassword], [currentPassword, setCurrentPassword], [isInitialized, setIsInitialized], [isUpdatingPassword, setIsUpdatingPassword], [isUpdatingUsername, setIsUpdatingUsername], { logout }, met, navigate (+10 more)

### Community 16 - "Community 16"
Cohesion: 0.14
Nodes (11): categoryConfig, priorityConfig, TaskCard(), TaskCardProps, SettingsContext, SettingsContextType, SettingsProvider(), { result } (+3 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (14): Project, DirtySections, [hours, minutes], MetaSidebar(), MetaSidebarProps, newDate, [popoverOpen, setPopoverOpen], PRIORITY_STYLES (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (10): ResolvedTheme, Theme, THEME_VALUES, ThemeProvider(), ThemeProviderContext, ThemeProviderProps, ThemeProviderState, useTheme() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (10): SelectScrollDownButton, SelectScrollUpButton, SelectTrigger, [inputValue, setInputValue], [isOpen, setIsOpen], [prevValue, setPrevValue], suggestions, { timeFormat } (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (16): code:html (<!-- In <head> -->), code:bash (git commit -m "chore: finalize mobile nav integration"), code:css (/* Add to end of src/index.css */), code:bash (git add index.html src/index.css), code:tsx (import { motion } from "framer-motion"), code:bash (git add src/components/layout/mobile-nav.tsx), code:tsx (import { Sheet, SheetContent, SheetHeader, SheetTitle } from), code:bash (git add src/components/layout/mobile-drawer.tsx) (+8 more)

### Community 21 - "Community 21"
Cohesion: 0.13
Nodes (11): BeforeInstallPromptEvent, [deferredPrompt, setDeferredPrompt], [isIOS], [isIOS, setIsIOS], [isStandalone], [isStandalone, setIsStandalone], [isVisible, setIsVisible], PwaInstallButtonProps (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (13): createButton, filtered, method, mockTags, mockTasks, newTask, payload, subtaskCheckbox (+5 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (13): 1) Architectural Style, 2) System Flow, 3) Layer/Module Responsibilities, 4) Reused Patterns, 5) Graphify Insights (Core Abstractions), 5) Known Architectural Risks, 6) Evidence, 6) Known Architectural Risks (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (12): sanitizeEmail(), [email, setEmail], emailError, handleSubmit(), { login, loading }, { login, loading, error }, navigate, [password, setPassword] (+4 more)

### Community 25 - "Community 25"
Cohesion: 0.15
Nodes (12): Browser Support, code:env (# API Configuration), Color Palette, Contributing, Design System, Environment Variables, License, Overview (+4 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (12): Audit Trail Context & Time Formatting Implementation Plan, code:typescript (// src/lib/audit-trail-helpers.tsx), code:bash (git add src/lib/audit-trail-helpers.tsx), code:typescript (// src/components/audit-trail.tsx), code:bash (git add src/components/audit-trail.tsx), code:typescript (// src/components/task-card.tsx), code:bash (git add src/components/task-card.tsx), code:bash (npm run lint) (+4 more)

### Community 27 - "Community 27"
Cohesion: 0.15
Nodes (12): code:typescript (import { renderHook, act } from "@testing-library/react"), code:typescript (import React, { createContext, useContext, useState, useEffe), code:bash (git add src/contexts/SettingsContext.tsx src/contexts/Settin), code:typescript (// src/App.tsx), code:bash (git add src/App.tsx), code:typescript (// src/pages/ProfilePage.tsx), code:typescript (export function ProfilePage() {), code:bash (git add src/pages/ProfilePage.tsx) (+4 more)

### Community 28 - "Community 28"
Cohesion: 0.27
Nodes (9): AuthContext, AuthContextType, AuthUser, BackendErrorDetail, extractAccessToken(), formatFirstBackendError(), getAuthErrorMessage(), normalizeAuthUser() (+1 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (10): 1) Naming Rules, 2) Formatting and Linting, 3) Import and Module Conventions, 4) Error and Logging Conventions, 5) Testing Conventions, 6) Evidence, code:bash (npm run lint), Coding Conventions (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.18
Nodes (10): 1) Test Stack and Commands, 2) Test Layout, 3) Test Scope Matrix, 4) Mocking and Isolation Strategy, 5) Coverage and Quality Signals, 6) Evidence, code:bash (npm test              # Run Unit tests), Core Sections (Required) (+2 more)

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (10): handleSubmit(), navigate, getPasswordStrength(), normalizeText(), sanitizePassword(), sanitizeUsername(), validatePassword(), getErrorMessage() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.2
Nodes (10): Build, code:bash (# Install dependencies), code:env (VITE_API_BASE_URL=http://127.0.0.1:8000), code:bash (# Start dev server), code:bash (# Build for production), Configuration, Development, Getting Started (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.2
Nodes (9): Color Overrides, Component Overrides, Layout Overrides, Page-Specific Components, Page-Specific Rules, Recommendations, Spacing Overrides, Tasks Page Overrides (+1 more)

### Community 34 - "Community 34"
Cohesion: 0.2
Nodes (9): 1) Top Risks (Prioritized), 2) Technical Debt, 3) Security Concerns, 4) Performance and Scaling Concerns, 5) Fragile/High-Churn Areas, 6) `[ASK USER]` Questions, 7) Evidence, Codebase Concerns (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.2
Nodes (9): 1) Integration Inventory, 2) Data Stores, 3) Secrets and Credentials Handling, 4) Reliability and Failure Behavior, 5) Observability for Integrations, 6) Evidence, Core Sections (Required), Extended Sections (Optional) (+1 more)

### Community 36 - "Community 36"
Cohesion: 0.2
Nodes (9): 1) Runtime Summary, 2) Production Frameworks and Dependencies, 3) Development Toolchain, 4) Key Commands, 5) Environment and Config, 6) Evidence, code:bash (npm install), Core Sections (Required) (+1 more)

### Community 37 - "Community 37"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 38 - "Community 38"
Cohesion: 0.2
Nodes (9): code:block1 (TypeError: Cannot read properties of null (reading 'complete), code:block2 (Error: page.waitForTimeout: Target page, context or browser ), code:yaml (- generic [ref=e2]:), code:ts (42  |     await page.route("**/api/v1/tasks/**", async (rout), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (9): code:block1 (Test timeout of 30000ms exceeded.), code:block2 (Error: locator.fill: Test timeout of 30000ms exceeded.), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info (+1 more)

### Community 41 - "Community 41"
Cohesion: 0.22
Nodes (8): 1. Karpathy Behavioral Guidelines, 2. Type Safety & Standards, 3. Accessibility (WCAG), 4. React 19 Compatibility, 5. Code Quality & Patterns, 6. Project-Specific Context, code:tsx (// Correct), Frontend Standards & Guidelines (Task Buddy)

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (9): Add a new UI component, Add API integration, Adding New Features, code:bash (# Create in src/components/ui/), code:typescript (// Add new hook to src/hooks/useApi.ts), code:css (:root {), Common Tasks, Customize colors (+1 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (8): 1) Top-Level Map, 2) Entry Points, 3) Module Boundaries, 4) Naming and Organization Rules, 5) Evidence, Codebase Structure, Core Sections (Required), Extended Sections (Optional)

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (8): Automated Tests, code:tsx (import { useSettings } from "@/contexts/SettingsContext"), Manual Verification, Task 1: Refactor TimePicker with Format Support and Suggestions, Task 2: Integrate Time Format in NewTaskModal, Task 3: Integrate Time Format in MetaSidebar, Time System Refinement Implementation Plan, Verification Plan

### Community 45 - "Community 45"
Cohesion: 0.22
Nodes (8): Application Integration, Architecture, Data Flow, Global Settings Management Design, ProfilePage Preferences Section, SettingsContext, Success Criteria, Testing Strategy

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 47 - "Community 47"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (7): code:block1 (Error: expect(locator).toBeDisabled() failed), code:yaml (- generic [ref=e2]:), Error details, Instructions, Page snapshot, Test info, Test source

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeEnabled() failed), code:yaml (- generic [ref=e2]:), code:ts (4   |   test.beforeEach(async ({ page }) => {), Error details, Instructions, Page snapshot, Test info, Test source

### Community 52 - "Community 52"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e2]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toContainText(expected) failed), code:yaml (- generic [ref=e2]:), code:ts (48  |           }),), Error details, Instructions, Page snapshot, Test info, Test source

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 55 - "Community 55"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (47  |             user: { id: "user-1", username: "demo.user), Error details, Instructions, Page snapshot, Test info, Test source

### Community 56 - "Community 56"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 57 - "Community 57"
Cohesion: 0.22
Nodes (8): code:block1 (Error: expect(locator).toBeVisible() failed), code:yaml (- generic [ref=e5]:), code:ts (1   | import { test, expect } from "@playwright/test"), Error details, Instructions, Page snapshot, Test info, Test source

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (8): code:block1 (Error: locator.fill: Error: strict mode violation: getByLabe), code:yaml (- generic [ref=e5]:), code:ts (28  |   })), Error details, Instructions, Page snapshot, Test info, Test source

### Community 59 - "Community 59"
Cohesion: 0.25
Nodes (7): 1. Objective, 2.1 MobileNav (`components/layout/mobile-nav.tsx`), 2.2 MobileDrawer (`components/layout/mobile-drawer.tsx`), 2. Components, 3. Technical Integration, 4. Success Criteria, Design Spec: Mobile Navigation & PWA Polish

### Community 60 - "Community 60"
Cohesion: 0.29
Nodes (7): handleAddSubtask(), handleAttachTag(), handleCreate(), handleCreateAndAttachTag(), handleDelete(), genId(), toast()

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (4): met, PASSWORD_RULES, PasswordStrengthMeterProps, { score, label }

### Community 62 - "Community 62"
Cohesion: 0.29
Nodes (6): code:typescript (export function useCreateTag() {), Sidebar & Tag Creation Implementation Plan, Task 1: API and Hook Infrastructure, Task 2: CreateTagModal Component, Task 3: Sidebar Refactor (Collapsibility & Dynamic Icons), Task 4: Centering & UI Polish

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (5): useAuditTrail(), UseAuditTrailOptions, api, AuditEntry, groupByDate()

### Community 64 - "Community 64"
Cohesion: 0.33
Nodes (6): `dashboard.tsx`, Key Components, `new-task-modal.tsx`, `sidebar.tsx`, `task-card.tsx`, `topnav.tsx`

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (5): code:tsx (import { Button } from "@/components/ui/button"), code:bash (git add src/components/task-drawer/MetaSidebar.tsx), Fix Missing Button Import in MetaSidebar Implementation Plan, Task 1: Add Button Import to MetaSidebar.tsx, Task 2: Verification

### Community 66 - "Community 66"
Cohesion: 0.4
Nodes (5): handleCreateProject(), handleDateSelect(), handleDescriptionBlur(), handleTitleBlur(), handleUpdate()

### Community 67 - "Community 67"
Cohesion: 0.4
Nodes (5): API Integration, Architecture, code:block1 (src/), code:typescript (// Fetch all tasks), Project Structure

### Community 68 - "Community 68"
Cohesion: 0.4
Nodes (5): Accessibility, Modern React Patterns, Performance, State Management, Type Safety

### Community 70 - "Community 70"
Cohesion: 0.5
Nodes (3): payload, strengthBar, strengthLabel

### Community 71 - "Community 71"
Cohesion: 0.5
Nodes (3): profileLink, sidebar, toggleButton

### Community 72 - "Community 72"
Cohesion: 0.5
Nodes (4): Dashboard Insights, Features, Task Management, User Experience

### Community 73 - "Community 73"
Cohesion: 0.5
Nodes (4): Audit Trail, Backend API Docs, API Hooks, Dashboard Page

### Community 74 - "Community 74"
Cohesion: 0.67
Nodes (3): TaskBuddy App, Auth Context, App Icon

### Community 75 - "Community 75"
Cohesion: 0.67
Nodes (3): Subtask Model, Tag Model, Task Model

## Knowledge Gaps
- **631 isolated node(s):** `AuditTrailProps`, `{
    loading, error, search, setSearch,
    currentLimit, setCurrentLimit,
    filteredLogs, groupedLogs, fetchAuditLog
  }`, `skeletonIds`, `{ timeFormat }`, `ColorIconPickerProps` (+626 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Main Application Shell` to `Authentication & Authorization`, `Core UI Components`, `User Navigation & Theme`, `Audit & Activity Logging`, `Task Management Forms`, `State Management & Actions`, `Community 69`, `Testing & Validation`, `Playwright Testing Config`, `Project Documentation`, `Community 16`, `Community 17`, `Community 19`, `Community 21`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Core UI Components` to `Authentication & Authorization`, `Task Management Forms`, `State Management & Actions`, `Data Models & Entities`, `Linting Configuration`, `Project Documentation`, `Community 24`, `Community 28`, `Community 63`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Core UI Components` to `Authentication & Authorization`, `User Navigation & Theme`, `Audit & Activity Logging`, `Task Management Forms`, `Data Models & Entities`, `Linting Configuration`, `Playwright Testing Config`, `Project Documentation`, `Community 24`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `AuditTrailProps`, `{
    loading, error, search, setSearch,
    currentLimit, setCurrentLimit,
    filteredLogs, groupedLogs, fetchAuditLog
  }`, `skeletonIds` to the rest of the system?**
  _631 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Authorization` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Core UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._
- **Should `User Navigation & Theme` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._