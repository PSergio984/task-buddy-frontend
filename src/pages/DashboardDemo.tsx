import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { Dashboard } from "@/components/dashboard"
import { NewTaskModal } from "@/components/new-task-modal"
import { useState, useCallback } from "react"
import { useCreateTask, useTasks, useStats } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"

export function DashboardDemo() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { tasks, refreshTasks } = useTasks(activeFilter === "all" ? undefined : activeFilter)
  const { stats, loading: loadingStats, refreshStats } = useStats()
  const { createTask, loading: isCreating } = useCreateTask()

  const handleRefresh = useCallback(async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }, [refreshTasks, refreshStats])

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createTask(taskData)
      setIsModalOpen(false)
      await handleRefresh()
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top Navigation */}
      <TopNav onNewTask={() => setIsModalOpen(true)} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Dashboard */}
        <Dashboard 
          tasks={tasks} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
          onRefresh={handleRefresh}
          onEdit={() => {}}
          stats={stats}
          loadingStats={loadingStats}
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
