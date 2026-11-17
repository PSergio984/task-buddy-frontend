import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { CheckCircle2, ArrowLeft, Mail, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForgotPasswordViewModel } from "@/viewmodels/useForgotPasswordViewModel"

export function ForgotPasswordPage() {
  const vm = useForgotPasswordViewModel()

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-8">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -z-10 -translate-x-1/2 opacity-10 blur-3xl">
        <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-accent to-purple-400" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="group mb-8 flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <span className="font-heading text-3xl font-bold">Task Buddy</span>
          </Link>

          <AnimatePresence mode="wait">
            {vm.isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[2rem] border bg-background p-10 text-center shadow-xl shadow-primary/5"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <Send className="h-8 w-8" />
                </div>
                <h2 className="mb-4 text-2xl font-bold">Check your email</h2>
                <p className="mb-8 text-muted-foreground">
                  We've sent a password reset link to <br />
                  <span className="font-semibold text-primary">{vm.email}</span>
                </p>
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="h-12 w-full rounded-xl">
                    Back to login
                  </Button>
                </Link>
                <p className="mt-6 text-sm text-muted-foreground">
                  Didn't receive the email?{" "}
                  <button
                    onClick={vm.reset}
                    className="font-medium text-accent hover:underline"
                  >
                    Click to try again
                  </button>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full"
              >
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold tracking-tight">
                    Forgot password?
                  </h1>
                  <p className="text-muted-foreground">
                    No worries, we'll send you reset instructions.
                  </p>
                </div>

                <form
                  onSubmit={vm.handleSubmit}
                  className="space-y-6 rounded-[2rem] border bg-background p-8 shadow-xl shadow-primary/5"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={vm.email}
                        onChange={(e) => vm.setEmail(e.target.value)}
                        required
                        className="h-12 rounded-xl pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    disabled={vm.isButtonDisabled}
                  >
                    {vm.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Reset password <Send className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {!vm.isSubmitted && (
            <Link
              to="/login"
              className="mt-8 flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  )
}
