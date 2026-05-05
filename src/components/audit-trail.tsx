import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { CheckCircle, Clock } from "lucide-react"
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

export function AuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAuditLog = async () => {
      try {
        const token = localStorage.getItem("auth_token")
        const response = await axios.get(`${API_BASE_URL}/api/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        // Transform response to match our component's structure
        const logs = response.data.map((log: any) => ({
          id: log.id,
          action: log.action,
          taskName: log.task_name,
          timestamp: log.timestamp,
          status: log.status,
        }))
        setEntries(logs.slice(0, 10)) // Show last 10 entries
      } catch (error) {
        console.error("Failed to fetch audit log:", error)
        // Fallback: Use mock data for demo
        setEntries([
          {
            id: "1",
            action: "Task Completed",
            taskName: "Finalize Project Documentation",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            status: "completed",
          },
          {
            id: "2",
            action: "System Boot",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            status: "created",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLog()
  }, [])

  const formatTime = (timestamp: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "created":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <Card className="border-slate-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold tracking-widest text-slate-600 uppercase">
            Audit Trail
          </h3>
          <p className="mt-1 text-xs text-slate-500">Recent activity log</p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-pulse text-slate-400">Loading...</div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-center">
            <p className="text-slate-500">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <div className="mt-1">{getStatusIcon(entry.status)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {entry.action}
                      </p>
                      {entry.taskName && (
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {entry.taskName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 text-right">
                    <p className="text-xs font-medium text-slate-500">
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
