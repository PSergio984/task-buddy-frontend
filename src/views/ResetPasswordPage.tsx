import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { CheckCircle2, Lock, Loader2, Save, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter"
import { useResetPasswordViewModel } from "@/viewmodels/useResetPasswordViewModel"

export function ResetPasswordPage() {
  const vm = useResetPasswordViewModel()

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 opacity-10 blur-3xl">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="group mb-8 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="font-heading text-3xl font-bold">Task Buddy</span>
          </Link>

          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight">
              Set new password
            </h1>
            <p className="text-muted-foreground">
              Please enter your new password below.
            </p>
          </div>

          <form
            onSubmit={vm.handleSubmit}
            className="w-full space-y-6 rounded-[2rem] border bg-background p-8 shadow-xl shadow-primary/5"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-sm leading-none font-medium"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={vm.showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={vm.newPassword}
                    onChange={(e) => vm.setNewPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl pr-10 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => vm.setShowPassword(!vm.showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {vm.showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <PasswordStrengthMeter password={vm.newPassword} />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm leading-none font-medium"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={vm.showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={vm.confirmPassword}
                    onChange={(e) => vm.setConfirmPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl pl-10"
                  />
                </div>
              </div>
            </div>

            {vm.error && (
              <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-center text-xs font-bold text-destructive">
                {vm.error}
              </p>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={
                vm.isLoading || vm.isPasswordWeak || vm.hasPasswordMismatch
              }
            >
              {vm.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : vm.isPasswordWeak ? (
                "Password too weak"
              ) : vm.hasPasswordMismatch ? (
                "Passwords mismatch"
              ) : (
                <span className="flex items-center gap-2">
                  Reset Password <Save className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
