import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { CheckSquare2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  readonly children: ReactNode
}

export function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6" style={{ transform: "translateZ(0)" }}>
      {/* Simplified Background - Performance optimized */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-8">
          {/* Simplified Logo Animation */}
          <div className="relative h-16 w-16">
            <motion.div
              animate={{ 
                rotate: 360,
              }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 border-2 border-primary/20 border-t-primary rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckSquare2 className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-heading font-black tracking-tighter text-foreground uppercase">
            TASK<span className="text-primary">BUDDY</span>
          </h2>
          <div className="flex flex-col items-center gap-2">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-muted/30">
              <motion.div
                animate={{ 
                  x: ["-100%", "100%"]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: "easeInOut" 
                }}
                className="h-full w-1/2 bg-primary"
              />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
              Syncing...
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (user.email_confirmed === false) {
    return <Navigate to="/verify-email" />
  }

  return <>{children}</>
}

export function PublicRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user && user.email_confirmed !== false) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}
