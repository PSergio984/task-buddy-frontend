# External Integrations

## Core Sections (Required)

### 1) Integration Inventory

| System | Type (API/DB/Queue/etc) | Purpose | Auth model | Criticality | Evidence |
|--------|---------------------------|---------|------------|-------------|----------|
| Task Buddy Backend | REST API | Primary backend service | JWT Token | High | `README.md`, `src/hooks/useApi.ts` |
| Fontsource (Geist) | Fonts | Typography | None | Low | `package.json` |

### 2) Data Stores

| Store | Role | Access layer | Key risk | Evidence |
|-------|------|--------------|----------|----------|
| LocalStorage | Storing JWT tokens/user session | `src/lib/auth.ts` or `src/contexts/AuthContext.tsx` | XSS theft | `src/lib/auth.ts` (assumed based on pattern) |

### 3) Secrets and Credentials Handling

- Credential sources: Environment variables (`.env`)
- Hardcoding checks: Uses `import.meta.env.VITE_API_BASE_URL`.
- Rotation or lifecycle notes: [TODO]

### 4) Reliability and Failure Behavior

- Retry/backoff behavior: [TODO] (Check axios interceptors)
- Timeout policy: [TODO]
- Circuit-breaker or fallback behavior: None observed.

### 5) Observability for Integrations

- Logging around external calls: Console logs in development.
- Metrics/tracing coverage: [TODO]
- Missing visibility gaps: API latency monitoring from the frontend perspective.

### 6) Evidence

- `src/hooks/useApi.ts`
- `.env.example`
- `package.json`

## Extended Sections (Optional)

- API Spec: `API.md` in root directory.
