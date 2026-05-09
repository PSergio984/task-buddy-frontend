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
  const { activeSidebarFilter, activeStatus, setActiveStatus, activeTagId } = useFilters()
  
  const isGroupFilter = activeSidebarFilter.startsWith("group:")
  const filterParam = activeStatus === "all" ? undefined : activeStatus
  const groupIdParam = isGroupFilter ? parseInt(activeSidebarFilter.split(":")[1]) : undefined

  const { data: tasks = [], isLoading: loadingTasks, refetch: refreshTasks } = useTasks(filterParam, groupIdParam, activeTagId || undefined)
  const { data: stats = null, isLoading: loadingStats, refetch: refreshStats } = useStats()

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }

  return (
    <Dashboard 
      tasks={tasks} 
      loadingTasks={loadingTasks}
      activeStatus={activeStatus} 
      onStatusChange={setActiveStatus} 
      onRefresh={handleRefresh}
      onEdit={handleEditTask}
      stats={stats}
      loadingStats={loadingStats}
    />
  )
}
