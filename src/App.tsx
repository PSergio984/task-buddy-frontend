import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { ProtectedRoute, PublicRoute, LoadingScreen } from "@/contexts/ProtectedRoute"
import { FilterProvider } from "@/contexts/FilterContext"
import { SettingsProvider } from "@/contexts/SettingsContext"
import { useAuth } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { NotificationWatcher } from "@/components/notification-watcher"

// Lazy-loaded pages
const LoginPage = lazy(() => import("@/pages/LoginPage").then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/RegisterPage").then(m => ({ default: m.RegisterPage })))
const LandingPage = lazy(() => import("@/pages/LandingPage").then(m => ({ default: m.LandingPage })))
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })))
const ProfilePage = lazy(() => import("@/pages/ProfilePage").then(m => ({ default: m.ProfilePage })))
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage").then(m => ({ default: m.AuditLogsPage })))
const TasksPage = lazy(() => import("@/pages/TasksPage").then(m => ({ default: m.TasksPage })))
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })))
const VerifyEmailPage = lazy(() => import("@/pages/verify-email").then(m => ({ default: m.VerifyEmailPage })))
const MainLayout = lazy(() => import("@/components/layout/main-layout").then(m => ({ default: m.MainLayout })))
const DashboardDemo = lazy(() => import("@/pages/DashboardDemo").then(m => ({ default: m.DashboardDemo })))

function RootElement() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <LandingPage />
  if (user.email_confirmed === false) return <Navigate to="/verify-email" replace />
  
  return <Navigate to="/dashboard" replace />
}

export function App() {
  return (
    <TooltipProvider delayDuration={0}>
      <SettingsProvider>
        <FilterProvider>
          <Router>
            <NotificationWatcher />
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* Landing Page */}
                <Route path="/" element={<RootElement />} />

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
            </Suspense>
            <Toaster />
          </Router>
        </FilterProvider>
      </SettingsProvider>
    </TooltipProvider>
  )
}

export default App
