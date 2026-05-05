# Copilot instructions for `task-buddy-frontend`

## Build, lint, and test commands

Run from repository root:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run format
npm run preview
```

Testing is not configured yet (`package.json` has no `test` script), so there is currently no single-test command in this repository.

## High-level architecture

- This is a Vite + React 19 + TypeScript frontend using shadcn/ui primitives and Tailwind CSS v4.
- App boot flow is: `src/main.tsx` -> wraps `<App />` in `<StrictMode>` and a custom `ThemeProvider`.
- `ThemeProvider` (`src/components/theme-provider.tsx`) owns theme state, persists it in `localStorage` (`storageKey: "theme"`), applies `.dark` / `.light` classes to `document.documentElement`, and supports keyboard toggle with `d`.
- Styling is token-driven via `src/index.css` (CSS variables + `@theme inline`), with imports from `tailwindcss`, `tw-animate-css`, `shadcn/tailwind.css`, and Geist variable font.
- UI components follow shadcn patterns in `src/components/ui/*` (e.g., `button.tsx` uses `class-variance-authority`, Radix `Slot`, and shared `cn()` helper).

## Key conventions in this codebase

- Use the `@/*` path alias for source imports (`@` -> `src`) as configured in both `vite.config.ts` and `tsconfig*.json`.
- Keep TypeScript import style consistent with current settings (`allowImportingTsExtensions: true` and explicit `.tsx` imports are used in entry files).
- Reuse `cn()` from `src/lib/utils.ts` for class composition (`clsx` + `tailwind-merge`) instead of manual string concatenation.
- Follow existing component style: functional components, typed props, and variant-driven styling (`cva`) for UI primitives.
- Tailwind theme values are CSS-variable based; prefer semantic tokens (`bg-background`, `text-foreground`, etc.) over hard-coded color values.
- Add new shadcn UI primitives with `npx shadcn@latest add <component>` (as documented in `README.md`) so components land in `src/components`.
- Existing repo-level instruction file `.github/instructions/power-apps-code-apps.instructions.md` applies to TS/React config and should be honored for future Power Apps-related additions.

## Existing assistant assets relevant to future sessions

- The repository includes React migration skill packs under `.agents/skills/` and `.claude/skills/`:
  - `react-audit-grep-patterns`
  - `react19-source-patterns`
  - `react19-concurrent-patterns`
  - `react19-test-patterns`
- When doing React 18/19 migration or audit work, use those local skill references instead of recreating migration rules from memory.
