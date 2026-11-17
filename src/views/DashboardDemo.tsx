import { Dashboard } from "@/components/dashboard"
import { useDashboardViewModel } from "@/viewmodels/useDashboardViewModel"

export function DashboardDemo() {
  const vm = useDashboardViewModel()

  return (
    <Dashboard
      tasks={vm.tasks}
      loadingTasks={vm.loadingTasks}
      onRefresh={vm.handleRefresh}
      onEdit={vm.handleEditTask}
      stats={vm.stats}
      loadingStats={vm.loadingStats}
    />
  )
}
