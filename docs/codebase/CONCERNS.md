# Codebase Concerns

## Core Sections (Required)

### 1) Top Risks (Prioritized)

| Severity | Concern | Evidence | Impact | Suggested action |
|----------|---------|----------|--------|------------------|
| Med | Architecture: Component Bloat | `src/App.tsx` | Harder to maintain as the application grows. | Decompose `App.tsx` and core layout components into smaller features. |
| Med | Large Bundle Size potential | `README.md` (minified size mentioned) | Slower load times for users | Monitor bundle size and use dynamic imports for larger components. |

### 2) Technical Debt

List the most important debt items only.

| Debt item | Why it exists | Where | Risk if ignored | Suggested fix |
|-----------|---------------|-------|-----------------|---------------|
| `[TODO]` items | Placeholder for future work | Grep `TODO` | Incomplete features | Systematically address and clear `TODO` items. |
| Manual API implementation | `src/hooks/useApi.ts` manually manages axios | `src/hooks/useApi.ts` | Potential for inconsistency | Use a library like `react-query` or `swr` for better state/cache management. |
| Prop Drilling | Deep component nesting | `src/components/` | Harder to trace data flow | Utilize React Context or Zustand more effectively for deeply nested state. |

### 3) Security Concerns

| Risk | OWASP category (if applicable) | Evidence | Current mitigation | Gap |
|------|--------------------------------|----------|--------------------|-----|
| XSS via user input | A03: Injection | [TODO] | React's default escaping | Verify no use of `dangerouslySetInnerHTML` with unsanitized data. |
| Insecure token storage (Resolved) | [N/A] | `src/contexts/AuthContext.tsx` | HttpOnly Cookies | Verification via E2E testing of the cookie-based flow. |

### 4) Performance and Scaling Concerns

| Concern | Evidence | Current symptom | Scaling risk | Suggested improvement |
|---------|----------|-----------------|-------------|-----------------------|
| Rendering bottlenecks with large lists | [TODO] | [TODO] | UI lag with 100+ tasks | Use virtualization (e.g., `react-window`) for long lists. |
| Massive Re-renders | `src/App.tsx` | [TODO] | Laggy UI response | Optimize component memoization and state placement. |

### 5) Fragile/High-Churn Areas

| Area | Why fragile | Churn signal | Safe change strategy |
|------|-------------|-------------|----------------------|
| `src/hooks/useApi.ts` | Main integration point | High Complexity Hub | Rigorous E2E testing of all API-dependent flows. |
| `src/App.tsx` | Central orchestration | God Node | Decompose into feature-based modules. |

### 6) `[ASK USER]` Questions

Add unresolved intent-dependent questions as a numbered list.

1. [ASK USER] Should we implement a global state management library beyond Zustand if complexity grows?
2. [ASK USER] What is the priority for mobile responsiveness (PWA, dedicated styles, etc.)?
3. [ASK USER] Should we implement server-side session management (Redis) for JWT blacklisting on logout?

### 7) Evidence

- `package.json`
- `README.md`
- `src/hooks/useApi.ts`
- `playwright-report/` (evidencing E2E focus)
- `gsd-codebase-mapper` summary report
