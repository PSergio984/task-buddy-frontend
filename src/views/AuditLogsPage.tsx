import { motion } from "framer-motion"
import { AuditTrail } from "@/components/audit-trail"
import { useNavigate } from "react-router-dom"
import { History, ArrowLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AuditLogsPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 md:px-8">
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl space-y-8"
      >
        {/* ── Page Header ── */}
        <header className="space-y-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Back to dashboard"
              onClick={() => navigate("/dashboard")}
              className="shrink-0 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  type: "spring",
                  stiffness: 220,
                  damping: 16,
                }}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-primary shadow-lg ring-1 shadow-primary/10 ring-primary/20"
              >
                <History className="h-5 w-5" />
              </motion.div>

              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text font-heading text-4xl font-black tracking-tight text-transparent"
                >
                  Activity History
                </motion.h1>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500 ring-1 ring-emerald-500/20"
            >
              <Zap className="h-3 w-3" />
              Live
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="ml-[3.75rem] text-sm text-muted-foreground"
          >
            Monitor and review all recent events across your workspace.
          </motion.p>
        </header>

        {/* ── Audit Trail Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-background/60 shadow-2xl shadow-primary/5 backdrop-blur-xl"
        >
          {/* Subtle gradient border top accent */}
          <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

          <div className="p-6 md:p-8" style={{ minHeight: 680 }}>
            <AuditTrail hideCard showFilters limit={50} />
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
