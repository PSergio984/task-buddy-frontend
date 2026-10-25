# Changelog

## 2026-10-25 — Containerization + PWA install prompt

### Added

- **`Dockerfile`** — multi-stage build producing a standalone Node image
  (deps → `next build --webpack` → slim runner copying `.next/standalone` +
  `.next/static` + `public`). Build args: `BACKEND_URL`,
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
  Used by `task-buddy-backend/docker-compose.fullstack.yml`.
- **`.dockerignore`** — keeps `node_modules`, `.next`, `.env*` out of the
  build context.

### Earlier this weekend (already pushed, `6d88742`)

- PWA install prompt (`src/components/install-prompt.tsx`) + real PNG icons;
  `app/manifest.ts` + layout metadata updates.

### Changed

- **`next.config.ts`** — `output: "standalone"` for the Docker runtime.
