import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { CheckSquare2, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface ProtectedRouteProps {
  readonly children: ReactNode
}

function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[10%] -right-[10%] h-[60%] w-[60%] rounded-full bg-accent/10 blur-[150px]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-20">
          {/* Central Logo Animation */}
          <div className="relative h-40 w-40">
            {/* Pulsing ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.5],
                opacity: [0.5, 0],
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute inset-0 rounded-3xl border-2 border-primary/30"
            />
            
            <motion.div
              animate={{ 
                rotate: 360,
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0 border-[3px] border-primary/5 border-t-primary rounded-[2.5rem] shadow-[0_0_60px_rgba(var(--primary),0.2)]"
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div 
                animate={{ 
                  y: [0, -8, 0],
                  filter: ["drop-shadow(0 10px 20px rgba(var(--primary),0.3))", "drop-shadow(0 20px 40px rgba(var(--primary),0.5))", "drop-shadow(0 10px 20px rgba(var(--primary),0.3))"]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center ring-8 ring-background/50 backdrop-blur-md shadow-2xl"
              >
                <CheckSquare2 className="h-10 w-10 text-primary-foreground" />
              </motion.div>
            </div>
          </div>
          
          {/* Modern progress arc */}
          <svg className="absolute -inset-8 h-56 w-56 -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-primary/10"
            />
            <motion.circle
              cx="112"
              cy="112"
              r="100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="628"
              initial={{ strokeDashoffset: 628 }}
              animate={{ strokeDashoffset: [628, 0, -628] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-primary"
            />
          </svg>
        </div>
        
        <div className="space-y-8 text-center">
          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.4em] text-accent uppercase">Premium Experience</span>
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
            </motion.div>
            <motion.h2 
              initial={{ letterSpacing: "0.5em", opacity: 0 }}
              animate={{ letterSpacing: "0.1em", opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-6xl font-heading font-black tracking-tighter text-foreground uppercase leading-none"
            >
              TASK<span className="text-primary">BUDDY</span>
            </motion.h2>
            <div className="flex flex-col items-center gap-1">
              <p className="text-[12px] font-bold text-muted-foreground/60 uppercase tracking-[0.8em] translate-x-[0.4em]">
                YOUR PREMIUM WORKSPACE
              </p>
              <div className="h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-8">
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    backgroundColor: ["rgba(var(--primary), 0.3)", "rgba(var(--primary), 1)", "rgba(var(--primary), 0.3)"],
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="h-2 w-2 rounded-full"
                />
              ))}
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="relative px-8 py-4 rounded-2xl bg-muted/30 border border-border/50 backdrop-blur-sm"
            >
              <p className="text-sm font-medium text-muted-foreground italic">
                Syncing your workspace...
              </p>
            </motion.div>
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

  return <>{children}</>
}

export function PublicRoute({ children }: Readonly<ProtectedRouteProps>) {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (user) {
    return <Navigate to="/dashboard" />
  }

  return <>{children}</>
}
