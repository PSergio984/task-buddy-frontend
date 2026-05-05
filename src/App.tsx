import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { Dashboard } from "@/components/dashboard"
import { NewTaskModal } from "@/components/new-task-modal"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { AuditLogsPage } from "@/pages/AuditLogsPage"
import { ProtectedRoute, PublicRoute } from "@/contexts/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { useCreateTask, useTasks, useStats } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"
import { Toaster } from "@/components/ui/toaster"

function DashboardLayout() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { createTask, loading: isCreating } = useCreateTask()
  const { tasks, refreshTasks } = useTasks(activeFilter)
  const { stats, loading: loadingStats, refreshStats } = useStats()

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      await createTask(taskData)
      setIsModalOpen(false)
      handleRefresh()
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
        {/* Sidebar — receives tasks for system overview */}
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          tasks={tasks}
        />

        {/* Dashboard — main content area */}
        <Dashboard 
          tasks={tasks} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          onRefresh={handleRefresh}
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

export function App() {
  const { token } = useAuth()

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            token ? (
              <DashboardLayout />
            ) : (
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            )
          }
        />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
