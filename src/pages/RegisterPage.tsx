import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  ArrowRight,
  Lock,
  Mail,
  User,
  UserPlus,
} from "lucide-react"
import { RegisterForm } from "@/components/auth/RegisterForm"

export function RegisterPage() {
  const navigate = useNavigate()

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

          <RegisterForm />

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
