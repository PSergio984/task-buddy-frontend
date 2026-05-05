import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: ReactNode
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F1F5F9]">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#EDE9E6] border-t-[#0F172A]"></div>
        <p className="text-sm text-[#0F172A]/60">Loading...</p>
      </div>
    </div>
  )
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!token) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (token) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}
