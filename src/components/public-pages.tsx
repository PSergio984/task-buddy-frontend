"use client"

import { useEffect, type ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import { PublicShell } from "@/components/public-shell"
import { LoadingScreen, PublicRoute } from "@/contexts/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { ForgotPasswordPage } from "@/views/ForgotPasswordPage"
import { LandingPage } from "@/views/LandingPage"
import { LoginPage } from "@/views/LoginPage"
import { RegisterPage } from "@/views/RegisterPage"
import { ResetPasswordPage } from "@/views/ResetPasswordPage"
import { VerifyEmailPage } from "@/views/VerifyEmailPage"

function PublicElement({ children }: Readonly<{ children: ReactNode }>) {
  return <PublicRoute>{children}</PublicRoute>
}

const publicRoutes: Record<string, ReactNode> = {
  "/login": (
    <PublicElement>
      <LoginPage />
    </PublicElement>
  ),
  "/register": (
    <PublicElement>
      <RegisterPage />
    </PublicElement>
  ),
  "/forgot-password": (
    <PublicElement>
      <ForgotPasswordPage />
    </PublicElement>
  ),
  "/reset-password/:token": (
    <PublicElement>
      <ResetPasswordPage />
    </PublicElement>
  ),
  "/verify-email": <VerifyEmailPage />,
}

function HardRedirect() {
  useEffect(() => {
    window.location.reload()
  }, [])
  return null
}

function AuthRoute({
  path,
  element,
}: {
  readonly path: string
  readonly element: ReactNode
}) {
  return (
    <PublicShell>
      <BrowserRouter>
        <Routes>
          {Object.entries(publicRoutes).map(([routePath, routeElement]) => (
            <Route
              key={routePath}
              path={routePath}
              element={routePath === path ? element : routeElement}
            />
          ))}
          <Route path="*" element={<HardRedirect />} />
        </Routes>
      </BrowserRouter>
    </PublicShell>
  )
}

function LandingElement() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <LandingPage />
  if (user.email_confirmed === false)
    return <Navigate to="/verify-email" replace />

  return <Navigate to="/dashboard" replace />
}

export function PublicLanding() {
  return (
    <PublicShell>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingElement />} />
          <Route path="*" element={<HardRedirect />} />
        </Routes>
      </BrowserRouter>
    </PublicShell>
  )
}

export const PublicLogin = () => (
  <AuthRoute
    path="/login"
    element={
      <PublicElement>
        <LoginPage />
      </PublicElement>
    }
  />
)

export const PublicRegister = () => (
  <AuthRoute
    path="/register"
    element={
      <PublicElement>
        <RegisterPage />
      </PublicElement>
    }
  />
)

export const PublicForgotPassword = () => (
  <AuthRoute
    path="/forgot-password"
    element={
      <PublicElement>
        <ForgotPasswordPage />
      </PublicElement>
    }
  />
)

export const PublicResetPassword = () => (
  <AuthRoute
    path="/reset-password/:token"
    element={
      <PublicElement>
        <ResetPasswordPage />
      </PublicElement>
    }
  />
)

export const PublicVerifyEmail = () => (
  <AuthRoute path="/verify-email" element={<VerifyEmailPage />} />
)
