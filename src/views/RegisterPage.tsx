import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterForm } from "@/components/auth/RegisterForm"

export function RegisterPage() {
  return (
    <div className="flex min-h-svh overflow-hidden bg-background">
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
      {/* Left Column: Authentication Form */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-20">
        <div className="pointer-events-none absolute top-0 left-1/2 -z-10 -translate-x-1/2 opacity-10 blur-3xl">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
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
              Create Account
            </h1>
            <p className="text-xl font-bold text-foreground">
              Join thousands of achievers. Manifest your goals today.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-12 border-t pt-8 text-center lg:text-left">
            <p className="font-medium text-foreground/80">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-foreground underline decoration-accent/30 underline-offset-4 transition-colors hover:text-accent"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Immersive Visuals */}
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:w-1/2">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/assets/register-bg.png"
          alt="Premium Lifestyle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/60 to-transparent" />

        <div className="absolute inset-0 z-10 flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="max-w-xl space-y-8 rounded-[2.5rem] border border-white/20 bg-background/30 p-12 text-right shadow-2xl backdrop-blur-2xl"
          >
            <Link
              to="/"
              className="ml-auto flex w-fit items-center justify-end gap-3 transition-opacity hover:opacity-80"
            >
              <span className="text-3xl font-bold tracking-tighter text-foreground">
                Task Buddy
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </Link>
            <h2 className="text-6xl leading-[0.9] font-black tracking-tighter text-foreground">
              DESIGN YOUR <br />
              <span className="text-accent uppercase underline decoration-accent/20 underline-offset-8">
                OWN SUCCESS.
              </span>
            </h2>
            <p className="ml-auto max-w-sm text-xl leading-relaxed font-bold text-foreground">
              Unlock the full potential of your time with our state-of-the-art
              task management system.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
