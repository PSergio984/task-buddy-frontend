import { Dashboard } from "@/components/dashboard"
import { useOutletContext } from "react-router-dom"
import type { Task, StatsOverview } from "@/hooks/useApi"

interface LayoutContext {
  tasks: Task[]
  loadingTasks: boolean
  stats: StatsOverview | null
  loadingStats: boolean
  activeStatus: string
  setActiveStatus: (status: string) => void
  handleRefresh: () => Promise<void>
  handleEditTask: (task: Task) => void
}

export function DashboardDemo() {
  const { 
    tasks, 
    stats, 
    loadingStats, 
    activeStatus, 
    setActiveStatus, 
    handleRefresh,
    handleEditTask
  } = useOutletContext<LayoutContext>()

  return (
    <Dashboard 
      tasks={tasks} 
      activeStatus={activeStatus} 
      onStatusChange={setActiveStatus} 
      onRefresh={handleRefresh}
      onEdit={handleEditTask}
      stats={stats}
      loadingStats={loadingStats}
    />
  )
}

