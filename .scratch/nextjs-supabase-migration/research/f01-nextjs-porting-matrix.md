# F01 — Next.js (App Router) Porting Matrix: Vite SPA → Next.js

Research ticket, RESEARCH ONLY. No code changed.
Baseline stack (given): React 19.2.4, TS 5.9, Vite 7.3.1, Tailwind v4 (4.2.1), Radix/shadcn, Lucide, Framer Motion 12, TanStack Query v5, Zustand v5, React Router v7, axios, date-fns, idb-keyval, vite-plugin-pwa (VAPID web push), Vitest+RTL, Playwright. Deploy: Vercel (FE), FastAPI on Render (BE). Auth: custom JWT via httpOnly cookie (SameSite=lax assumed, unverified).

Target docs version: Next.js 16.3.0 (docs last updated Jul 2026). All claims cited from primary sources fetched 2026-08-07.

Legend: DROP-IN = port without structural change. REWORK = requires new pattern/rewrite. MIXED = split verdict.

---

## 1. react-router v7 → App Router — REWORK (structural; interim SPA mode available)

Official Next.js migration guide now exists: "How to migrate from Vite to Next.js" (updated 2026-07-28).
https://nextjs.org/docs/app/guides/migrating/from-vite

Route shape mapping (per App Router file conventions):
- Nested route layout (`<Route element={<Layout/>}>` + `<Outlet/>`) → folder-per-segment `layout.tsx`; layouts nest via `children` prop and persist across navigation (do not rerender). https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Route path `/blog/:slug` → `app/blog/[slug]/page.tsx` (dynamic segment). Same URL.
- `searchParams`/`params`: server `searchParams` prop opts page into dynamic rendering; client code uses `useSearchParams`. https://nextjs.org/docs/app/getting-started/layouts-and-pages
- Protected routes (auth guard wrapper): REWORK. Replace with (a) `proxy.ts` optimistic checks — reads session cookie, redirects to `/login`, runs on every route incl. prefetches; and (b) per-route/DAL checks near data (Proxy is "not a full session management or authorization solution"). https://nextjs.org/docs/app/guides/authentication
- Note: Next.js 16 renamed Middleware → Proxy (functionality unchanged, `proxy.ts` at project root, one per project, `matcher` config). https://nextjs.org/docs/app/getting-started/proxy
- Loaders/actions (RR v7 data mode): no 1:1 replacement. Keep TanStack Query client-side (see §3) or prefetch in Server Components; TanStack docs explicitly compare RSC prefetch to Remix loaders. https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Code splitting: REWORK-free gain — automatic route-level code splitting built into the router; manual `React.lazy`/RR lazy imports become unnecessary. https://nextjs.org/docs/app/guides/migrating/from-vite

Migration path that avoids router rewrite initially: keep the whole app as a client-side SPA under `app/[[...slug]]/page.tsx` (optional catch-all) + `generateStaticParams()`, mount existing App via `dynamic(() => import('../../App'), { ssr: false })`, `output: 'export'` if desired. Router migration is listed as an incremental "next step", not a prerequisite. https://nextjs.org/docs/app/guides/migrating/from-vite

## 2. PWA / service worker / web push — REWORK (full replacement; next-pwa is dead)

### next-pwa status (as of 2026)
- Latest npm release: **5.6.0, published 2022-08-23** (registry metadata). https://registry.npmjs.org/next-pwa/latest
- Latest GitHub release tag 5.6.1 ("Minor dependency upgrades", Dec 2022); no release since. https://github.com/shadowwalker/next-pwa/releases
- README is Pages-Router era (`pages/_document.jsx`, `pages/_offline.js` fallback page, `withPWA` webpack plugin wrapping `next.config.js`); no App Router or Turbopack support documented. https://github.com/shadowwalker/next-pwa
- Verdict: **DROP next-pwa** (unmaintained ~3.5 years, wrong architecture for App Router/Turbopack). Do not port the plugin; port only the SW behavior.

