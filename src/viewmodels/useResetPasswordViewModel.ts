import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import {
  authApi,
  getAuthErrorMessage,
  getPasswordStrength,
} from "@/models/auth.model"

export function useResetPasswordViewModel() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = getPasswordStrength(newPassword)
  const isPasswordStrong = passwordStrength.score >= 4
  const isPasswordWeak = !isPasswordStrong
  const passwordsMatch = newPassword === confirmPassword && newPassword !== ""
  const hasPasswordMismatch = !passwordsMatch

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords mismatch",
        description: "The new password and confirmation password do not match.",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
      })
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword(token || "", newPassword)
      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
        variant: "success",
      })
      navigate("/login")
    } catch (error: unknown) {
      const detail = getAuthErrorMessage(
        error,
        "Failed to reset password. The link may have expired or is invalid."
      )
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
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    showPassword,
    setShowPassword,
    passwordStrength,
    isPasswordStrong,
    isPasswordWeak,
    passwordsMatch,
    hasPasswordMismatch,
    handleSubmit,
  }
}

export type ResetPasswordViewModel = ReturnType<
  typeof useResetPasswordViewModel
>
