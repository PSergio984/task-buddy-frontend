import { useState } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Sidebar } from "@/components/sidebar"
import { TopNav } from "@/components/topnav"
import { Dashboard } from "@/components/dashboard"
import { NewTaskModal } from "@/components/new-task-modal"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ProtectedRoute, PublicRoute } from "@/contexts/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { useCreateTask, useTasks } from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"

function DashboardLayout() {
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { createTask, loading: isCreating } = useCreateTask()
  // Fetch tasks here so both Sidebar (system overview) and Dashboard share data
  const { tasks } = useTasks()

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
    <div className="flex min-h-svh flex-col bg-[#F1F5F9]">
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
        <Dashboard />
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
    </Router>
  )
}

export default App
