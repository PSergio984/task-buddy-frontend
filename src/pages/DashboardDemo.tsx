import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { Dashboard } from "@/components/dashboard"
import { NewTaskModal } from "@/components/new-task-modal"
import { useState } from "react"
import { useCreateTask } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"

export function DashboardDemo() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { createTask, loading: isCreating } = useCreateTask()

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createTask(taskData)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top Navigation */}
      <TopNav onNewTask={() => setIsModalOpen(true)} />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar activeFilter={activeFilter} onFilterChange={setActiveFilter} />

        {/* Dashboard */}
        <Dashboard 
          tasks={[]} 
          activeFilter="all" 
          onFilterChange={() => {}} 
          onRefresh={() => {}}
          stats={null}
          loadingStats={false}
        />
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateTask}
        isLoading={isCreating}
      />
    </div>
  )
}
