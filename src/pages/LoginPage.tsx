import { type FormEvent, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, LogIn, Mail } from "lucide-react"
import {
  sanitizeEmail,
  sanitizePassword,
  validateEmail,
  validatePassword,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const { login, loading, error } = useAuth()
  const { toast } = useToast()
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
      await login({
        username: sanitizeEmail(email),
        password: sanitizePassword(password),
      })
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your dashboard.",
      })
      navigate("/dashboard")
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message || "Invalid credentials. Please try again."
      toast({
        title: "Authentication failed",
        description: detail,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-10">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-xl"
      >
        <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl sm:p-12 rounded-[2.5rem]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-10 text-center"
          >
            <Link to="/" className="mb-8 inline-flex items-center gap-3 group">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <span className="font-heading text-4xl font-bold tracking-tight">Task Buddy</span>
            </Link>
            
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage your tasks and stay productive.
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-accent" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg focus-visible:ring-accent/30"
                />
              </div>
              {showEmailError && emailError && (
                <p className="mt-1.5 text-xs text-destructive ml-1">{emailError}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="Password must be at least 8 characters" className="text-sm font-semibold">
                  Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-accent hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-accent" />
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

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              New to Task Buddy?{" "}
              <Link
                to="/register"
                className="font-bold text-foreground hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
