import React from "react"
import { motion } from "framer-motion"
import { Mail, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

export function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="absolute top-0 -z-10 left-1/2 -translate-x-1/2 blur-3xl opacity-10 pointer-events-none">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-8 flex justify-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner shadow-primary/5"
          >
            <Mail className="h-12 w-12" />
          </motion.div>
        </div>

        <h1 className="mb-3 text-4xl font-black tracking-tighter uppercase text-foreground">
          Confirm your email
        </h1>
        <p className="mb-10 text-lg font-medium text-muted-foreground leading-relaxed">
          Your account is currently <span className="text-foreground font-bold">unverified</span>. We've sent a confirmation link to your inbox. Please check your email to activate your workspace.
        </p>

        <div className="space-y-4">
          <Button
            asChild
            className="h-14 w-full rounded-2xl text-lg font-bold shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
              Check Inbox <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>

          <Link to="/login">
            <Button variant="ghost" className="h-12 w-full rounded-xl font-bold text-muted-foreground hover:text-foreground">
              Back to Sign In
            </Button>
          </Link>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
            <CheckCircle2 className="h-4 w-4" />
            Verified Security
          </div>
          <p className="text-xs text-muted-foreground/60 max-w-[200px]">
            Didn't receive the email? Check your spam folder or try logging in again.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
