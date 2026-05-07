import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  User,
  UserPlus,
} from "lucide-react"
import { RegisterForm } from "@/components/auth/RegisterForm"

export function RegisterPage() {
  const navigate = useNavigate()

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
              Join the Community
            </h1>
            <p className="text-muted-foreground">
              Create an account and start organizing your life today.
            </p>
          </motion.div>

          <RegisterForm />

          <div className="mt-10 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-foreground hover:text-accent transition-colors underline decoration-accent/30 underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
