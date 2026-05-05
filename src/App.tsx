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
import { useCreateTask, useTasks, useStats, useUpdateTask } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"
import { Toaster } from "@/components/ui/toaster"

function DashboardLayout() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  const { createTask, loading: isCreating } = useCreateTask()
  const { updateTask, loading: isUpdating } = useUpdateTask()
  const { tasks, refreshTasks } = useTasks(activeFilter)
  const { stats, loading: loadingStats, refreshStats } = useStats()

  const handleRefresh = async () => {
    await Promise.all([refreshTasks(), refreshStats()])
  }

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData)
      } else {
        await createTask(taskData)
      }
      setIsModalOpen(false)
      setEditingTask(null)
      await handleRefresh()
    } catch (error) {
      console.error("Failed to save task:", error)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  const handleOpenChange = (open: boolean) => {
    setIsModalOpen(open)
    if (!open) setEditingTask(null)
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      {/* Top Navigation */}
      <TopNav onNewTask={() => {
        setEditingTask(null)
        setIsModalOpen(true)
      }} />

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar — receives tasks for system overview */}
        <Sidebar 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Dashboard — main content area */}
        <Dashboard 
          tasks={tasks} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          onRefresh={handleRefresh}
          onEdit={handleEditTask}
          stats={stats}
          loadingStats={loadingStats}
        />
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        open={isModalOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleCreateTask}
        isLoading={isCreating || isUpdating}
        task={editingTask}
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
