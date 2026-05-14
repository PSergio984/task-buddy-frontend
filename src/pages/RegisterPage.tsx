import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { RegisterForm } from "@/components/auth/RegisterForm"

export function RegisterPage() {
  return (
    <div className="flex min-h-svh bg-background overflow-hidden">
      <div className="fixed top-8 right-8 z-50">
        <Link to="/">
          <Button variant="ghost" className="gap-2 font-bold hover:bg-secondary/50 rounded-xl">
            <ArrowRight className="h-4 w-4 rotate-180" /> Back to Home
          </Button>
        </Link>
      </div>
      {/* Left Column: Authentication Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 lg:px-20 relative">
        <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-10 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
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
              Create Account
            </h1>
            <p className="text-xl text-foreground font-bold">
              Join thousands of achievers. Manifest your goals today.
            </p>
          </div>

          <RegisterForm />

          <div className="mt-12 pt-8 border-t text-center lg:text-left">
            <p className="text-foreground/80 font-medium">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-foreground hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Immersive Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-muted overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src="/assets/register-bg.png"
          alt="Premium Lifestyle"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/95 via-background/60 to-transparent" />
        
        <div className="absolute inset-0 flex items-center justify-center p-12 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-right space-y-8 bg-background/30 backdrop-blur-2xl p-12 rounded-[2.5rem] border border-white/20 shadow-2xl max-w-xl"
          >
            <div className="flex items-center gap-3 justify-end">
              <span className="text-3xl font-bold tracking-tighter text-foreground">Task Buddy</span>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-6xl font-black tracking-tighter text-foreground leading-[0.9]">
              DESIGN YOUR <br />
              <span className="text-accent underline decoration-accent/20 underline-offset-8 uppercase">OWN SUCCESS.</span>
            </h2>
            <p className="text-xl text-foreground max-w-sm ml-auto font-bold leading-relaxed">
              Unlock the full potential of your time with our state-of-the-art task management system.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
