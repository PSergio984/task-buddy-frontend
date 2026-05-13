<!-- generated-by: gsd-doc-writer -->
# External Integrations

**Analysis Date: 2024-05-13**

## APIs & External Services

**Task Buddy API (Backend):**
- Primary data source for tasks, projects, tags, and users.
- Auth: JWT (Bearer token in header).
- Client: Axios with interceptors in `src/lib/api.ts`.
- Synchronization: TanStack Query (React Query) v5.

## Data Storage

**Client-Side Cache:**
- TanStack Query: In-memory cache for server data with background revalidation.
- Configuration: Managed in `src/lib/query-client.ts` and provided in `src/main.tsx`.

**Persistence:**
- `localStorage`: Used for persisting the JWT token and user basic info (`AuthContext`).
- IndexedDB (Implicit): Used by Service Worker (Workbox) for precaching static assets.

## Progressive Web App (PWA)

**PWA Engine:**
- Vite PWA Plugin (`vite-plugin-pwa`): Manages manifest generation and Service Worker registration.
- Service Worker: `src/sw.ts` implements `injectManifest` strategy for custom logic (precaching + push).

**Capabilities:**
- Installable: Desktop and mobile (Android/iOS).
- Offline Support: Precaching of core application assets.
- Push Notifications: Integrated with browser Push API via the Service Worker.

## Authentication & Identity

**JWT Implementation:**
- Custom backend-issued tokens.
- Frontend Lifecycle:
  - Token stored on login/register.
  - Injected into every request via Axios interceptors.
  - Token cleared on logout or 401 response.

## Monitoring & Observability

**Error Tracking:**
- Sentry: Configured for backend (not currently active in frontend repo, but planned/optional).
- Logs: Browser console for development; Toast notifications for user-facing errors.

## CI/CD & Deployment

**GitHub Actions:**
- Frontend flows include Datadog synthetics and general CI checks.
- Build Process: `npm run build` generates a production-ready `dist/` folder via Vite.

**Hosting Requirements:**
- Must support HTTPS for PWA features.
- Needs to handle SPA routing (redirecting all non-file requests to `index.html`).

## Environment Configuration

**Vite Environment Variables:**
- `VITE_API_BASE_URL`: Base URL for the backend API.
- `VITE_VAPID_PUBLIC_KEY`: (Optional) For push notification subscription.

---

*Integration audit: 2024-05-13*
