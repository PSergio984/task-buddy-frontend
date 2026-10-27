# Task Buddy Frontend

Next.js 16 + React 19 offline-first SPA for **Task Buddy — AI Task Manager (Memory · Knowledge · Planner)** — hybrid RAG front door for Knowledge/Memory/Planner, with offline queue, Realtime push, and premium dual-identity design. Deployed on **Vercel** (`vercel.json` `app/` proxy) against the FastAPI backend on **Render** + Supabase.

> Monorepo front door is at workspace root `../README.md` (local) (33k, CEIT-tier: live demo, mermaid, full run-it, evaluation, rubric — local only, not tracked in this repo). This file is the deep frontend reference. Keep it in sync with `docs/codebase/` (STRUCTURE, ARCHITECTURE, TESTING) and sibling backend `../task-buddy-backend/README.md` (sibling, local).

## Design system (dual-identity)

- **Light:** `background #fafafa` / `card #ffffff` / `primary #18181b` / `accent #2563eb` electric blue (`src/index.css`)
- **Dark:** `background #0f172a` deep navy / `accent #c2a388` warm amber + `sidebar #071122`
- **Typography:** `Plus Jakarta Sans`, headings `font-black tracking-tighter uppercase`, micro-labels `10px font-black tracking-[0.3em]`
- **Primitives:** shadcn/ui + Tailwind `4.2.1` + `tw-animate-css`, `lucide-react` icons — tokens in `src/index.css`

## Architecture (frontend slice — full mermaid in workspace root `../README.md` (local))

**Offline-first sync:** writes → IndexedDB queue `src/lib/sync-queue.ts` → `src/lib/sync-flush.ts` delta → `POST /api/v1/sync` LWW `task-buddy-backend/app/sync/lww.py`; live updates via Supabase Realtime `src/lib/realtime-client.ts` (`app/api/routers/realtime.py`). Service worker via Serwist.

**Entry points:** `app/layout.tsx` → `app/[slug]/spa.tsx` (SPA shell → `src/App.tsx` via `AppProviders` + `RealtimeWatcher` + `SwRegistration` `app/[slug]/spa.tsx:1-16`) — not legacy `src/components/dashboard.tsx` per `docs/codebase/CONCERNS.md` gap.

**RAG surfaces:** `src/components/task-drawer/KnowledgeSection.tsx` (notes + "what do I need" `POST /api/v1/tasks/{id}/knowledge/ask` → citations + `+1/-1` feedback → `tbl_knowledge_feedback`), `src/views/` (TasksPage, TaskDetailPage, DashboardDemo with `Tonight/Tomorrow/Later` buckets via `POST /api/v1/plan`).

## Project structure (see `docs/codebase/STRUCTURE.md` + workspace root `../README.md` (local) workspace tree)

```text
app/
├── layout.tsx
├── [slug]/spa.tsx          # SPA shell (AppProviders + RealtimeWatcher)
├── [slug]/page.tsx         # route
├── api/[...path]/route.ts  # Vercel proxy: BACKEND_URL → FastAPI (app/api/[...path]/route.ts:4)
└── forgot-password/ login/ register/ reset-password/ verify-email/

src/
├── components/
│   ├── ui/                 # shadcn/ui: button, card, checkbox, dialog, input, label, select, tabs
│   └── task-drawer/KnowledgeSection.tsx  # notes + knowledge ask + thumbs
├── contexts/               # Auth, Filter, Settings, Sync, ProtectedRoute
├── hooks/                  # useTasks, useKnowledgeNotes, useTaskDrawer*, useNotifications (not single useApi.ts per STRUCTURE.md)
├── lib/
│   ├── api.ts              # axios (not useApi.ts)
│   ├── config.ts           # NEXT_PUBLIC_API_BASE_URL (not VITE_API_BASE_URL — Vite-era stale per CONCERNS.md)
│   ├── query-client.ts     # TanStack persist
│   ├── sync-queue.ts / sync-flush.ts / sync-delta.ts / sync-enqueue.ts
│   └── realtime-client.ts
├── views/                  # TasksPage, TaskDetailPage, DashboardDemo, LandingPage, etc.
└── test/setup.ts
tests/*.spec.ts             # 8 Playwright E2E (auth, landing, layout, notifications, sidebar-dnd, timepicker, advanced-tasks)
vercel.json                 # Vercel functions proxy app/ → backend (ecb1f0d stale-build fix)
```

## Run it (frontend lane — backend lane in workspace root `../README.md` (local) + sibling `../task-buddy-backend/README.md` (sibling, local))

Prereqs: Node `>=20.9.0` (`package.json:engines`, CI `node: '22'` `.github/workflows/ci.yml`) — not `18+` stale `README`/`.env.example` (`docs/codebase/CONCERNS.md`).

```bash
npm install                 # from task-buddy-frontend/
cp .env.example .env        # set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 and BACKEND_URL=http://localhost:8000
                            # FIX: .env.example still has VITE_API_BASE_URL (Vite-era stale per CONCERNS.md) — use NEXT_PUBLIC_* + BACKEND_URL (src/lib/config.ts:1, app/api/[...path]/route.ts:4, next.config.ts:1-4)
npm run dev                 # Next.js --webpack on http://localhost:5173 (not 3000, not preview)
npm run build               # production build — measure before claiming 338KB/108KB (unverified per CONCERNS.md)
npm run typecheck           # tsc --noEmit
npm run lint && npm run format  # eslint + prettier
```

