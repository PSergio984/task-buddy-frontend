# F-04 — PWA + offline architecture in Next.js

Type: grilling
Status: resolved
Blocked by: F-01 (01-nextjs-porting-matrix)

## Question

How do PWA + offline mode survive the Next.js port at full parity (user decision: keep both)?

- Service-worker strategy from F-01's matrix: which option, how VAPID push is registered, precache vs runtime cache scope.
- IndexedDB offline layer (idb-keyval + TanStack Query persistence): port plan, mutation queue semantics, and how it reconciles with Supabase Realtime when the connection returns (conflict handling → graduates the fog item).
- Interaction between realtime updates and the offline queue: which wins during reconnection, dedupe.

Grill the user one question at a time. Record the decision under `## Answer`.

## Answer

1. **SW strategy: Serwist** — active Workbox fork with Next.js/Turbopack build-time precache injection; existing `sw.ts` push + notificationclick logic ports 1:1; `app/manifest.ts` for the manifest (replacing vite-plugin-pwa manifest config); VAPID push subscription flow unchanged (backend-owned `tbl_push_subscriptions`).
2. **Offline data: read-only cache parity** — keep TanStack Query → IndexedDB (idb-keyval) dehydration with the same exclusions (audit-trail, stats), buster + 24h maxAge carried over. No mutation queue. Fog item "offline conflict-resolution semantics" dissolved — nothing writes offline.
3. Registration: replace `virtual:pwa-register` with Serwist registration; autoUpdate flow kept.
