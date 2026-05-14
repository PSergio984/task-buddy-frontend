import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, KeyRound, CheckCircle2, LogIn, Mail, ArrowRight } from "lucide-react"
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
      const detail = getAuthErrorMessage(err, "Invalid credentials. Please try again.")
      
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
    <div className="flex min-h-svh bg-background overflow-hidden">
      {/* Left Column: Immersive Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-muted overflow-hidden order-1">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/assets/login-bg.png"
          alt="Premium Workspace"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/90 via-background/20 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-8 bg-background/30 backdrop-blur-2xl p-12 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-xl"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <span className="text-3xl font-bold tracking-tighter text-foreground">Task Buddy</span>
            </div>
            <h2 className="text-6xl font-black tracking-tighter text-foreground leading-[0.9] uppercase">
              ELEVATE YOUR <br />
              <span className="text-accent underline decoration-accent/20 underline-offset-8">DAILY FLOW.</span>
            </h2>
            <p className="text-xl text-foreground max-w-sm font-black leading-relaxed">
              The intelligent assistant designed for high-performance teams and focused individuals.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-20 relative order-2">
        <div className="fixed top-8 right-8 z-50">
          <Link to="/">
            <Button variant="ghost" className="gap-2 font-bold hover:bg-secondary/50 rounded-xl">
              <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
            </Button>
          </Link>
        </div>
        <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-10 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <div className="mb-10 lg:hidden text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-primary" />
              <span className="font-heading text-3xl font-bold tracking-tight">Task Buddy</span>
            </Link>
          </div>

          <div className="mb-10 text-left">
            <h1 className="text-5xl font-black tracking-tighter text-foreground mb-3 uppercase">
              Welcome Back
            </h1>
            <p className="text-xl text-foreground font-black">
              Join thousands of achievers. Manifest your goals today.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-black uppercase tracking-widest text-foreground ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/70 transition-colors group-focus-within:text-accent" />
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
                <p className="mt-1.5 text-xs text-destructive ml-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="Password must be at least 8 characters" className="text-sm font-black uppercase tracking-widest text-foreground">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-black text-accent hover:underline underline-offset-4 transition-colors uppercase tracking-tighter"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/90 transition-colors group-focus-within:text-accent" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pl-12 pr-12 text-lg focus-visible:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {showPasswordError && passwordError && (
                <p className="mt-1.5 text-xs text-destructive ml-1">{passwordError}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-6 w-6 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <span className="flex items-center gap-2">Sign In <LogIn className="h-5 w-5" /></span>
              )}
            </Button>
          </form>

          <div className="mt-12 pt-8 border-t text-center lg:text-left">
            <p className="text-foreground font-medium">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-foreground hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4"
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
