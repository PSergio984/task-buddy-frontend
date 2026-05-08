# Coding Conventions

## Core Sections (Required)

### 1) Naming Rules

| Item | Rule | Example | Evidence |
|------|------|---------|----------|
| Files | Kebab-case (logic/hooks), PascalCase (components) | `use-api.ts`, `TaskCard.tsx` | Directory listing |
| Functions/methods | camelCase | `createTask()` | `src/hooks/useApi.ts` |
| Types/interfaces | PascalCase (prefixed with `I` or just Name) | `Task`, `User` | `src/hooks/useApi.ts` |
| Constants/env vars | Upper snake case | `VITE_API_BASE_URL` | `.env.example` |

### 2) Formatting and Linting

- Formatter: Prettier (configured in `.prettierrc`)
- Linter: ESLint (configured in `eslint.config.js`)
- Most relevant enforced rules: Tailwind CSS class ordering, React hook rules.
- Run commands:
  ```bash
  npm run lint
  npm run format
  npm run typecheck
  ```

### 3) Import and Module Conventions

- Import grouping/order: React core, libraries, components, hooks, styles.
- Alias vs relative import policy: Uses `@/` for absolute imports from `src/`.
- Public exports/barrel policy: Direct exports from component files.

### 4) Error and Logging Conventions

- Error strategy by layer: Hooks handle API errors and provide `error` state to components. Components use `toast` notification for user feedback.
- Logging style and required context fields: Console logging in development; [TODO] for production logging/monitoring.
- Sensitive-data redaction rules: Redaction of tokens and sensitive info before logging.

### 5) Testing Conventions

- Test file naming/location rule: `.spec.ts` files in `tests/` directory.
- Mocking strategy norm: Uses Playwright for end-to-end testing with real or mocked API responses.
- Coverage expectation: [TODO]

### 6) Evidence

- `package.json`
- `.prettierrc`
- `eslint.config.js`
- `src/hooks/useApi.ts`

## Extended Sections (Optional)

- Design system tokens: `src/index.css` (color variables).
