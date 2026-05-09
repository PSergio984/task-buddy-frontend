import { Dashboard } from "@/components/dashboard"
import { useTasks } from "@/hooks/useTasks"
import { useStats } from "@/hooks/useStats"
import { useFilters } from "@/contexts/FilterContext"
import { useOutletContext } from "react-router-dom"
import type { Task } from "@/lib/api"

interface LayoutContext {
  handleEditTask: (task: Task) => void
}

export function DashboardDemo() {
  const { handleEditTask } = useOutletContext<LayoutContext>()
  const { activeSidebarFilter, activeTagId } = useFilters()
  
  const isProjectFilter = activeSidebarFilter.startsWith("project:")
  const projectIdParam = isProjectFilter ? parseInt(activeSidebarFilter.split(":")[1]) : undefined

  // For Dashboard, we want to fetch all tasks and filter them by time locally
  const { data: tasks = [], isLoading: loadingTasks, refetch: refreshTasks } = useTasks(undefined, projectIdParam, activeTagId || undefined)
  const { data: stats = null, isLoading: loadingStats, refetch: refreshStats } = useStats()

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }

  return (
    <Dashboard 
      tasks={tasks} 
      loadingTasks={loadingTasks}
      onRefresh={handleRefresh}
      onEdit={handleEditTask}
      stats={stats}
      loadingStats={loadingStats}
    />
  )
}
