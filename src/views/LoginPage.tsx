import { Link } from "react-router-dom"
import { motion } from "framer-motion"
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
import { sanitizeEmail, sanitizePassword } from "@/models/auth.model"
import { useLoginViewModel } from "@/viewmodels/useLoginViewModel"

export function LoginPage() {
  const vm = useLoginViewModel()

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
              className="inline-block transition-transform hover:scale-105"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 bg-primary/20 px-6 py-2 text-primary shadow-inner backdrop-blur-md">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm font-black tracking-widest uppercase">
                  Task Buddy Workspace
                </span>
              </div>
            </Link>

            <h2 className="font-heading text-5xl font-black tracking-tighter text-foreground uppercase md:text-6xl">
              Elevate your daily rhythm.
            </h2>

            <p className="text-xl leading-relaxed font-bold text-foreground">
              Experience the definitive tool designed for ambitious minds.
              Organize, execute, and conquer your goals with precision.
            </p>

            <div className="flex items-center gap-6 border-t border-white/20 pt-8">
              <div>
                <p className="text-3xl font-black tracking-tight text-foreground">
                  99.9%
                </p>
                <p className="text-xs font-bold tracking-widest text-foreground uppercase">
                  Uptime Reliability
                </p>
              </div>
              <div className="h-10 w-px bg-white/20" />
              <div>
                <p className="text-3xl font-black tracking-tight text-foreground">
                  100k+
                </p>
                <p className="text-xs font-bold tracking-widest text-foreground uppercase">
                  Tasks Completed
                </p>
              </div>
            </div>
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

          <form onSubmit={vm.handleSubmit} className="space-y-6">
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
                  value={vm.email}
                  onChange={(e) => vm.setEmail(sanitizeEmail(e.target.value))}
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pl-12 text-lg font-medium focus-visible:ring-accent/30"
                />
              </div>
              {vm.showEmailError && vm.emailError && (
                <p className="mt-1.5 ml-1 text-xs text-destructive">
                  {vm.emailError}
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
                  type={vm.showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={vm.password}
                  onChange={(e) =>
                    vm.setPassword(sanitizePassword(e.target.value))
                  }
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 pr-12 pl-12 text-lg focus-visible:ring-accent/30"
                />
                <button
                  type="button"
                  onClick={() => vm.setShowPassword(!vm.showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {vm.showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {vm.showPasswordError && vm.passwordError && (
                <p className="mt-1.5 ml-1 text-xs text-destructive">
                  {vm.passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={vm.loading || !vm.isFormValid}
              className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {vm.loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="h-6 w-6 rounded-full border-2 border-primary-foreground border-t-transparent"
                />
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In to Workspace
                </>
              )}
            </Button>
          </form>

          <div className="mt-12 border-t pt-8 text-center lg:text-left">
            <p className="font-medium text-foreground/80">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-foreground underline decoration-accent/30 underline-offset-4 transition-colors hover:text-accent"
              >
                Create an account
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
