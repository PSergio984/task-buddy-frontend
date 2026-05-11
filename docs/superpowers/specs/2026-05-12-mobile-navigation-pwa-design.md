# Design Spec: Mobile Navigation & PWA Polish

## 1. Objective
Implement an industry-standard mobile navigation system for the Task Buddy PWA to ensure thumb-friendly capture and navigation while maintaining the premium desktop aesthetic.

## 2. Components
### 2.1 MobileNav (`components/layout/mobile-nav.tsx`)
- **UI:** Fixed bottom bar (`bottom-0`), `md:hidden`.
- **Items:** 
  1. **Today** (Smart List)
  2. **Inbox** (Smart List)
  3. **Create** (FAB - Elevated)
  4. **Tasks** (All Tasks)
  5. **Workspace** (Drawer Trigger)
- **Styling:** Glassmorphic (80% opacity, 20px blur), active state indicator.

### 2.2 MobileDrawer (`components/layout/mobile-drawer.tsx`)
- **UI:** Bottom-up sheet (reusing `ui/sheet`).
- **Content:** 
  - Search bar for quick filtering.
  - Collapsible **Projects** section.
  - Collapsible **Tags** section.
- **Sync:** Reuses logic from `Sidebar.tsx`.

## 3. Technical Integration
- **State:** Uses `FilterContext` to drive cross-page filtering.
- **PWA:** 
  - Update `index.html` meta tags for `viewport-fit=cover`.
  - Ensure `manifest.webmanifest` theme colors are consistent.
- **Animations:** `Framer Motion` for drawer entry and tab transitions.

## 4. Success Criteria
- Navigation is thumb-accessible on small screens.
- Capture (Create Task) is a single tap away on mobile.
- "More" drawer provides full access to Projects and Tags without cluttering the main UI.
- PWA feels native with safe-area support.
