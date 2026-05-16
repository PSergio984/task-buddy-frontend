import React, { useState } from "react"
import { motion } from "framer-motion"
import { Link, useParams, useNavigate } from "react-router-dom"
import { CheckCircle2, Lock, Loader2, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { getAuthErrorMessage, getPasswordStrength } from "@/lib/auth"
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter"

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const passwordStrength = getPasswordStrength(newPassword)
  const isPasswordStrong = passwordStrength.score >= 4
  const passwordsMatch = newPassword === confirmPassword && newPassword !== ""

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
      await api.post("/api/v1/users/reset-password", {
        token,
        new_password: newPassword,
      })

      toast({
        title: "Password reset successful",
        description: "You can now log in with your new password.",
        variant: "success",
      })
      
      navigate("/login")
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: getAuthErrorMessage(error, "Something went wrong. Please try again."),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
       {/* Background Decorative Elements */}
       <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-10">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="font-heading text-3xl font-bold">Task Buddy</span>
          </Link>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Set new password</h1>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6 bg-background p-8 rounded-[2rem] border shadow-xl shadow-primary/5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium leading-none">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-12 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading || !isPasswordStrong || !passwordsMatch}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : !isPasswordStrong ? (
                "Password too weak"
              ) : !passwordsMatch ? (
                "Passwords mismatch"
              ) : (
                <span className="flex items-center gap-2">Reset Password <Save className="h-4 w-4" /></span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
