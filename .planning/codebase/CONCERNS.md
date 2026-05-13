<!-- generated-by: gsd-doc-writer -->
# Codebase Concerns

**Analysis Date: 2026-05-13**

## Tech Debt (Frontend)

**Monolithic Page Components:**
- Issue: Core pages are very large and handle too many responsibilities (data fetching, state management, complex rendering).
- Files: `src/pages/TasksPage.tsx` (21KB+), `src/pages/ProfilePage.tsx` (19KB+), `src/pages/LandingPage.tsx` (15KB+).
- Impact: Harder to test in isolation, slow dev-server refresh times for these files, and difficult to reason about side effects.
- Fix approach: Extract logic into smaller components and use domain-specific hooks to offload state management.

**Prop Drilling in Task Components:**
- Issue: Some task-related data is passed down through several layers of components.
- Impact: Maintenance burden when changing component signatures.
- Fix approach: Use `FilterContext` or TanStack Query's cache directly in leaf components where appropriate.

## Performance Bottlenecks

**Large Bundle Size:**
- Problem: Heavy reliance on large libraries like `framer-motion`, `lucide-react`, and `radix-ui` can impact initial load time.
- Impact: Slower "Time to Interactive" on mobile devices.
- Improvement path: Implement code-splitting for pages using `React.lazy` and ensure tree-shaking is working effectively for icon libraries.

**PWA Cache Invalidation:**
- Problem: Users might occasionally see stale versions of the app if the Service Worker update logic isn't perfectly synced with the backend API changes.
- Mitigation: Using `registerType: "autoUpdate"` in VitePWA, but manual refresh prompts might be safer for critical updates.

## Security Considerations

**Token Exposure in localStorage:**
- Risk: JWT tokens stored in `localStorage` are vulnerable to XSS attacks.
- Mitigation: The app uses sanitization for inputs, but migrating to `httpOnly` cookies for tokens would be more secure (requires backend coordination).

**Client-Side Route Protection:**
- Note: `ProtectedRoute` is purely a UI convenience. Server-side authorization remains the only source of truth for data access.

## Fragile Areas

**Push Notification Subscription Flow:**
- Why fragile: Relies on browser-specific permissions and VAPID key sync.
- Current state: Implementation is present in `sw.ts` but requires rigorous testing across different browsers (Safari/Chrome/Firefox).

**Deeply Nested API Errors:**
- Issue: The backend occasionally returns nested error structures that the frontend `getAuthErrorMessage` must recursively parse.
- Risk: Changes in backend error shapes can break UI error reporting.

## Test Coverage Gaps

**Hook and Component Tests:**
- What's missing: While Vitest is configured, coverage for complex hooks like `useTasks` and `useNotifications` is minimal.
- Priority: High - specifically for logic-heavy hooks that orchestrate multiple mutations.

---

## Backend-Related Concerns (Cross-Project)

*Note: These concerns are tracked here as they impact frontend reliability and integration.*

**Sync Password Hashing (Backend):**
- Problem: Blocking calls in async routes for password verification.
- Impact: Can cause request timeouts under high auth load.

**Missing JWT Revocation:**
- Problem: Logout only clears client-side state.
- Impact: Stolen tokens remain valid until expiration.

**In-Memory Rate Limiting:**
- Problem: Not shared across multiple server instances.
- Impact: Inconsistent rate limiting in scaled environments.

---

*Concerns audit: 2026-05-13*
