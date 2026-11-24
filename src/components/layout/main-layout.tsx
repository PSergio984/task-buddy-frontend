import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { FloatingSidebar } from "./FloatingSidebar"
import { useTheme } from "@/components/theme-provider"
import { TopNav } from "@/components/topnav"
import { TaskDetailDrawer } from "@/components/task-detail-drawer"
import { BreakdownSheet } from "@/components/breakdown-sheet"
import { ImportSheet } from "@/components/import-sheet"
import { MobileNav } from "./mobile-nav"
import { MobileDrawer } from "./mobile-drawer"
import { FocusMiniBar } from "./focus-mini-bar"
import type { Task } from "@/lib/api"
import { useStats } from "@/hooks/useStats"
import { useAuth } from "@/contexts/AuthContext"
import { useFilters } from "@/contexts/FilterContext"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "create">("view")
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [breakdownContextTask, setBreakdownContextTask] = useState<Task | null>(
    null
  )
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const rawView = location.pathname.replace(/^\//, "").split("/")[0] || "tasks"
  const currentView = rawView === "dashboard" || !rawView ? "tasks" : rawView

  const handleSelectView = (viewId: string) => {
    navigate(`/${viewId}`)
  }

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }
  // Current UI project context (sidebar "project:<id>" filter) for commits.
  const { activeSidebarFilter } = useFilters()
  const activeProjectId = activeSidebarFilter.startsWith("project:")
    ? Number.parseInt(activeSidebarFilter.split(":")[1], 10) || undefined
    : undefined

  // Mobile Workspace Drawer state
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false)

  const { user } = useAuth()
  const { data: stats } = useStats()
  const { toast } = useToast()
  const taskCount = stats?.task_stats?.total_tasks ?? 0
  const isTaskLimitReached = taskCount >= 1000

  const handleOpenNewTask = () => {
    setActiveTask(null)
    setDrawerMode("create")
    setIsDrawerOpen(true)
  }

  const handleMobileNewTaskClick = () => {
    if (isTaskLimitReached) {
      toast({
        title: "Task limit reached",
        description: "You have reached the maximum limit of 1000 tasks.",
        variant: "destructive",
      })
      return
    }
    handleOpenNewTask()
  }

  const handleEditTask = (task: Task) => {
    setActiveTask(task)
    setDrawerMode("view")
    setIsDrawerOpen(true)
  }

  const handleOpenBreakdown = (task?: Task) => {
    setBreakdownContextTask(task ?? null)
    setIsBreakdownOpen(true)
  }

  return (
    <div className="flex h-svh overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Persistent Desktop Floating Sidebar */}
      {!isCollapsed ? (
        <div className="hidden h-full shrink-0 p-3 pr-0 md:flex">
          <FloatingSidebar
            activeView={currentView}
            onSelectView={handleSelectView}
            theme={theme === "light" ? "light" : "dark"}
            onToggleTheme={handleToggleTheme}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
            taskCount={taskCount}
            userName={user?.username ?? user?.email ?? "User"}
          />
        </div>
      ) : (
        <div className="hidden h-full shrink-0 items-start p-3 pr-0 md:flex">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand Sidebar"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] text-[var(--gray-400)] shadow-xs transition-colors hover:bg-[var(--gray-50)] hover:text-[var(--ink)]"
          >
            ◫
          </button>
        </div>
      )}

      {/* Main Content Wrapper (Dual Island) */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pb-24 md:p-3 md:pb-0">
        <main className="main-island relative flex flex-1 flex-col overflow-hidden rounded-[16px] border border-[var(--gray-200)] border-gray-200 bg-[var(--bg)] shadow-xs">
          {/* Top Navigation */}
          <TopNav
            onNewTask={handleOpenNewTask}
            onBreakdown={() => handleOpenBreakdown()}
            onImport={() => setIsImportOpen(true)}
          />

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="w-full">
              <Outlet context={{ handleEditTask }} />
            </div>
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav
          onOpenWorkspace={() => setIsMobileWorkspaceOpen(true)}
          isWorkspaceOpen={isMobileWorkspaceOpen}
        />

        {/* Persistent focus-session chip (all pages but /focus) */}
        <FocusMiniBar />
      </div>

      {/* Floating Action Button (FAB) for mobile viewports */}
      <button
        id="mobile-new-task-fab"
        onClick={handleMobileNewTaskClick}
        className={cn(
          "fixed right-6 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 shadow-lg backdrop-blur-md transition-all duration-200 active:scale-95 md:hidden",
          isTaskLimitReached
            ? "cursor-not-allowed bg-muted text-foreground/20 grayscale"
            : "bg-primary text-primary-foreground shadow-primary/20 hover:scale-105 hover:bg-primary/90 active:bg-primary/85"
        )}
      >
        <Plus className="h-6 w-6 stroke-[3px]" />
      </button>

      {/* Mobile Workspace Drawer */}
      <MobileDrawer
        open={isMobileWorkspaceOpen}
        onOpenChange={setIsMobileWorkspaceOpen}
      />

      {/* Global Task Drawer — handles both Create and View/Edit */}
      <TaskDetailDrawer
        task={activeTask}
        mode={drawerMode}
        isOpen={isDrawerOpen}
        onOpen={() => setIsDrawerOpen(true)}
        onClose={() => {
          setIsDrawerOpen(false)
          setActiveTask(null)
        }}
        onBreakdown={handleOpenBreakdown}
      />

      {/* Global Breakdown Bot Sheet */}
      <BreakdownSheet
        isOpen={isBreakdownOpen}
        onClose={() => {
          setIsBreakdownOpen(false)
          setBreakdownContextTask(null)
        }}
        contextTask={breakdownContextTask}
        projectId={activeProjectId}
      />

      {/* Global Notes Import Sheet */}
      <ImportSheet
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        projectId={activeProjectId}
      />
    </div>
  )
}
