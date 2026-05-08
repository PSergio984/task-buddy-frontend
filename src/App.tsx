import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { LandingPage } from "@/pages/LandingPage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { AuditLogsPage } from "@/pages/AuditLogsPage"
import { DashboardDemo } from "@/pages/DashboardDemo"
import { MainLayout } from "@/components/layout/main-layout"
import { ProtectedRoute, PublicRoute } from "@/contexts/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

export function App() {
  const { token } = useAuth()

  return (
    <TooltipProvider delayDuration={0}>
      <Router>
        <Routes>
          {/* Landing Page */}
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" replace /> : <LandingPage />
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
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </TooltipProvider>
  )
}

export default App


