# F-01 — Next.js porting matrix

Type: research
Status: resolved
Blocked by: —

## Question

Map the existing Vite/React 19 stack onto Next.js (App Router) equivalents, marking each as drop-in vs rework:

- react-router v7 → App Router routes (which route shapes map cleanly, data-loading patterns, code-splitting).
- vite-plugin-pwa → PWA/service-worker strategy in Next.js (next-pwa vs manual service worker registration; web-push VAPID implications).
- TanStack Query v5, Zustand v5 — do they port unchanged? SSR/hydration pitfalls in App Router.
- idb-keyval offline persistence layer — port plan; how it interacts with route handlers/proxy.
- axios API client → route handlers proxy vs direct axios to Render; CORS/cookie implications (auth cookies, SameSite).
- Tailwind v4 + shadcn/Radix, Framer Motion, date-fns, react-day-picker/react-datepicker — drop-in or version bumps needed?
- Vitest + React Testing Library and Playwright under Next.js — what changes in configs/setup.
- Vite-specific dev/proxy config that must be recreated in next.config.

Resolve via primary sources (Next.js docs, plugin repos). Save findings to `task-buddy-frontend/.scratch/nextjs-supabase-migration/research/f01-nextjs-porting-matrix.md`, then link from here.

## Answer

Findings: `research/f01-nextjs-porting-matrix.md`. Key facts: PWA is a REWORK, not a port — next-pwa is dead (last publish 2022); official path = native `app/manifest.ts` + hand-written `sw.js` + Serwist (active Workbox fork) for offline precaching; VAPID push shape nearly drop-in. SameSite cookie: same-origin Next.js proxy (route handler or rewrites) required so httpOnly + lax cookies keep working — direct browser→Render axios breaks them (mandates the proxy). Testing near drop-in (official Vitest guide = current stack; Playwright carries over). TanStack Query + idb-keyval persistence drop-in; Zustand drop-in if client-only. Tailwind v4/shadcn/Radix/Motion/date-fns drop-in with `'use client'` boundaries; official Vite→Next guide offers SPA-mode interim (`output: 'export'` + `[[...slug]]` catch-all) to defer the router rewrite.
