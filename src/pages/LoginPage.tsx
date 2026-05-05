import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, KeyRound, Lock, LogIn, Mail } from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const isFormValid = !emailError && !passwordError

  const showEmailError = submitAttempted || email.length > 0
  const showPasswordError = submitAttempted || password.length > 0
  const submitLabel = isFormValid
    ? "Sign in to task-buddy"
    : "Complete the required fields"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) {
      return
    }

    try {
      // OAuth2 password flow uses "username" field name but accepts the email value
      await login({
        username: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      navigate("/dashboard")
    } catch {
      // Error is displayed from context
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#F1F5F9] px-4 py-10 text-[#0F172A]">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-xl"
      >
        <Card className="overflow-hidden border border-[#EDE9E6] bg-[#FFFFFF] p-8 shadow-md sm:p-10">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="mb-8"
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  data-testid="task-buddy-icon"
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#EDE9E6] bg-[#FFFFFF] text-[#0F172A] shadow-sm"
                >
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.3em] text-[#0F172A] uppercase">
                    task-buddy
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0F172A]">
                    Sign in to your account
                  </h1>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-[#EDE9E6] bg-[#FFFFFF] px-3 py-1 text-xs text-[#0F172A] sm:flex">
                <Mail className="h-3.5 w-3.5" />
                Secure access
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#0F172A]/80">
              Sign in with your email address to resume your dashboard and keep
              your tasks in sync.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Label
                htmlFor="email"
                className="text-sm font-medium text-[#0F172A]"
              >
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#0F172A]/60" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={Boolean(showEmailError && emailError)}
                  aria-describedby={
                    emailError && showEmailError
                      ? "login-email-error"
                      : "login-email-help"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  required
                  className="h-12 border-[#EDE9E6] bg-[#FFFFFF] pl-10 text-[#0F172A] placeholder:text-[#0F172A]/45 focus-visible:ring-[#C2A388]/40"
                />
              </div>
              <p
                id="login-email-help"
                className="mt-2 text-xs text-[#0F172A]/70"
              >
                Use the email address tied to your task-buddy account.
              </p>
              {showEmailError && emailError && (
                <p
                  id="login-email-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {emailError}
                </p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, delay: 0.04 }}
            >
              <Label
                htmlFor="password"
                className="text-sm font-medium text-[#0F172A]"
              >
                Password
              </Label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#0F172A]/60" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  aria-invalid={Boolean(showPasswordError && passwordError)}
                  aria-describedby={
                    passwordError && showPasswordError
                      ? "login-password-error"
                      : "login-password-help"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) =>
                    setPassword(sanitizePassword(e.target.value))
                  }
                  required
                  className="h-12 border-[#EDE9E6] bg-[#FFFFFF] pl-10 pr-12 text-[#0F172A] placeholder:text-[#0F172A]/45 focus-visible:ring-[#C2A388]/40"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-[#0F172A]/50 transition-colors hover:text-[#0F172A]"
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p
                id="login-password-help"
                className="mt-2 text-xs text-[#0F172A]/70"
              >
                Passwords are sent securely and never displayed in the UI.
              </p>
              {showPasswordError && passwordError && (
                <p
                  id="login-password-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {passwordError}
                </p>
              )}
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, delay: 0.08 }}
            >
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                aria-label={submitLabel}
                className="h-12 w-full gap-2 border border-[#0F172A] bg-[#0F172A] text-[#F1F5F9] shadow-sm transition-colors duration-150 hover:bg-[#0F172A]/90 disabled:cursor-not-allowed disabled:border-[#94A3B8] disabled:bg-[#94A3B8] disabled:text-white"
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.12 }}
            className="mt-8 rounded-2xl border border-[#EDE9E6] bg-[#FFFFFF] px-4 py-4 text-sm text-[#0F172A]/80"
          >
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="inline-flex items-center gap-1 font-semibold text-[#0F172A] transition-colors hover:text-[#C2A388]"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
