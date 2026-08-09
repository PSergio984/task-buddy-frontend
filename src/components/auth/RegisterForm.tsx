import React, { useState } from "react"
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
  User,
} from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  getPasswordStrength,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { PasswordStrengthMeter } from "./PasswordStrengthMeter"
import { CharacterCounter } from "../ui/character-counter"

export function RegisterForm() {
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
      let detail =
        "Something went wrong. Please check your details and try again."
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

  const getSubmitButtonContent = () => {
    if (loading) {
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="h-6 w-6 rounded-full border-2 border-primary-foreground border-t-transparent"
        />
      )
    }
    if (!isPasswordStrong && password.length > 0) {
      return "Password too weak"
    }
    return (
      <span className="flex items-center gap-2">
        Create Account <ArrowRight className="h-5 w-5" />
      </span>
    )
  }

  const PasswordEyeIcon = showPassword ? EyeOff : Eye
  const ConfirmPasswordEyeIcon = showConfirmPassword ? EyeOff : Eye

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="username"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Username
          </Label>
          <CharacterCounter current={username.length} limit={50} />
        </div>
        <div className="group relative">
          <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="username"
            type="text"
            placeholder="your_handle"
            value={username}
            onChange={(e) => setUsername(sanitizeUsername(e.target.value))}
            maxLength={50}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
        </div>
        {(submitAttempted || username.length > 0) && usernameError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {usernameError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="email"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Email Address
          </Label>
          <CharacterCounter current={email.length} limit={254} />
        </div>
        <div className="group relative">
          <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
            maxLength={254}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
        </div>
        {(submitAttempted || email.length > 0) && emailError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="ml-1 flex items-center justify-between">
          <Label
            htmlFor="password"
            title="At least 8 characters"
            className="text-sm font-black tracking-widest text-foreground uppercase"
          >
            Password
          </Label>
          <CharacterCounter current={password.length} limit={128} />
        </div>
        <div className="group relative">
          <KeyRound className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(sanitizePassword(e.target.value))}
            maxLength={128}
            required
            className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-foreground/60 transition-colors hover:text-foreground"
          >
            <PasswordEyeIcon className="h-5 w-5" />
          </button>
        </div>
        <PasswordStrengthMeter password={password} />
        {(submitAttempted || password.length > 0) && passwordError && (
          <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
            {passwordError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="confirmPassword"
          title="Passwords must match"
          className="ml-1 text-sm font-black tracking-widest text-foreground uppercase"
        >
          Confirm Password
        </Label>
        <div className="group relative">
          <BadgeCheck className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground transition-colors group-focus-within:text-accent" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(sanitizePassword(e.target.value))
            }
            required
            className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg text-foreground focus-visible:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute top-1/2 right-4 -translate-y-1/2 text-foreground/60 transition-colors hover:text-foreground"
          >
            <ConfirmPasswordEyeIcon className="h-5 w-5" />
          </button>
        </div>
        {(submitAttempted || confirmPassword.length > 0) &&
          confirmPasswordError && (
            <p className="mt-1.5 ml-1 text-xs font-bold text-destructive">
              {confirmPasswordError}
            </p>
          )}
      </div>

      <Button
        type="submit"
        disabled={loading || !isFormValid}
        className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
      >
        {getSubmitButtonContent()}
      </Button>
    </form>
  )
}
