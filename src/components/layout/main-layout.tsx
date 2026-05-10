import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { TaskDetailDrawer } from "@/components/task-detail-drawer"
import type { Task } from "@/lib/api"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [drawerMode, setDrawerMode] = useState<"view" | "create">("view")

  const handleOpenNewTask = () => {
    setActiveTask(null)
    setDrawerMode("create")
    setIsDrawerOpen(true)
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
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Navigation */}
        <TopNav onNewTask={handleOpenNewTask} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            <Outlet context={{ handleEditTask }} />
          </div>
        </main>
      </div>

      {/* Global Task Drawer — handles both Create and View/Edit */}
      <TaskDetailDrawer
        task={activeTask}
        mode={drawerMode}
        isOpen={isDrawerOpen}
        onOpenChange={(open) => {
          setIsDrawerOpen(open)
          if (!open) {
            setActiveTask(null)
          }
        }}
      />
    </div>
  )
}
