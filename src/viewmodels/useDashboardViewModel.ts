import { useOutletContext } from "react-router-dom"
import { useTasks } from "@/hooks/useTasks"
import { useStats } from "@/hooks/useStats"
import { useFilters } from "@/contexts/FilterContext"
import {
  parseProjectIdFromFilter,
  type Task,
} from "@/models/dashboard.model"

interface LayoutContext {
  handleEditTask: (task: Task) => void
}

export function useDashboardViewModel() {
  const { handleEditTask } = useOutletContext<LayoutContext>()
  const { activeSidebarFilter, activeTagId } = useFilters()

  const projectIdParam = parseProjectIdFromFilter(activeSidebarFilter)

  const {
    data: tasks = [],
    isLoading: loadingTasks,
    refetch: refreshTasks,
  } = useTasks(undefined, projectIdParam, activeTagId || undefined)

  const {
    data: stats = undefined,
    isLoading: loadingStats,
    refetch: refreshStats,
  } = useStats()

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }

  return {
    tasks,
    loadingTasks,
    stats,
    loadingStats,
    handleRefresh,
    handleEditTask,
  }
}

export type DashboardViewModel = ReturnType<typeof useDashboardViewModel>
