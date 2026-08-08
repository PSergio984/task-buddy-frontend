# F-05 — SSR surface decision

Type: grilling
Status: resolved
Blocked by: F-01 (01-nextjs-porting-matrix)

## Question

Which pages render server-side vs client-side in the Next.js port? User chose client-heavy with SSR on public pages; pin down exactly which routes are server-rendered (landing/login — the SEO surface) and which stay client components (the authenticated app), plus hydration boundaries (session check, auth-gated redirects).

Grill the user one question at a time. Record the decision under `## Answer`.

## Answer

1. **SSR surface: all public pages** — `/` landing, `/login`, `/register`, `/forgot-password`, `/reset-password/:token`, `/verify-email` as server components with metadata/OG; the authenticated app (`/dashboard`, `/tasks`, `/profile`, `/audit-logs`) stays client components under `MainLayout`.
2. **Auth gating: middleware edge check + retained client gate** — Next.js middleware inspects the auth cookie, redirects to `/login` pre-render; existing `ProtectedRoute` client gate stays as a session-expiry fallback. Fog item "public-page SEO strategy" resolved by (1).
