import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { History, Search, AlertCircle, Clock } from "lucide-react"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

export interface AuditEntry {
  id: number
  action: string
  details: string
  created_at: string
  user_id: number
  target_type: string
  target_id?: number | null
}

export function AuditTrail({ limit = 5 }: { limit?: number }) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { token } = useAuth()

  useEffect(() => {
    const controller = new AbortController()

    const fetchAuditLog = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const response = await axios.get(`${API_BASE_URL}/api/v1/audit/logs`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: limit * 2 }, // Fetch extra for searching
          signal: controller.signal
        })
        setLogs(Array.isArray(response.data) ? response.data : [])
        setError(null)
      } catch (err: any) {
        if (axios.isCancel(err)) return
        setError("Failed to load audit trail.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAuditLog()
    return () => controller.abort()
  }, [token, limit])

  const filteredLogs = logs
    .filter((log) => {
      const searchLower = search.toLowerCase()
      const actionMatch = log.action?.toLowerCase().includes(searchLower) || false
      const detailsMatch = log.details?.toLowerCase().includes(searchLower) || false
      return actionMatch || detailsMatch
    })
    .slice(0, limit)

  if (loading && logs.length === 0) {
    return (
      <Card className="border-border bg-card p-6 h-full flex flex-col">
        <div className="h-4 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="space-y-4 flex-1">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-3 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-widest text-foreground uppercase">
              Recent Activity
            </h3>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              System Audit Trail
            </p>
          </div>
        </div>
        
        <div className="relative max-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input 
            placeholder="Search activity..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-[11px] bg-muted/50 border-border focus-visible:ring-ring/40"
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
            <p className="text-xs font-medium text-destructive">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex gap-4"
                  >
                    {/* Visual Connector */}
                    {index !== filteredLogs.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-[-16px] w-[1.5px] bg-border" />
                    )}
                    
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors group-hover:border-primary/20">
                      <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    
                    <div className="flex flex-col gap-1 py-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold tracking-wider text-foreground uppercase">
                          {log.action?.replace(/_/g, " ") || "ACTIVITY"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {log.details}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-center">
                  <p className="text-xs text-muted-foreground italic">
                    No activity matches your search
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </Card>
  )
}
