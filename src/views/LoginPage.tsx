import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  LogIn,
  Mail,
  ArrowRight,
} from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  validateEmail,
  validatePassword,
  getAuthErrorMessage,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { login, loading } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const emailError = validateEmail(email)
  const passwordError = validatePassword(password)
  const isFormValid = !emailError && !passwordError

  const showEmailError = submitAttempted || email.length > 0
  const showPasswordError = submitAttempted || password.length > 0

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitAttempted(true)

    if (!isFormValid) {
      return
    }

    try {
      await login({
        username: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your dashboard.",
        variant: "success",
      })
      navigate("/dashboard")
    } catch (err: unknown) {
      const detail = getAuthErrorMessage(
        err,
        "Invalid credentials. Please try again."
      )

      if (detail === "EMAIL_NOT_CONFIRMED") {
        navigate("/verify-email")
        return
      }

      toast({
        title: "Authentication failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-svh overflow-hidden bg-background">
      {/* Left Column: Immersive Visuals */}
      <div className="relative order-1 hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/assets/login-bg.png"
          alt="Premium Workspace"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/20 to-transparent" />

        <div className="absolute inset-0 z-10 flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-xl space-y-8 rounded-[2.5rem] border border-white/20 bg-background/30 p-12 shadow-2xl backdrop-blur-2xl"
          >
            <Link
              to="/"
              className="flex w-fit items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <span className="text-3xl font-bold tracking-tighter text-foreground">
                Task Buddy
              </span>
            </Link>
            <h2 className="text-6xl leading-[0.9] font-black tracking-tighter text-foreground uppercase">
              ELEVATE YOUR <br />
              <span className="text-accent underline decoration-accent/20 underline-offset-8">
                DAILY FLOW.
              </span>
            </h2>
            <p className="max-w-sm text-xl leading-relaxed font-black text-foreground">
              The intelligent assistant designed for high-performance teams and
              focused individuals.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="relative order-2 flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-20">
        <div className="fixed top-8 right-8 z-50">
          <Link to="/">
            <Button
              variant="ghost"
              className="gap-2 rounded-xl font-bold hover:bg-secondary/50"
            >
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 -translate-x-1/2 opacity-10 blur-3xl">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <div className="mb-10 text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <span className="font-heading text-3xl font-bold tracking-tight">
                Task Buddy
              </span>
            </Link>
          </div>

          <div className="mb-10 text-left">
            <h1 className="mb-3 text-5xl font-black tracking-tighter text-foreground uppercase">
              Welcome Back
            </h1>
            <p className="text-xl font-black text-foreground">
              Join thousands of achievers. Manifest your goals today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="ml-1 text-sm font-black tracking-widest text-foreground uppercase"
              >
                Email Address
              </Label>
              <div className="group relative">
                <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground/70 transition-colors group-focus-within:text-accent" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg font-medium focus-visible:ring-accent/30"
                />
              </div>
              {showEmailError && emailError && (
                <p className="mt-1.5 ml-1 text-xs text-destructive">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="ml-1 flex items-center justify-between">
                <Label
                  htmlFor="password"
                  title="Password must be at least 8 characters"
                  className="text-sm font-black tracking-widest text-foreground uppercase"
                >
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-black tracking-tighter text-accent uppercase underline-offset-4 transition-colors hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="group relative">
                <KeyRound className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-foreground/90 transition-colors group-focus-within:text-accent" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) =>
                    setPassword(sanitizePassword(e.target.value))
                  }
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg focus-visible:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {showPasswordError && passwordError && (
                <p className="mt-1.5 ml-1 text-xs text-destructive">
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="h-6 w-6 rounded-full border-2 border-primary-foreground border-t-transparent"
                />
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <LogIn className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-12 border-t pt-8 text-center lg:text-left">
            <p className="font-medium text-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-foreground underline decoration-accent/30 underline-offset-4 transition-colors hover:text-accent"
              >
                Start for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
