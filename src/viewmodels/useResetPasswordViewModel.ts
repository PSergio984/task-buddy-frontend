import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import {
  authApi,
  getAuthErrorMessage,
  getPasswordStrength,
  sanitizePassword,
} from "@/models/auth.model"

export function useResetPasswordViewModel() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordStrength = getPasswordStrength(newPassword)
  const isPasswordStrong = passwordStrength.score >= 4
  const isPasswordWeak = !isPasswordStrong
  const passwordsMatch = newPassword === confirmPassword && newPassword !== ""
  const hasPasswordMismatch = !passwordsMatch

  const handleSetNewPassword = (val: string) => {
    setError(null)
    setNewPassword(val)
  }

  const handleSetConfirmPassword = (val: string) => {
    setError(null)
    setConfirmPassword(val)
  }

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const cleanPassword = sanitizePassword(newPassword)
    const cleanConfirm = sanitizePassword(confirmPassword)

    if (cleanPassword !== cleanConfirm) {
      const msg = "The new password and confirmation password do not match."
      setError(msg)
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: msg,
      })
      return
    }

    if (cleanPassword.length < 8) {
      const msg = "Password must be at least 8 characters long."
      setError(msg)
      toast({
        variant: "destructive",
        title: "Password too short",
        description: msg,
      })
      return
    }

    if (isPasswordWeak) {
      const msg = "Choose a password that meets all strength rules."
      setError(msg)
      toast({
        variant: "destructive",
        title: "Password too weak",
        description: msg,
      })
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword(token || "", cleanPassword)
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
        variant: "success",
      })
      navigate("/login")
    } catch (err: unknown) {
      const detail = getAuthErrorMessage(
        err,
        "Failed to reset password. The link may have expired or is invalid."
      )
      setError(detail)
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: detail,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    token,
    newPassword,
    setNewPassword: handleSetNewPassword,
    confirmPassword,
    setConfirmPassword: handleSetConfirmPassword,
    isLoading,
    showPassword,
    setShowPassword,
    passwordStrength,
    isPasswordStrong,
    isPasswordWeak,
    passwordsMatch,
    hasPasswordMismatch,
    error,
    handleSubmit,
  }
}

export type ResetPasswordViewModel = ReturnType<
  typeof useResetPasswordViewModel
>
