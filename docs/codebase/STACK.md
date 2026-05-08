# Technology Stack

## Core Sections (Required)

### 1) Runtime Summary

| Area | Value | Evidence |
|------|-------|----------|
| Primary language | TypeScript | `package.json`, `.ts`/`.tsx` files |
| Runtime + version | Node.js 18+ | `README.md` |
| Package manager | npm | `package-lock.json` presence |
| Module/build system | Vite | `package.json`, `vite.config.ts` |

### 2) Production Frameworks and Dependencies

List only high-impact production dependencies (frameworks, data, transport, auth).

| Dependency | Version | Role in system | Evidence |
|------------|---------|----------------|----------|
| react | ^19.2.4 | UI Framework | `package.json` |
| react-dom | ^19.2.4 | React DOM rendering | `package.json` |
| react-router-dom | ^7.15.0 | Routing | `package.json` |
| tailwindcss | ^4.2.1 | Styling | `package.json` |
| framer-motion | ^12.38.0 | Animations | `package.json` |
| lucide-react | ^1.14.0 | Icons | `package.json` |
| zustand | ^5.0.13 | State management | `package.json` |
| axios | ^1.16.0 | HTTP Client | `package.json` |
| shadcn | ^4.7.0 | UI Components | `package.json` |
| @radix-ui/react-* | Varies | Accessible UI Primitives | `package.json` |

### 3) Development Toolchain

| Tool | Purpose | Evidence |
|------|---------|----------|
| vite | Build & Dev Server | `package.json` |
| typescript | Static typing | `package.json` |
| eslint | Linting | `package.json` |
| prettier | Formatting | `package.json` |
| playwright | E2E Testing | `package.json` |

### 4) Key Commands

```bash
npm install
npm run dev
npm run build
npm run test:e2e
npm run lint
npm run format
npm run typecheck
```

### 5) Environment and Config

- Config sources: `.env`, `vite.config.ts`
- Required env vars: `VITE_API_BASE_URL`
- Deployment/runtime constraints: Browser support for ES Modules (modern browsers).

### 6) Evidence

- `package.json`
- `vite.config.ts`
- `README.md`
