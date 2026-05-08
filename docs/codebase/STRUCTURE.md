# Codebase Structure

## Core Sections (Required)

### 1) Top-Level Map

List only meaningful top-level directories and files.

| Path | Purpose | Evidence |
|------|---------|----------|
| `src/` | Application source code | `README.md` |
| `public/` | Static assets | `README.md` |
| `tests/` | Playwright E2E tests | Directory listing |
| `docs/` | Documentation | Directory listing |
| `.agents/` | Agent-specific skills and rules | Directory listing |
| `package.json` | Project metadata and dependencies | File presence |
| `vite.config.ts` | Vite configuration | File presence |
| `tailwind.config.js` | Tailwind CSS configuration | File presence |

### 2) Entry Points

- Main runtime entry: `src/main.tsx`
- Secondary entry points (worker/cli/jobs): `index.html` (HTML entry)
- How entry is selected (script/config): Vite uses `index.html` as entry, which loads `src/main.tsx`.

### 3) Module Boundaries

| Boundary | What belongs here | What must not be here |
|----------|-------------------|------------------------|
| `src/components/ui/` | shadcn/ui base components | Business logic, API calls |
| `src/components/` | Application-specific components | Page-level routing logic |
| `src/pages/` | Page components tied to routes | Low-level UI primitives |
| `src/hooks/` | Custom React hooks (including API hooks) | Global state definitions (if using Zustand separately) |
| `src/lib/` | Utility functions, shared constants | UI components |
| `src/contexts/` | React Context providers (Auth, Theme) | Direct business logic |

### 4) Naming and Organization Rules

- File naming pattern: Kebab-case for general files (`use-api.ts`), PascalCase for components (`TaskCard.tsx`).
- Directory organization pattern: Feature/Type based (`components/`, `hooks/`, `pages/`).
- Import aliasing or path conventions: Uses `@/` alias for `src/` (likely configured in `tsconfig.json`).

### 5) Evidence

- `README.md` (Project Structure section)
- `package.json`
- `vite.config.ts`

## Extended Sections (Optional)

- `src/components/ui/` inventory: button, card, checkbox, dialog, input, label, select, tabs.