### Official Next.js PWA approach (guide updated 2026-07-30) — what to port TO
https://nextjs.org/docs/app/guides/progressive-web-apps
- Manifest: DROP-IN-ish — native `app/manifest.ts` (or `.json`) metadata file replaces `vite-plugin-pwa` manifest generation. https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
- Web push / VAPID in App Router (documented pattern):
  - Client (`'use client'` component): `navigator.serviceWorker.register(...)` (recommends `updateViaCache: 'none'`), `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) })` — same subscription call shape as vite-plugin-pwa/VAPID today.
  - Server: Server Actions file (`'use server'`, e.g. `app/actions.ts`) calls `webpush.sendNotification(...)` with `webpush.setVapidDetails(mailto, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)`. Private key stays server-only.
  - SW file: hand-written `lib/service-worker.js` (or `public/`) with `push` + `notificationclick` listeners — must be reimplemented (vite-plugin-pwa generated this via `generateSW`).
  - Headers: serve `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate` via `next.config.js` `headers()` (browser refuses SW if delivered with redirect — same constraint as before).
  - Local dev testing: `next dev --experimental-https` (push requires secure context).
- Full offline precaching (current vite-plugin-pwa `registerSW`/precache): REWORK. Official docs recommend **Serwist** (active Workbox fork, App Router + Turbopack examples). https://nextjs.org/docs/app/guides/progressive-web-apps · https://github.com/serwist/serwist
- Optional extras: experimental `useOffline` hook + `experimental.useOffline` config for connectivity-aware UI / retry of failed nav & Server Actions. https://nextjs.org/docs/app/api-reference/functions/use-offline · https://nextjs.org/docs/app/api-reference/config/next-config-js/useOffline
- Pitfalls: don't precache the start URL as a static shell (SSR HTML varies with auth state — next-pwa's `dynamicStartUrl` reasoning still applies); streaming/RSC payloads are not precache-friendly without Serwist; subscription persistence must move to your DB/FastAPI (docs example keeps it in memory — "In a production environment, store in a database").

## 3. TanStack Query v5 + Zustand v5 under App Router — MIXED (DROP-IN for client bundle, small SSR rework)

