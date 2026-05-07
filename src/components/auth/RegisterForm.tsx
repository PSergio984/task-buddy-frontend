import { type FormEvent, useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from "axios"
import {
  ArrowRight,
  BadgeCheck,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
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
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"

export function RegisterForm() {
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

    if (!isFormValid) return

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
    } catch (err: unknown) {
      let detail = "Something went wrong. Please check your details and try again."
      if (axios.isAxiosError(err)) {
        detail = err.response?.data?.detail || err.message || detail
      } else if (err instanceof Error) {
        detail = err.message
      }
      toast({
        title: "Registration failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Username Field */}
      <FormField
        id="username"
        label="Username"
        icon={<UserPlus className="h-4 w-4" />}
        error={usernameError}
        showError={submitAttempted || username.length > 0}
        helpText="3-32 characters. Letters, numbers, dots, underscores, and hyphens only."
      >
        <Input
          id="username"
          type="text"
          autoComplete="username"
          placeholder="your.username"
          value={username}
          onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
          onBlur={() => setSubmitAttempted(true)}
          required
          className="h-12 pl-10"
        />
      </FormField>

      {/* Email Field */}
      <FormField
        id="email"
        label="Email"
        icon={<Mail className="h-4 w-4" />}
        error={emailError}
        showError={submitAttempted || email.length > 0}
        helpText="We use this for account recovery and notifications."
      >
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
          onBlur={() => setSubmitAttempted(true)}
          required
          className="h-12 pl-10"
        />
      </FormField>

      {/* Password Field */}
      <FormField
        id="password"
        label="Password"
        icon={<KeyRound className="h-4 w-4" />}
        error={passwordError}
        showError={submitAttempted || password.length > 0}
      >
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(sanitizePassword(e.target.value))}
            onBlur={() => setSubmitAttempted(true)}
            required
            className="h-12 pl-10 pr-12"
          />
          <PasswordToggle
            isVisible={showPassword}
            onToggle={() => setShowPassword(!showPassword)}
          />
        </div>
        <PasswordStrengthMeter password={password} />
      </FormField>

      {/* Confirm Password Field */}
      <FormField
        id="confirmPassword"
        label="Confirm Password"
        icon={<BadgeCheck className="h-4 w-4" />}
        error={confirmPasswordError}
        showError={submitAttempted || confirmPassword.length > 0}
        helpText="Re-enter the password exactly as above."
      >
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(sanitizePassword(e.target.value))}
            onBlur={() => setSubmitAttempted(true)}
            required
            className="h-12 pl-10 pr-12"
          />
          <PasswordToggle
            isVisible={showConfirmPassword}
            onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
          />
        </div>
      </FormField>

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
          className="h-12 w-full gap-2"
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
  )
}

function FormField({
  id,
  label,
  icon,
  error,
  showError,
  helpText,
  children,
}: Readonly<{
  id: string
  label: string
  icon: React.ReactNode
  error: string | null
  showError: boolean
  helpText?: string
  children: React.ReactNode
}>) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.16 }}
    >
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      <div className="relative mt-2">
        <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        {children}
      </div>
      {helpText && !error && (
        <p className="mt-2 text-xs text-muted-foreground">{helpText}</p>
      )}
      {showError && error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </motion.div>
  )
}

function PasswordToggle({
  isVisible,
  onToggle,
}: Readonly<{
  isVisible: boolean
  onToggle: () => void
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground"
    >
      {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}
