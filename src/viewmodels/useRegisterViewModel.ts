import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  getPasswordStrength,
  getAuthErrorMessage,
} from "@/models/auth.model"

export function useRegisterViewModel() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { register, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const usernameError = validateUsername(username)
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const passwordStrength = getPasswordStrength(password)
  const isPasswordStrong = passwordStrength.score >= 4
  const confirmPasswordError = validatePasswordConfirmation(
    password,
    confirmPassword
  )

  const isFormValid =
    !usernameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    isPasswordStrong

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) return

    try {
      await register({
        username: sanitizeUsername(username),
        email: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      toast({
        title: "Account created!",
        description:
          "Welcome to Task Buddy. Please log in to start your journey.",
        variant: "success",
      })
      navigate("/verify-email")
    } catch (err: unknown) {
      const detail = getAuthErrorMessage(
        err,
        "Could not complete registration. Please try again."
      )

      toast({
        title: "Registration failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return {
    username,
    setUsername,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    submitAttempted,
    loading,
    usernameError,
    emailError,
    passwordError,
    passwordStrength,
    confirmPasswordError,
    isFormValid,
    handleSubmit,
  }
}

export type RegisterViewModel = ReturnType<typeof useRegisterViewModel>
