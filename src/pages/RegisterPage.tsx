import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw) => /\d/.test(pw) },
  {
    label: "One special character",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
]

export function RegisterPage() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { register, loading, error } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const usernameError = validateUsername(username)
  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const confirmPasswordError = validatePasswordConfirmation(
    password,
    confirmPassword
  )

  const isFormValid =
    !usernameError && !emailError && !passwordError && !confirmPasswordError

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) {
      return
    }

    try {
      await register({
        username: sanitizeUsername(username),
        email: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Please log in to continue.",
        variant: "success",
      })
      navigate("/login")
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Something went wrong. Please check your details and try again."
      toast({
        title: "Registration failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10 text-foreground">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-xl"
      >
        <Card className="overflow-hidden border border-border bg-card p-8 shadow-md sm:p-10">
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
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background text-foreground shadow-sm"
                >
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold tracking-[0.3em] text-foreground uppercase">
                    task-buddy
                  </p>
                  <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    Create your account
                  </h1>
                </div>
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground sm:flex">
                <Mail className="h-3.5 w-3.5" />
                <Lock className="h-3.5 w-3.5" />
                <User className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Create a task-buddy account with a username, email address, and
              secure password.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16 }}
            >
              <Label
                htmlFor="username"
                className="text-sm font-medium text-foreground"
              >
                Username
              </Label>
              <div className="relative mt-2">
                <UserPlus className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  inputMode="text"
                  placeholder="your.username"
                  value={username}
                  aria-invalid={Boolean(
                    (submitAttempted || username.length > 0) && usernameError
                  )}
                  aria-describedby={
                    (submitAttempted || username.length > 0) && usernameError
                      ? "register-username-error"
                      : "register-username-help"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) =>
                    setUsername(sanitizeUsername(e.target.value))
                  }
                  required
                  className="h-12 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-ring/40"
                />
              </div>
              <p
                id="register-username-help"
                className="mt-2 text-xs text-muted-foreground"
              >
                3-32 characters. Letters, numbers, dots, underscores, and
                hyphens only.
              </p>
              {(submitAttempted || username.length > 0) && usernameError && (
                <p
                  id="register-username-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {usernameError}
                </p>
              )}
            </motion.div>

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, delay: 0.03 }}
            >
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={Boolean(
                    (submitAttempted || email.length > 0) && emailError
                  )}
                  aria-describedby={
                    (submitAttempted || email.length > 0) && emailError
                      ? "register-email-error"
                      : "register-email-help"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  required
                  className="h-12 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-ring/40"
                />
              </div>
              <p
                id="register-email-help"
                className="mt-2 text-xs text-muted-foreground"
              >
                We use this for account recovery and notifications.
              </p>
              {(submitAttempted || email.length > 0) && emailError && (
                <p
                  id="register-email-error"
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
              transition={{ duration: 0.16, delay: 0.06 }}
            >
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <div className="relative mt-2">
                <KeyRound className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  aria-invalid={Boolean(
                    (submitAttempted || password.length > 0) && passwordError
                  )}
                  aria-describedby={
                    (submitAttempted || password.length > 0) && passwordError
                      ? "register-password-error register-password-rules"
                      : "register-password-rules"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) =>
                    setPassword(sanitizePassword(e.target.value))
                  }
                  required
                  className="h-12 border-border bg-background pl-10 pr-12 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-ring/40"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              <div
                id="register-password-rules"
                className="mt-3 space-y-1.5"
                role="list"
                aria-label="Password requirements"
              >
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(password)
                  return (
                    <div
                      key={rule.label}
                      role="listitem"
                      className="flex items-center gap-2"
                    >
                      {met ? (
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 flex-shrink-0 text-muted-foreground/30" />
                      )}
                      <span
                        className={`text-xs transition-colors duration-150 ${
                          met ? "text-green-600" : "text-muted-foreground"
                        }`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {(submitAttempted || password.length > 0) && passwordError && (
                <p
                  id="register-password-error"
                  role="alert"
                  className="mt-2 text-xs text-red-600"
                >
                  {passwordError}
                </p>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.16, delay: 0.09 }}
            >
              <Label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-foreground"
              >
                Confirm Password
              </Label>
              <div className="relative mt-2">
                <BadgeCheck className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  aria-invalid={Boolean(
                    (submitAttempted || confirmPassword.length > 0) &&
                      confirmPasswordError
                  )}
                  aria-describedby={
                    (submitAttempted || confirmPassword.length > 0) &&
                    confirmPasswordError
                      ? "register-confirm-password-error"
                      : "register-confirm-password-help"
                  }
                  onBlur={() => setSubmitAttempted(true)}
                  onChange={(e) =>
                    setConfirmPassword(sanitizePassword(e.target.value))
                  }
                  required
                  className="h-12 border-border bg-background pl-10 pr-12 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-ring/40"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
                  tabIndex={0}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p
                id="register-confirm-password-help"
                className="mt-2 text-xs text-muted-foreground"
              >
                Re-enter the password exactly as above.
              </p>
              {(submitAttempted || confirmPassword.length > 0) &&
                confirmPasswordError && (
                  <p
                    id="register-confirm-password-error"
                    role="alert"
                    className="mt-2 text-xs text-red-600"
                  >
                    {confirmPasswordError}
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
              transition={{ duration: 0.16, delay: 0.12 }}
            >
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                aria-label={
                  isFormValid
                    ? "Create your account"
                    : "Complete the required fields"
                }
                className="h-12 w-full gap-2 border border-primary bg-primary text-primary-foreground shadow-sm transition-colors duration-150 hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:border-border"
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: 0.16 }}
            className="mt-8 rounded-2xl border border-border bg-background px-4 py-4 text-sm text-muted-foreground"
          >
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-1 font-semibold text-foreground transition-colors hover:text-accent"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  )
}