Backend must be running (see sibling `../task-buddy-backend/README.md` (sibling, local) `uvicorn --reload` on `8000`) or `BACKEND_URL` pointing at Render (`https://task-buddy-backend-wy3w.onrender.com`).

## API integration (TanStack Query + axios, not single `useApi.ts`)

```typescript
// lib/api.ts + hooks/ — typed, error + loading + env via NEXT_PUBLIC_API_BASE_URL
import { useTasks, useCreateTask } from "@/hooks/useTasks"
const { data, isPending, error } = useTasks()
const { mutate: createTask } = useCreateTask()
```

`src/lib/config.ts:1` reads `NEXT_PUBLIC_API_BASE_URL`; server proxy `app/api/[...path]/route.ts:4` + `next.config.ts:1-4` reads `BACKEND_URL`. No `VITE_API_BASE_URL` at runtime.

## Sync contract (offline-first)

1. Mutations enqueue to IndexedDB `sync-queue.ts` (delta `sync-delta.ts`)
2. `sync-flush.ts` posts to `POST /api/v1/sync` (LWW `task-buddy-backend/app/sync/lww.py`)
3. Realtime `realtime-client.ts` → Supabase push → `query-client.ts` persist
4. Auth via JWT cookie + CSRF (backend `app/security.py` + middleware)

Fixes `ed99518` queue/flush races (`docs/codebase/CONCERNS.md`).

## Testing

```bash
npm run test:ci              # vitest 4 + @testing-library/react + jsdom — 13 unit files per docs/codebase/TESTING.md
npm run test:e2e             # playwright test — 8 specs (tests/*.spec.ts: auth, landing, layout, notifications, sidebar-dnd, timepicker, advanced-tasks)
npm run test:coverage        # vitest coverage
```

Backend suite (347/49 `pytest`, `tests/fixtures/golden_knowledge.json` gate) in sibling `../task-buddy-backend/README.md` (sibling, local) + CI `python-app.yml` separate; this repo's CI is `ci.yml` (`lint`, `format:check`, `typecheck`, `vitest`, `build`).

## Screenshots (placeholder — don't ship broken images)

<!-- TODO: capture
![Dashboard — Tonight/Tomorrow/Later buckets](docs/screenshots/dashboard-plan.png)
![Task drawer — Knowledge ask with citations](docs/screenshots/task-drawer-knowledge.png)
-->

Create `docs/screenshots/` and capture dashboard + task drawer Knowledge ask (CEIT pattern `docs/screenshots/chat-widget.png`) before final submission. Keep Premium aesthetic (light `#fafafa` / dark `#0f172a` + `#c2a388` amber) — see `design-system/task-buddy/` + `src/index.css` tokens.

## Scripts

| Command | Purpose | Evidence |
|---------|---------|----------|
| `npm run dev` | `next dev --webpack` on `5173` | `package.json:8-15` |
| `npm run build` | production build | `package.json` |
| `npm run typecheck` | `next typegen && tsc --noEmit` | `package.json` |
| `npm run lint` | eslint | `package.json` |
| `npm run format` | prettier | `package.json` |
| `npm run test:ci` | `vitest run` | `package.json` |
| `npm run test:e2e` | `playwright test` | `package.json` |

No `npm run preview` (stale Vite-era) — removed per workspace `.wayfinder/research/existing-readmes-and-codebase-facts.md` (local, 35k).

## Docs

- Monorepo front door: workspace root `../README.md` (local) (33k, TOC, problem, mermaid, run-it, walkthrough, endpoints ~58 routes, eval `TODO` table, monitoring Sentry/audit, rubric — local only)
- Backend deep: sibling `../task-buddy-backend/README.md` (sibling, local) (tech stack, `app/` boundaries, `alembic`, retrieval `k1=1.5/b=0.75` + Porter + RRF `k=60`)
- Deep docs: [`../docs/codebase/`](docs/codebase/) `STACK.md` / `STRUCTURE.md` / `ARCHITECTURE.md` / `CONVENTIONS.md` / `INTEGRATIONS.md` / `TESTING.md` / `CONCERNS.md` / `PRESENTATION.md`
- Planning trail: `.planning/` GSD + wayfinder `.wayfinder/issues/0024-wayfinder-map-readme-refresh.md`

<!-- Stale claims removed per workspace .wayfinder/research/existing-readmes-and-codebase-facts.md (local, 35k) — maintainer note --> `Vite` build → `Next --webpack`, `VITE_API_BASE_URL` → `NEXT_PUBLIC_*`/`BACKEND_URL`, `preview` removed, `dashboard.tsx` aspirational → `app/[slug]/spa.tsx`, `useApi.ts` → `hooks/` + `lib/api.ts`, `338KB/108KB` → `TODO` until `next build` measured, `Node 18+` → `>=20.9`.

**Built with Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui — offline-first, Realtime, premium dual-identity.**
