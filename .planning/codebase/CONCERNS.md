<!-- generated-by: gsd-doc-writer -->
# Codebase Concerns

**Analysis Date: 2026-05-13**
**Updated: 2026-05-15**

## Tech Debt (Frontend)

**App.tsx Bloat:**
- Issue: `App.tsx` has become a large monolithic component handling too many responsibilities (global providers, complex routing logic, notification watchers, and lazy-loading definitions).
- Impact: Harder to maintain the high-level orchestration; increasing cognitive load for routing changes.
- Fix approach: Extract providers into a `ComposeProviders` utility; move route definitions into a separate `Router` configuration file.

**Stateless JWT Logout:**
- Issue: Logout currently clears the client-side session and the HttpOnly cookie, but the backend does not yet support token blacklisting.
- Impact: If a token is stolen before logout, it remains valid until its natural expiration.
- Fix approach: Implement a server-side token blacklist or transition to shorter-lived access tokens with refresh tokens.

**Monolithic Page Components:**
- Issue: Core pages like `TasksPage.tsx` and `ProfilePage.tsx` are large and handle multiple responsibilities.
- Impact: Slower development cycle for these views and higher risk of regression.
- Fix approach: Continue extracting logic into smaller components and domain-specific hooks.

## Performance Bottlenecks

**Large Bundle Size:**
- Problem: Reliance on libraries like `framer-motion`, `lucide-react`, and `radix-ui`.
- Status: **PARTIALLY RESOLVED** (2026-05-15) - Implemented route-based code-splitting using `React.lazy` and `Suspense`.
- Next targets: Ensure tree-shaking for icons and implement component-level lazy loading for heavy UI elements (e.g., complex charts or drawers).

**Performance skeletons:**
- Issue: Page transitions can feel abrupt without proper loading states.
- Status: **IN PROGRESS** - Adding skeleton loaders for Task lists and Sidebar content to improve perceived performance.

## Security Considerations

**Token Exposure in localStorage:**
- Status: **RESOLVED** (2026-05-15) - Migrated to HttpOnly cookies for session tokens.
- Note: User metadata is still stored in `localStorage` for UI hydration, but no sensitive authentication material is accessible to client-side scripts.

**Client-Side Route Protection:**
- Note: `ProtectedRoute` is a UI convenience. Server-side authorization remains the source of truth.

## Fragile Areas

**Sidebar Reordering (DND):**
- Why fragile: Drag-and-drop interactions can be sensitive to DOM structure changes and state synchronization issues.
- Status: **HARDENED** (2026-05-15) - Implemented `@dnd-kit` with optimistic updates to ensure smooth reordering of projects and tags.

**Stable Time Picker:**
- Why fragile: Handling date/time inputs across different timezones and locales can lead to inconsistent data.
- Status: **HARDENED** (2026-05-15) - Standardized on `react-time-picker` with `date-fns` for consistent formatting.

## Test Coverage Gaps

**Playwright E2E Coverage:**
- What's missing: While auth and basic task flows are covered, complex DND interactions and sidebar reordering need dedicated E2E specs.
- Priority: Medium.

---

## Backend-Related Concerns (Cross-Project)

*Note: These concerns are tracked here as they impact frontend reliability and integration.*

**Sync Password Hashing (Backend):**
- Problem: Blocking calls in async routes for password verification.
- Impact: Can cause request timeouts under high auth load.

**Missing JWT Revocation:**
- Problem: Logout only clears client-side state.
- Impact: Stolen tokens remain valid until expiration.

---

*Concerns audit: 2026-05-15*
