import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { queryClient } from "@/lib/query-client"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { LandingPage } from "@/pages/LandingPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { AuditLogsPage } from "@/pages/AuditLogsPage"
import { TasksPage } from "@/pages/TasksPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"
import { VerifyEmailPage } from "@/pages/verify-email"
import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute, PublicRoute, LoadingScreen } from "@/contexts/ProtectedRoute"
import { FilterProvider } from "@/contexts/FilterContext"
import { SettingsProvider } from "@/contexts/SettingsContext"
import { useAuth } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DashboardDemo } from "@/pages/DashboardDemo"
import { NotificationWatcher } from "@/components/notification-watcher"

export function App() {
  const { user, loading } = useAuth()

  return (
    <TooltipProvider delayDuration={0}>
      <SettingsProvider>
        <FilterProvider>
          <Router>
            <NotificationWatcher />
            <Routes>
                {/* Landing Page */}
                <Route
                  path="/"
                  element={
                    loading ? (
                      <LoadingScreen />
                    ) : user ? (
                      user.email_confirmed === false ? (
                        <Navigate to="/verify-email" replace />
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    ) : (
                      <LandingPage />
                    )
                  }
                />

                {/* Public Auth Routes */}
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
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/reset-password/:token"
                  element={
                    <PublicRoute>
                      <ResetPasswordPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verify-email"
                  element={
                    <PublicRoute>
                      <VerifyEmailPage />
                    </PublicRoute>
                  }
                />
                {/* Protected Routes with Persistent Layout */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardDemo />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              <Toaster />
            </Router>
          </FilterProvider>
        </SettingsProvider>
      </TooltipProvider>
    </>
  )
}

export default App


