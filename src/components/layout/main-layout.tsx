import { useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { NewTaskModal } from "@/components/new-task-modal"
import { TaskDetailDrawer } from "@/components/task-detail-drawer"
import { useCreateTask } from "@/hooks/useTasks"
import type { Task } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()

  const { mutateAsync: createTask, isPending: isCreating } = useCreateTask()

  const handleOpenNewTask = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsDrawerOpen(true)
  }

  const handleSaveTask = async (
    taskData: Omit<Task, "id" | "created_at" | "user_id">
  ) => {
    try {
      await createTask(taskData)
      toast({
        title: "Task created",
        description: "New objective has been created.",
        variant: "success",
      })
      
      setIsModalOpen(false)
      setEditingTask(null)
      
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
      />

      {/* Main Content Wrapper */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Navigation */}
        <TopNav 
          onNewTask={handleOpenNewTask} 
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">
            <Outlet context={{ 
              handleEditTask
            }} />
          </div>
        </main>
      </div>

      {/* Global Task Modal (Create Only) */}
      <NewTaskModal
        key="new-task-modal"
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSaveTask}
        isLoading={isCreating}
      />

      {/* Global Task Detail Drawer (View/Edit) */}
      <TaskDetailDrawer
        task={editingTask}
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
      />
    </div>
  )
}
