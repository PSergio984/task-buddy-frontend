# Phase 1: Frontend UX & Integration Rework - Research

**Researched:** 2026-05-08
**Domain:** Frontend UI/UX, Component Layout, State Integration
**Confidence:** HIGH

## Summary
The phase focuses on refactoring the frontend layout to be persistent, cleaning up AI-generated UX "slop" (verbose copy, redundant UI elements), and modernizing loading states and icons. Additionally, it requires ensuring data integration aligns with recent backend changes (which standardized CRUD operations and API literals).

**Primary recommendation:** Introduce a `MainLayout` wrapper component to manage the `TopNav` and `Sidebar` persistently, removing them from individual page components to prevent re-rendering/animating on route changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Overall Style:** Remove over-engineered or unnatural "AI slop" design elements while keeping the parts that work. Use the `ui-ux-pro-max` skill for design intelligence.
- **Dashboard & Sidebar Layout:**
  - Stop the header and sidebar from reloading or animating on every page change. They should remain static/persistent across route transitions.
  - "Massively improve" the sidebar: make it collapsible.
  - Remove redundant user profile/session info from the sidebar/dashboard if it's unnecessary, including the "disconnect session" (logout) button there.
- **Typography & Copy:** 
  - Change unnatural wording (e.g., replace "forge task" with standard wording like "Create Task" or "Add Task").
  - Change the font of the "executive dashboard" header to something more appropriate.
- **Loading States:** Improve the plain/inadequate loading bar. Use a more polished loading indicator.
- **Icons:** Add more icons throughout the UI to improve visual hierarchy.

### Landing Page
- Keep the existing great overall design but improve it slightly.
- Remove or fix the "watch demo" button since there is no demo video.
- Update the hardcoded copyright year to be dynamic.

### Data Integration
- Ensure the frontend pulls the correct information from the backend, accommodating recent backend schema/data changes.

### the agent's Discretion
- Exact font choice for the dashboard header.
- Specific loading indicator design (e.g., spinner vs. skeleton).
- Iconography choices (using `lucide-react`).
- Specific minor improvements to the Landing Page design.

### Deferred Ideas (OUT OF SCOPE)
- None.
</user_constraints>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Layout Persistence | Browser (React Router) | — | Moving `Sidebar` and `TopNav` to a shared layout wrapper (e.g., `MainLayout`) utilizes React Router's `<Outlet>` for seamless route transitions without remounting shell components. |
| UI Interactivity | Browser (React) | — | Managing sidebar collapse state and modals via React state (`useState`/Zustand). |
| API Communication | Browser (Hooks) | API / Backend | Hooks (`useApi.ts`) fetch data, accommodating backend schema changes dynamically. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.4 | UI Framework | Current project standard, component-based structure |
| React Router DOM | ^7.15.0 | Routing | Handles `<Outlet>` for persistent layouts |
| Tailwind CSS | ^4.2.1 | Styling | Utility-first styling for quick layout fixes |
| Lucide React | ^1.14.0 | Icons | Existing icon library, needed to add more icons |
| shadcn/ui | ^4.7.0 | UI Primitives | Accessible and customizable components |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Router | Next.js | Migration too heavy for a UI rework phase; stick to React Router `Outlet`. |

## Architecture Patterns

### Recommended Project Structure (Changes)
```
src/
├── components/
│   ├── layout/            # NEW: Folder for layout components
│   │   └── main-layout.tsx # NEW: Wraps TopNav, Sidebar, and <Outlet />
│   ├── sidebar.tsx        # UPDATE: Make collapsible, remove redundant user info
│   └── topnav.tsx         # UPDATE: Rename "Forge Task", ensure dropdown has logout
├── pages/                 # UPDATE: Remove TopNav and Sidebar from all pages
└── App.tsx                # UPDATE: Use <Route element={<MainLayout />}>
```

### Pattern 1: Persistent Layout using React Router
**What:** Wrapping protected routes in a layout component that includes static elements like navigation.
**When to use:** When header/sidebar should not unmount during page transitions.
**Example:**
```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/topnav";

export function MainLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Duplicating Shell Components:** Including `<Sidebar>` and `<TopNav>` directly inside `<Dashboard>`, `<ProfilePage>`, and `<AuditLogsPage>` causes unmounting on route changes.
- **"AI Slop" Copy:** Avoid over-the-top wording like "Forge Task" or "Operational Status: Optimal" (found in TopNav). Use standard UI conventions ("Create Task").

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading Spinners | Custom CSS animations | `lucide-react` `Loader2` or shadcn `Skeleton` | Consistency and ease of maintenance |
| Collapsible Sidebar | Complex custom resize logic | Standard Tailwind classes (e.g., `w-64` vs `w-[72px]`) | Performance and simplicity |

## Runtime State Inventory

> Omitted: This is a frontend layout and UI component refactor phase.

## Common Pitfalls

### Pitfall 1: Sidebar State Prop Drilling
**What goes wrong:** Passing the collapsed state of the sidebar through deeply nested components.
**Why it happens:** Reacting to a layout change at a leaf node instead of the layout root.
**How to avoid:** Keep `isCollapsed` state isolated to the Sidebar itself or within the layout wrapper.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Remounting nav on page | Layout wrapper with `<Outlet>` | Now | Smooth page transitions, no animation flicker |
| "Forge Task" button | "Create Task" button | Now | Improved clarity for users |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Backend schema changes in Phase 1 did not fundamentally break the `useApi` hook signatures | Data Integration | Minor API fixes needed during integration testing |

## Open Questions (RESOLVED)

1. **Dynamic Copyright Year**
   - What we know: Landing page footer currently has hardcoded "2026".
   - RESOLVED: Use `{new Date().getFullYear()}` in React.

## Environment Availability

Step 2.6: SKIPPED (no external dependencies identified for UI rework)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright |
| Config file | `playwright.config.ts` |
| Quick run command | `npm run test:e2e` |
| Full suite command | `npm run test:e2e` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | Sidebar persists across navigation | e2e | `npx playwright test` | ❌ Wave 0 |
| UI-02 | TopNav has standard copy "Create Task" | e2e | `npx playwright test` | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] Update E2E tests for the changed copy ("Forge Task" -> "Create Task").
- [ ] Create UI transition tests to ensure layout components do not unmount.

## Sources

### Primary (HIGH confidence)
- `.planning/phases/01-frontend-rework/01-CONTEXT.md` - Phase constraints.
- `src/App.tsx`, `src/components/sidebar.tsx` - Current implementation files.
- `docs/codebase/STACK.md` - Framework specs.

## Metadata
**Confidence breakdown:**
- Standard stack: HIGH - Verified via reading files
- Architecture: HIGH - Layout wrapper pattern is standard React Router
- Pitfalls: HIGH - Common React issue

**Research date:** 2026-05-08
**Valid until:** Next major React Router bump
