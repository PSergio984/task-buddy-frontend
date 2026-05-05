import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { CheckCircle2, Clock, FilePlus2, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

interface AuditEntry {
  id: string
  action: string
  taskName?: string
  timestamp: string
  status: "completed" | "created" | "updated"
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "created":
      return <FilePlus2 className="h-4 w-4 text-[#C2A388]" />
    default:
      return <Clock className="h-4 w-4 text-[#0F172A]/35" />
  }
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function AuditTrail({ limit }: { limit?: number }) {
  const { token } = useAuth()
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFallback, setIsFallback] = useState(false)

  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/v1/audit/logs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = Array.isArray(response.data) ? response.data : []
        const logs = data.map((log: any) => {
          // Map backend action to frontend status for icons
          let status: "completed" | "created" | "updated" = "updated";
          if (log.action === "CREATE") status = "created";
          if (log.details?.toLowerCase().includes("completed")) status = "completed";

          return {
            id: log.id,
            action: log.details || log.action,
            timestamp: log.created_at,
            status: status,
          };
        })
        setEntries(limit ? logs.slice(0, limit) : logs)
        setIsFallback(false)
        setError(null)
      } catch (err) {
        console.error("Audit trail retrieval failed:", err)
        setError("Failed to load audit trail")
        setIsFallback(true)
        
        // Fallback: mock data that looks realistic
        const now = Date.now()
        setEntries([
          {
            id: "1",
            action: "Task Completed",
            taskName: "Finalize Project Documentation",
            timestamp: new Date(now - 1000 * 60 * 8).toISOString(),
            status: "completed",
          },
          {
            id: "2",
            action: "Task Created",
            taskName: "Review API endpoints",
            timestamp: new Date(now - 1000 * 60 * 35).toISOString(),
            status: "created",
          },
          {
            id: "3",
            action: "Task Completed",
            taskName: "Update README file",
            timestamp: new Date(now - 1000 * 60 * 120).toISOString(),
            status: "completed",
          },
          {
            id: "4",
            action: "Task Created",
            taskName: "Set up CI/CD pipeline",
            timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
            status: "created",
          },
          {
            id: "5",
            action: "Task Completed",
            taskName: "Design system audit",
            timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
            status: "completed",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLog()
  }, [token, limit])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-border bg-card p-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold tracking-[0.22em] text-foreground uppercase">
              Audit Trail
            </h3>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {isFallback ? "Showing demo activity" : "Recent activity log"}
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-1 text-[10px] font-medium text-destructive">
              <AlertCircle className="h-3 w-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-pulse text-sm text-muted-foreground/40">
              Loading...
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center">
            <p className="text-sm text-muted-foreground/50">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/60"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {getStatusIcon(entry.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {entry.action}
                        {entry.taskName ? `: "${entry.taskName}"` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground/60">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  )
}
