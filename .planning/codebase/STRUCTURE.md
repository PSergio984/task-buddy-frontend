# Codebase Structure

**Analysis Date:** [YYYY-MM-DD]

## Directory Layout

```
[project-root]/
├── public/                 # Static public assets
├── src/                    # Primary source code directory
│   ├── assets/             # Media and static assets imported via bundler
│   ├── components/         # Reusable React UI and domain components
│   │   ├── auth/           # Authentication related components
│   │   └── ui/             # Generic, reusable UI primitives (shadcn)
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks (data fetching, util)
│   ├── lib/                # Utility functions and library configs
│   └── pages/              # High-level route wrapper components
├── tests/                  # E2E Tests (Playwright)
└── playwright-report/      # Test reports (Generated)
```

## Directory Purposes

**`src/components/`:**
- Purpose: Holds both generic UI components and specific application components.
- Contains: React `.tsx` files.
- Key files: `task-card.tsx`, `sidebar.tsx`, `dashboard.tsx`.

**`src/components/ui/`:**
- Purpose: Reusable foundational UI elements, predominantly sourced from shadcn/ui.
- Contains: Primitives like buttons, dialogs, form inputs.
- Key files: `button.tsx`, `card.tsx`, `dialog.tsx`.

**`src/hooks/`:**
- Purpose: Extract reusable React logic, particularly data-fetching.
- Contains: React hooks.
- Key files: `useApi.ts` (API abstraction), `use-toast.ts` (Toast notifications).

**`src/contexts/`:**
- Purpose: Application-wide state management using Context API.
- Contains: Provider definitions and custom hook exports for contexts.
- Key files: `AuthContext.tsx`, `ProtectedRoute.tsx`.

**`src/pages/`:**
- Purpose: Route endpoints combining multiple components into full views.
- Contains: React components intended as the `element` for a Router `<Route>`.
- Key files: `DashboardDemo.tsx`, `LoginPage.tsx`, `LandingPage.tsx`.

**`src/lib/`:**
- Purpose: Pure TypeScript helper functions, non-React utilities.
- Contains: Shared utilities.
- Key files: `utils.ts` (Tailwind class merging), `auth.ts` (Authentication helpers).

**`tests/`:**
- Purpose: End-to-end automation testing.
- Contains: Playwright test spec files.
- Key files: `auth.spec.ts`, `landing.spec.ts`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React DOM mount and root Provider setup.
- `src/App.tsx`: Central router configuration and `DashboardLayout` composition.

**Configuration:**
- `vite.config.ts`: Vite build and development server configuration.
- `tailwind.config.js`: Tailwind CSS design system configuration.
- `eslint.config.js`: Linting rules.
- `playwright.config.ts`: E2E test runner configuration.

**Core Logic:**
- `src/hooks/useApi.ts`: Centralizes all Backend API interactions and data types (`Task`, `Subtask`).
- `src/contexts/AuthContext.tsx`: Core identity and token persistence logic.

## Naming Conventions

**Files:**
- React Components/Pages: PascalCase or kebab-case. *Observation: Mixed usage. Pages use PascalCase (`LoginPage.tsx`), but components often use kebab-case (`task-card.tsx`, `system-overview.tsx`). Follow the existing pattern for the target folder.*
- Hooks: camelCase with `use` prefix (`useApi.ts`, `use-toast.ts`).
- Utility/Lib: camelCase (`utils.ts`, `auth.ts`).
- Tests: kebab-case with `.spec.ts` suffix (`forgot-password.spec.ts`).

**Directories:**
- All lowercase, hyphen-separated (kebab-case) where needed.

## Where to Add New Code

**New Feature:**
- Primary view/assembly: `src/pages/NewFeaturePage.tsx`
- Feature-specific UI parts: `src/components/new-feature/` (if complex) or `src/components/`
- API calls for feature: `src/hooks/useApi.ts` (append new hooks) or a new `useNewFeatureApi.ts`.
- Tests: `tests/new-feature.spec.ts`

**New Component/Module:**
- Shared UI primitives: `src/components/ui/`
- Domain components: `src/components/`

**Utilities:**
- Shared generic helpers: `src/lib/utils.ts`
- Domain-specific pure functions: New file in `src/lib/` (e.g., `src/lib/validation.ts`).

## Special Directories

**`tests/`:**
- Purpose: End-to-end testing scenarios checking functionality in a real browser context.
- Generated: No
- Committed: Yes

**`playwright-report/` & `test-results/`:**
- Purpose: Output directories for E2E tests containing HTML reports and traces.
- Generated: Yes
- Committed: No (in `.gitignore`)

**`dist/`:**
- Purpose: Production build output created by Vite.
- Generated: Yes
- Committed: No

---

*Structure analysis: [YYYY-MM-DD]*
