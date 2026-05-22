import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { TaskDetailDrawer } from "@/components/task-detail-drawer"
import { MobileNav } from "./mobile-nav"
import { MobileDrawer } from "./mobile-drawer"
import type { Task } from "@/lib/api"
import { useStats } from "@/hooks/useStats"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "create">("view")

  // Mobile Workspace Drawer state
  const [isMobileWorkspaceOpen, setIsMobileWorkspaceOpen] = useState(false)

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

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Persistent Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden pb-24 md:pb-0">
        {/* Persistent Top Navigation */}
        <TopNav onNewTask={handleOpenNewTask} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            <Outlet context={{ handleEditTask }} />
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav 
          onOpenWorkspace={() => setIsMobileWorkspaceOpen(true)} 
          isWorkspaceOpen={isMobileWorkspaceOpen}
        />
      </div>

      {/* Floating Action Button (FAB) for mobile viewports */}
      <button
        id="mobile-new-task-fab"
        onClick={handleMobileNewTaskClick}
        className={cn(
          "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all duration-200 active:scale-95 md:hidden border border-white/10 backdrop-blur-md",
          isTaskLimitReached
            ? "bg-muted text-foreground/20 cursor-not-allowed grayscale"
            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:scale-105 active:bg-primary/85"
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
      />
    </div>
  )
}
