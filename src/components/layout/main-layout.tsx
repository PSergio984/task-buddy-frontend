import { useState, useCallback } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { NewTaskModal } from "@/components/new-task-modal"
import { useCreateTask, useUpdateTask, useTasks, useStats } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"
import { useToast } from "@/hooks/use-toast"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeFilter, setActiveFilter] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Lifted data state to ensure consistency and prevent redundant fetches
  const { tasks, loading: loadingTasks, refreshTasks } = useTasks(activeFilter === "all" ? undefined : activeFilter)
  const { stats, loading: loadingStats, refreshStats } = useStats()
  const { createTask, loading: isCreating } = useCreateTask()
  const { updateTask, loading: isUpdating } = useUpdateTask()

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }, [refreshTasks, refreshStats])

  const handleOpenNewTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleSaveTask = async (
    taskData: Omit<Task, "id" | "created_at" | "user_id">
  ) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData)
        toast({
          title: "Task updated",
          description: "Your changes have been synchronized.",
          variant: "success",
        })
      } else {
        await createTask(taskData)
        toast({
          title: "Task created",
          description: "New objective has been manifested.",
          variant: "success",
        })
      }
      
      setIsModalOpen(false)
      setEditingTask(null)
      await handleRefresh()
      
      // If we're not on dashboard, navigation to it provides better UX after creation
      if (location.pathname !== "/dashboard") {
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Failed to save task:", error)
      toast({
        title: "Error",
        description: "Failed to save task. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      {/* Persistent Sidebar */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        onToggle={() => setIsCollapsed(!isCollapsed)}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Navigation */}
        <TopNav 
          onNewTask={handleOpenNewTask} 
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            <Outlet context={{ 
              tasks, 
              loadingTasks, 
              stats, 
              loadingStats, 
              activeFilter, 
              setActiveFilter, 
              handleRefresh,
              handleEditTask
            }} />
          </div>
        </main>
      </div>

      {/* Global Task Modal (Manifest/Refine) */}
      <NewTaskModal
        key={isModalOpen ? (editingTask ? `edit-${editingTask.id}` : "new") : "closed"}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSaveTask}
        isLoading={isCreating || isUpdating}
        task={editingTask}
      />
    </div>
  )
}
