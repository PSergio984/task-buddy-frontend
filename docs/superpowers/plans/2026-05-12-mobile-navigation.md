# Mobile Navigation & PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a premium bottom navigation bar and mobile drawer for the Task Buddy PWA to ensure high productivity on small screens.

**Architecture:** Create modular `MobileNav` and `MobileDrawer` components. `MobileNav` handles core smart-list navigation and task creation, while `MobileDrawer` provides access to Projects/Tags. Both sync with the existing `FilterContext`.

**Tech Stack:** React, Tailwind CSS, Framer Motion, Lucide Icons, Radix UI (Sheet).

---

### Task 1: PWA Metadata & Safe Area Support

**Files:**
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Update viewport-fit in index.html**
```html
<!-- In <head> -->
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
```

- [ ] **Step 2: Add safe-area utility to index.css**
```css
/* Add to end of src/index.css */
@theme {
  --spacing-safe-bottom: env(safe-area-inset-bottom);
}

:root {
  --safe-area-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 3: Verify manifest theme color**
Ensure `vite.config.ts` has consistent `theme_color`. (Already verified as #0F172A).

- [ ] **Step 4: Commit**
```bash
git add index.html src/index.css
git commit -m "pwa: add viewport-fit and safe-area support"
```

---

### Task 2: Create MobileNav Component

**Files:**
- Create: `src/components/layout/mobile-nav.tsx`

- [ ] **Step 1: Implement the UI structure with Glassmorphism**
```tsx
import { motion } from "framer-motion"
import { Calendar, Inbox, Plus, ListChecks, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"

interface MobileNavProps {
  onNewTask: () => void
  onOpenWorkspace: () => void
}

export function MobileNav({ onNewTask, onOpenWorkspace }: MobileNavProps) {
  const { activeSidebarFilter, setActiveSidebarFilter, setActiveTagId } = useFilters()

  const tabs = [
    { id: "today", label: "Today", icon: Calendar, filter: "today" },
    { id: "inbox", label: "Inbox", icon: Inbox, filter: "inbox" },
    { id: "tasks", label: "Tasks", icon: ListChecks, filter: "all" },
  ]

  const handleTabClick = (filter: string) => {
    setActiveSidebarFilter(filter)
    setActiveTagId(null)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-white/5 bg-background/80 px-6 pb-[calc(1rem+var(--safe-area-bottom))] pt-3 backdrop-blur-2xl md:hidden">
      {tabs.slice(0, 2).map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.filter)}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeSidebarFilter === tab.filter ? "text-primary" : "text-foreground/40"
          )}
        >
          <tab.icon className="h-6 w-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}

      {/* Center Create Button */}
      <button
        onClick={onNewTask}
        className="relative -top-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
      >
        <Plus className="h-8 w-8" />
      </button>

      <button
        onClick={() => handleTabClick("all")}
        className={cn(
          "flex flex-col items-center gap-1 transition-all",
          activeSidebarFilter === "all" ? "text-primary" : "text-foreground/40"
        )}
      >
        <ListChecks className="h-6 w-6" />
        <span className="text-[10px] font-black uppercase tracking-widest">Tasks</span>
      </button>

      <button
        onClick={onOpenWorkspace}
        className="flex flex-col items-center gap-1 text-foreground/40"
      >
        <Layers className="h-6 w-6" />
        <span className="text-[10px] font-black uppercase tracking-widest">More</span>
      </button>
    </nav>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/layout/mobile-nav.tsx
git commit -m "ui: add MobileNav component"
```

---

### Task 3: Create MobileDrawer Component

**Files:**
- Create: `src/components/layout/mobile-drawer.tsx`

- [ ] **Step 1: Implement Workspace Drawer using Sheet**
```tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { useFilters } from "@/contexts/FilterContext"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"

interface MobileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileDrawer({ open, onOpenChange }: MobileDrawerProps) {
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const { activeSidebarFilter, setActiveSidebarFilter, activeTagId, setActiveTagId } = useFilters()

  const handleProjectClick = (id: number) => {
    setActiveSidebarFilter(`project:${id}`)
    setActiveTagId(null)
    onOpenChange(false)
  }

  const handleTagClick = (id: number) => {
    setActiveTagId(id)
    setActiveSidebarFilter("all")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] border-t border-white/10 bg-background/95 backdrop-blur-2xl px-6 pb-12">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-center text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Workspace</SheetTitle>
        </SheetHeader>

        <div className="space-y-10 overflow-y-auto no-scrollbar pb-20">
          {/* Projects */}
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-primary">Projects</h3>
            <div className="grid grid-cols-2 gap-3">
              {projects.map((p) => {
                const Icon = (LucideIcons as any)[p.icon || "Layers"] || LucideIcons.Layers
                const isActive = activeSidebarFilter === `project:${p.id}`
                return (
                  <button
                    key={p.id}
                    onClick={() => handleProjectClick(p.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl p-4 transition-all border",
                      isActive ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-transparent text-foreground/70"
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: p.color }} />
                    <span className="text-sm font-bold truncate">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="px-2 text-[10px] font-black uppercase tracking-widest text-primary">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTagClick(t.id)}
                  className={cn(
                    "rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all",
                    activeTagId === t.id ? "bg-primary text-primary-white border-primary" : "bg-white/5 border-white/5 text-foreground/60"
                  )}
                  style={{ color: activeTagId === t.id ? undefined : t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/components/layout/mobile-drawer.tsx
git commit -m "ui: add MobileDrawer for workspace access"
```

---

### Task 4: Layout Integration

**Files:**
- Modify: `src/components/layout/main-layout.tsx`

- [ ] **Step 1: Integrate components and handle state**
```tsx
// ... imports
import { MobileNav } from "./mobile-nav"
import { MobileDrawer } from "./mobile-drawer"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "create">("view")
  
  // NEW: State for Mobile Workspace Drawer
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false)

  // ... existing handlers

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden pb-24 md:pb-0">
        <TopNav onNewTask={handleOpenNewTask} />
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            <Outlet context={{ handleEditTask }} />
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav 
          onNewTask={handleOpenNewTask} 
          onOpenWorkspace={() => setIsMobileWorkspaceOpen(true)} 
        />
      </div>

      <MobileDrawer 
        open={isMobileWorkspaceOpen} 
        onOpenChange={setIsMobileWorkspaceOpen} 
      />

      <TaskDetailDrawer ... />
    </div>
  )
}
```

- [ ] **Step 2: Verify desktop layout is unaffected**
Run the app and ensure the sidebar still works and the mobile nav is hidden (`md:hidden`).

- [ ] **Step 3: Commit**
```bash
git add src/components/layout/main-layout.tsx
git commit -m "feat: integrate mobile navigation into MainLayout"
```

---

### Task 5: Final Polish & Verification

**Files:**
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Ensure sidebar is explicitly hidden on small screens**
Confirm `md:flex` and `hidden` classes are correct.

- [ ] **Step 2: Run build to check for type errors**
Run: `npm run build`
Expected: SUCCESS

- [ ] **Step 3: Commit**
```bash
git commit -m "chore: finalize mobile nav integration"
```
