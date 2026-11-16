import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  sanitizeEmail,
  sanitizePassword,
  validateEmail,
  validatePassword,
  getAuthErrorMessage,
} from "@/models/auth.model"

export function useLoginViewModel() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { login, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const isFormValid = !emailError && !passwordError

  const showEmailError = submitAttempted || email.length > 0
  const showPasswordError = submitAttempted || password.length > 0

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) {
      return
    }

    try {
      await login({
        username: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your dashboard.",
        variant: "success",
      })
      navigate("/dashboard")
    } catch (err: unknown) {
      const detail = getAuthErrorMessage(
        err,
        "Invalid credentials. Please try again."
      )

      if (detail === "EMAIL_NOT_CONFIRMED") {
        navigate("/verify-email")
        return
      }

      toast({
        title: "Authentication failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    submitAttempted,
    loading,
    emailError,
    passwordError,
    isFormValid,
    showEmailError,
    showPasswordError,
    handleSubmit,
  }
}

export type LoginViewModel = ReturnType<typeof useLoginViewModel>