TanStack Query official App Router guide (current):
https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
- Client-only usage: unchanged API — REWORK only around provider wiring. Required pattern: `app/providers.tsx` with `'use client'`, single `QueryClient` via module-level `browserQueryClient` (not `useState`, per Suspense caveat), `getQueryClient()` helper branching on `environmentManager.isServer()`.
- Hydration: REWORK if adopting server prefetch — `prefetchQuery` in a Server Component `page.tsx` + `<HydrationBoundary state={dehydrate(queryClient)}>` (must be per-page; "getting rid of the boilerplate… is not possible with Server Components"). `staleTime > 0` recommended to avoid immediate client refetch.
- Streaming: since v5.40 pending queries can be dehydrated (no `await` needed). NOT recommended to use Server Actions as `queryFn` (serial execution breaks RQ; cite #7934/#6264 in guide).
- Persistence + idb-keyval (your offline mode): DROP-IN — the official docs' IDB persister example literally uses `idb-keyval` (`get/set/del`). https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient
  - Use `PersistQueryClientProvider` (not raw `persistQueryClient()`) to avoid restore/fetch race.
  - With streaming: configure `dehydrateOptions.shouldDehydrateQuery` to persist only successful queries (don't persist pending Promises).
  - Set `gcTime >= maxAge` (default maxAge 24h) or cache is garbage-collected early.
- Zustand: DROP-IN if stores remain client-side-only (standard `persist` middleware, localStorage/sessionStorage). REWORK only if stores are read during server render (hydration mismatch) or via module-level `getState()`/`subscribe()` outside components — upstream README warns against adding store state in React Server Components ("unexpected bugs and privacy issues", links discussion #2200). https://github.com/pmndrs/zustand
- `'use client'` implications: any component importing QueryClientProvider/Zustand hooks/RQ hooks must be a Client Component; providers must sit below the root layout boundary (layout can stay a Server Component).

## 4. API client: axios → Render backend vs Route Handler proxy; cookies — MIXED

- axios itself: DROP-IN (bundler-agnostic; works in client components and Node route handlers). Using it on the server forfeits Next's `fetch` dedupe/caching; BFF docs recommend native `fetch` server-side. https://nextjs.org/docs/app/guides/backend-for-frontend
- Option A — keep direct browser→Render axios (DROP-IN): requires CORS on FastAPI. Cookie problem: browser→Render is cross-site; `SameSite=lax` cookies are **not sent on cross-site XHR/fetch** (lax only attaches on top-level navigations) → auth breaks unless cookie is `SameSite=None; Secure`. Auth docs recommend `httpOnly`, `Secure`, `SameSite` and list MDN as the cookie reference — flag as unverified for your backend. https://nextjs.org/docs/app/guides/authentication
- Option B — Next.js BFF proxy (REWORK, recommended): 
  - Route Handler catch-all `app/api/[...slug]/route.ts` forwarding the whole `Request` (`new Request(proxyURL, request)` preserves headers incl. Cookie) to the Render origin; set/forward cookies via `NextResponse.cookies.set(...)` (docs show httpOnly token cookie on a redirect response). https://nextjs.org/docs/app/guides/backend-for-frontend
  - Or declarative `rewrites` to external URL (fallback `source: '/:path*'` style); note routing order (headers → redirects → proxy → beforeFiles → files → afterFiles → dynamic routes → fallback). https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
  - Cookie flow with proxy: browser only ever calls the Next.js origin (same-site) → `SameSite=lax` + httpOnly works unchanged; the browser→Render hop disappears. Next→Render is server-to-server (SameSite is a browser concept — does not apply). Caveat to verify in spike: upstream `Set-Cookie` from FastAPI must be explicitly forwarded (fetch proxy) — do not rely on pass-through. https://nextjs.org/docs/app/guides/backend-for-frontend
- Auth guard placement: optimistic cookie checks in `proxy.ts` (reads cookie, redirects); real authorization in route handlers/DAL ("Treat Route Handlers like public API endpoints", verify credentials server-side). https://nextjs.org/docs/app/guides/authentication · https://nextjs.org/docs/app/guides/backend-for-frontend
- Verdict: if the httpOnly cookie + SameSite=lax assumption holds, **proxy approach is required in prod** (or backend cookie change to SameSite=None). That's the single biggest auth-affecting decision in this matrix.

## 5. Tailwind v4 + shadcn/Radix + Framer Motion + date-fns + react-day-picker — DROP-IN (minor config swaps)

- Tailwind v4: REWORK is one file — swap `@tailwindcss/vite` for `@tailwindcss/postcss` (`postcss.config.mjs` with `plugins: { "@tailwindcss/postcss": {} }`, `@import "tailwindcss"` in globals). Everything else carries. https://tailwindcss.com/docs/installation/framework-guides/nextjs
- shadcn/ui: DROP-IN — CLI officially supports Next.js (`shadcn init -t next`, existing-project path needs `@/*` tsconfig alias + Tailwind); components are source-copied Radix composites. https://ui.shadcn.com/docs/installation/next
- Radix UI: DROP-IN; interactive components need `'use client'` (they're context/hook-based).
- Framer Motion 12 → Motion: DROP-IN — same API surface, current import is `motion/react` (package `motion`); docs make no Next.js-specific changes mandatory. https://motion.dev/docs/react
- date-fns: DROP-IN (pure functions, SSR-safe).
- react-day-picker: DROP-IN — plain client component; official Next.js App Router install guide exists (site unreachable from research environment — verify page + React 19 compat in spike). https://react-day-picker.dev/installation/nextjs
- Lucide React: DROP-IN.

## 6. Vitest + RTL + Playwright — DROP-IN (minor config edits)

Official Next.js testing guides:
https://nextjs.org/docs/app/guides/testing/vitest
https://nextjs.org/docs/app/guides/testing/playwright
- Vitest: no `next/vitest` plugin exists in the official guide — manual setup is `vitest + @vitejs/plugin-react + jsdom + vite-tsconfig-paths` with `test.environment: 'jsdom'`, i.e. nearly identical to your current Vite config (carry it over; adjust alias plugin). Official example: vercel/next.js `examples/with-vitest`. https://nextjs.org/docs/app/guides/testing/vitest · https://github.com/vercel/next.js/tree/canary/examples/with-vitest
- Known gotcha (official): "Vitest currently does not support async Server Components" — unit-test only synchronous Server/Client components; use E2E for async components. https://nextjs.org/docs/app/guides/testing/vitest
- Env: `.env.test` supported; `@next/env` `loadEnvConfig()` to load env in test setup. https://nextjs.org/docs/app/guides/environment-variables
- Playwright: DROP-IN — same `playwright.config.ts`; add `webServer: { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI }` (Next.js recommends testing against the production build) and `use.baseURL`; multiple `webServer` entries allowed if you boot the Render API locally. https://playwright.dev/docs/test-webserver · https://nextjs.org/docs/app/guides/testing/playwright

## 7. Vite dev proxy + VITE_* env → next.config rewrites + NEXT_PUBLIC_* — REWORK (mechanical)

- Env: rename `VITE_*` → `NEXT_PUBLIC_*` (official, one-line). `import.meta.env.MODE/DEV/PROD/BASE_URL/SSR` are supported by Turbopack as-is; `import.meta.glob` supported (`query` replaces deprecated `as`). https://nextjs.org/docs/app/guides/migrating/from-vite
- `NEXT_PUBLIC_*` are inlined at build time and frozen — per-env builds required (Vercel preview/prod envs handle this). Runtime env on server via `connection()`/dynamic rendering. https://nextjs.org/docs/app/guides/environment-variables
- Dev proxy: `vite.config.ts` `server.proxy` → `rewrites` in `next.config.ts` (e.g. `fallback: [{ source: '/:path*', destination: 'https://<render-host>/:path*' }]`) or the catch-all Route Handler proxy from §4. Caveats: rewrites apply in all environments (not dev-only) — harmless if same-origin proxying is desired in prod too; fallback rewrites are checked after files and dynamic routes. https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites
- Custom `base` → `basePath`; `output: 'export'` + `distDir` only if keeping SPA mode. https://nextjs.org/docs/app/guides/migrating/from-vite

---

## Open questions

1. Auth cookie details unverified (SameSite value/domain on the FastAPI backend; refresh flow). Determines whether §4 Option A can survive with a SameSite=None change or the proxy (Option B) is mandatory.
2. Push subscription storage: does FastAPI already expose subscription CRUD endpoints, or must the Next.js Server Action write directly to the DB? Affects §2 port size.
3. Next.js 16 Cache Components ("use cache") / caching model: does the team adopt RSC prefetch + caching, or stay client-rendered SPA-first? Determines how much of §1/§3 rework is done now vs later.
4. Turbopack (default bundler) vs webpack: Serwist supports both; confirm SW build pipeline under Turbopack in spike (vite-plugin-pwa had no equivalent; next-pwa is webpack-only).
5. react-day-picker install page unreachable from research env — confirm Next.js page + React 19.2 compat.
6. Verify in spike: upstream Set-Cookie passthrough for the Route Handler fetch-proxy (does FastAPI set/refresh cookies itself?).
7. Motion: confirm no `use client`/hydration quirks with the specific animation features used (layout animations, AnimatePresence) under RSC — docs suggest none required.
8. Playwright E2E currently hitting Render test backend: with the proxy, tests exercise Next-origin API paths; decide whether Playwright boots a local API or targets the proxy.
