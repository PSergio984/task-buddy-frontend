import React, { useState } from "react"
import axios from "axios"
import { useToast } from "@/hooks/use-toast"
import { authApi, validateEmailFormat } from "@/models/auth.model"

export function useForgotPasswordViewModel() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const isEmailValid = validateEmailFormat(email)
  const isButtonDisabled = isLoading || !email || !isEmailValid

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authApi.forgotPassword(email)
      setIsSubmitted(true)
      toast({
        title: "Reset link sent",
        description:
          "Check your email for instructions to reset your password.",
        variant: "success",
      })
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: (() => {
          if (axios.isAxiosError(error)) {
            return (
              (error.response?.data as { detail?: string })?.detail ||
              error.message
            )
          }
          if (error instanceof Error) return error.message
          return "Something went wrong. Please try again."
        })(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return {
    email,
    setEmail,
    isLoading,
    isSubmitted,
    isEmailValid,
    isButtonDisabled,
    handleSubmit,
  }
}

export type ForgotPasswordViewModel = ReturnType<
  typeof useForgotPasswordViewModel
>
