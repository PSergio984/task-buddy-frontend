import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="bg-brand-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-brand-sidebar mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: ProtectedRouteProps) {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div className="bg-brand-bg flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-t-brand-sidebar mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (token) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}
