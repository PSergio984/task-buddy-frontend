<!-- generated-by: gsd-doc-writer -->
# Coding Conventions

**Analysis Date: 2026-05-13**

## Naming Patterns

**Files:**
- React Components & Pages: PascalCase (e.g., `TaskCard.tsx`, `TasksPage.tsx`).
- Hooks: camelCase with `use` prefix (e.g., `useTasks.ts`). For shadcn/ui components, kebab-case is allowed for internal library compatibility (e.g., `use-toast.ts`).
- Utilities & Libs: camelCase (e.g., `api.ts`, `utils.ts`).
- Tests: `.test.ts`, `.test.tsx` (Vitest) or `.spec.ts` (Playwright).

**Functions:**
- React Components: PascalCase (e.g., `function TaskCard() {}`).
- Hooks: camelCase (e.g., `function useTasks() {}`).
- Utilities: camelCase (e.g., `function formatDate() {}`).

**Variables:**
- State & Variables: camelCase (e.g., `const [isLoading, setIsLoading] = useState(false)`).
- Constants: UPPER_SNAKE_CASE (e.g., `const API_BASE_URL = "..."`).

**Types & Interfaces:**
- PascalCase (e.g., `interface TaskProps {}`, `type TaskPriority = "HIGH" | "LOW"`).
- Prefer interfaces for object structures and types for unions/aliases.

## Code Style

**React 19 Patterns:**
- Prefer functional components and hooks.
- Use `use` hook for context or promise unwrapping where appropriate.
- Leverage improved metadata support in `App.tsx` or Page components.

**Tailwind CSS v4:**
- Use CSS-first configuration in `src/index.css`.
- Use `@theme` blocks for defining design tokens.
- Prefer Tailwind classes over custom CSS.
- Use the `@custom-variant` directive for complex selectors (e.g., dark mode).

**TanStack Query:**
- Encapsulate all API logic in custom hooks.
- Define consistent `queryKey` patterns.
- Use `useMutation` for any data-modifying actions.

## Import Organization

**Order:**
1. React and standard library imports.
2. Third-party libraries (e.g., `framer-motion`, `@tanstack/react-query`).
3. Path-aliased internal modules (`@/components`, `@/hooks`, `@/lib`).
4. Local relative imports.

**Path Aliases:**
- Use `@/` to reference the `src/` directory (configured in `vite.config.ts` and `tsconfig.json`).

## Error Handling

**Strategy:**
- Use Axios interceptors for global error detection (401, 429).
- Use `toast()` from `use-toast` to provide immediate user feedback.
- Leverage TanStack Query's `error` state for inline UI error messaging.
- Use `axios.isAxiosError()` for type-safe error inspection.
- **Axios Generics:** Explicitly type API responses using generics (e.g., `api.get<Task>("/...")`) to ensure end-to-end type safety.
- **Shadcn Compatibility:** Internal shadcn/ui components use kebab-case (e.g., `use-toast.ts`) for library compatibility; maintain this for new components added via CLI.

## State Management

- **Server State:** Always use TanStack Query. Avoid `useEffect` for data fetching.
- **Global UI State:** Use React Context (for things like Auth/Theme) or Zustand (for complex client-only state).
- **Local State:** Use `useState` or `useReducer`.

## Documentation

- Use JSDoc for complex utility functions.
- Keep components self-documenting through clear prop names and TypeScript interfaces.
- Use `README.md` files in complex directories for additional context.

## Component Design

- **Size:** Extract large sub-sections into smaller components (atomic design).
- **Props:** Use object destructuring in component signatures.
- **Purity:** Keep components as pure as possible; move complex logic into custom hooks.

---

*Conventions analysis: 2026-05-13*
