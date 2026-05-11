import React, { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { 
  Search, AlertCircle, Clock, ChevronDown, Activity, Sparkles,
  CheckCircle2, Folder, ListTodo, Shield,
  Trash2, Edit3, Plus, ExternalLink
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AuditEntry {
  id: number
  action: string
  details: string
  created_at: string
  user_id: number
  target_type: string
  target_id?: number | null
}

interface AuditTrailProps {
  readonly limit?: number
  readonly hideCard?: boolean
  readonly className?: string
}

/** Returns a human-readable date group label */
function getDateGroupLabel(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (d.getTime() === today.getTime()) return "Today"
  if (d.getTime() === yesterday.getTime()) return "Yesterday"
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

/** Groups a flat array of log entries into date-keyed buckets */
function groupByDate(logs: AuditEntry[]): { label: string; entries: AuditEntry[] }[] {
  const map = new Map<string, AuditEntry[]>()
  for (const log of logs) {
    const label = getDateGroupLabel(log.created_at)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(log)
  }
  return Array.from(map.entries()).map(([label, entries]) => ({ label, entries }))
}

function describeAction(action: string, details: string, targetType: string, targetId?: number | null): React.ReactNode {
  const act = action?.toLowerCase() || ""
  const target = targetType?.toUpperCase() || ""

  const bold = (text: string) => <span className="font-bold text-foreground">"{text}"</span>

  if (act.includes("create") && target === "TASK") {
    const name = details?.replace(/^Created task:\s*/i, "").trim()
    return name ? <span>Created task {bold(name)}</span> : "Created a new task"
  }
  
  if (act.includes("update") && target === "TASK") {
    const isCompleted = details?.toLowerCase().includes("completed: true") || details?.toLowerCase().includes("status: completed")
    const isUncompleted = details?.toLowerCase().includes("completed: false")
    const isTagAttached = details?.toLowerCase().includes("attached tag")
    const isTagDetached = details?.toLowerCase().includes("detached tag")
    
    const nameMatch = details?.match(/task\s*['"]?([^'":,]+)['"]?/i) ||
                      details?.match(/^Updated task:\s*(.+?)(?:\s*\(|$)/i) ||
                      details?.match(/^Refined task:\s*["']?([^"']+)/i)
    const name = nameMatch?.[1]?.trim()

    if (isCompleted) return <span>Marked {name ? bold(name) : "a task"} as done</span>
    if (isUncompleted) return <span>Reopened {name ? bold(name) : "a task"}</span>
    
    if (isTagAttached) {
      const tagMatch = details?.match(/tag\s*['"]?([^'":]+)['"]?/i)
      const tagName = tagMatch?.[1]?.trim()
      return <span>Added tag {tagName ? bold(tagName) : "a tag"} to {name ? bold(name) : "task"}</span>
    }
    if (isTagDetached) return <span>Removed a tag from {name ? bold(name) : "task"}</span>
    
    const fieldsMatch = details?.match(/\(fields:\s*([^)]+)\)/i)
    if (fieldsMatch) {
      const fieldsRaw = fieldsMatch[1]
      // Split by comma but ignore commas inside quotes if possible (simplifying for now)
      const fieldChanges = fieldsRaw.split(",").map(f => f.trim())
      
      return (
        <span>
          Updated task {name ? bold(name) : ""}
          <span className="text-muted-foreground ml-1">
            ({fieldChanges.map((change, i) => (
              <span key={i}>
                {i > 0 && ", "}
                {change}
              </span>
            ))})
          </span>
        </span>
      )
    }
    
    return <span>Updated task {name ? bold(name) : ""}</span>
  }

  if (act.includes("delete") && target === "TASK") {
    const nameMatch = details?.match(/task:\s*["']?([^"',(]+)/i) ||
                      details?.match(/^Deleted task:\s*(.+?)(?:\s*\(|$)/i)
    const name = nameMatch?.[1]?.trim()
    return <span>Deleted task {name ? bold(name) : "a task"}</span>
  }

  if (target === "SUBTASK") {
    const subtaskMatch = details?.match(/subtask\s*['"]?([^'":]+)['"]?/i)
    const subName = subtaskMatch?.[1]?.trim()
    
    const parentMatch = details?.match(/(?:to|on|from)\s*task\s*['"]?([^'":,]+)['"]?/i)
    const parentName = parentMatch?.[1]?.trim()

    const fieldsMatch = details?.match(/\(([^)]+)\)$/i) || details?.match(/\(fields:\s*([^)]+)\)/i)
    const fieldChangesRaw = fieldsMatch?.[1]

    if (act.includes("create")) {
      return <span>Added subtask {subName ? bold(subName) : "a subtask"} to {parentName ? bold(parentName) : "task"}</span>
    }

    if (act.includes("update")) {
      const isCompleted = details?.toLowerCase().includes("marked completed")
      if (isCompleted) return <span>Finished subtask {subName ? bold(subName) : "a subtask"}</span>
      
      return (
        <span>
          Updated {subName ? bold(subName) : "subtask"} on {parentName ? bold(parentName) : "task"}
          {fieldChangesRaw && (
            <span className="text-muted-foreground ml-1">
              ({fieldChangesRaw})
            </span>
          )}
        </span>
      )
    }
    if (act.includes("delete")) {
      return <span>Removed subtask {subName ? bold(subName) : "a subtask"} from {parentName ? bold(parentName) : "task"}</span>
    }
  }

  if (target === "PROJECT" || target === "GROUP") {
    const projMatch = details?.match(/project\s*['"]?([^'":]+)['"]?/i)
    const projName = projMatch?.[1]?.trim()
    
    if (act.includes("create")) return <span>Created project {projName ? bold(projName) : "a project"}</span>
    if (act.includes("update")) return <span>Updated project {projName ? bold(projName) : "a project"}</span>
    if (act.includes("delete")) return <span>Deleted project {projName ? bold(projName) : "a project"}</span>
  }

  const humanAction = action?.replaceAll("_", " ") || "Activity"
  return details || (targetId ? `${humanAction} on ${targetType} #${targetId}` : humanAction)
}


/** Actions to exclude from the history display */
const EXCLUDED_ACTIONS = new Set(["login", "logout", "user_login", "user_logout"])

function isExcluded(action: string): boolean {
  const act = action?.toLowerCase() || ""
  return Array.from(EXCLUDED_ACTIONS).some(ex => act.includes(ex))
}

export function AuditTrail({ 
  limit = 5, 
  hideCard = false, 
  className 
}: AuditTrailProps) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [currentLimit, setCurrentLimit] = useState(limit)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { user } = useAuth()
  
  const skeletonIds = useMemo(() => 
    Array.from({ length: limit }, (_, i) => `audit-skeleton-${i}-${Math.random().toString(36).substring(2, 11)}`),
  [limit])

  const fetchAuditLog = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const response = await api.get("/api/v1/audit/logs", {
        params: { limit: Math.max(currentLimit * 2, 50) },
        signal,
      })
      setLogs(Array.isArray(response.data) ? response.data : [])
      setError(null)
    } catch (err: unknown) {
      if (axios.isCancel(err)) return
      setError("Failed to load audit trail.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user, currentLimit])

  useEffect(() => {
    const controller = new AbortController()
    fetchAuditLog(controller.signal)
    return () => controller.abort()
  }, [fetchAuditLog])

  const filteredLogs = logs
    .filter((log) => !isExcluded(log.action))
    .filter((log) => {
      const searchLower = search.toLowerCase()
      if (!searchLower) return true
      const actionMatch = log.action?.toLowerCase().includes(searchLower) || false
      const detailsMatch = log.details?.toLowerCase().includes(searchLower) || false
      return actionMatch || detailsMatch
    })
    .slice(0, currentLimit)

  const groupedLogs = useMemo(() => groupByDate(filteredLogs), [filteredLogs])

  const getIcon = (action: string, targetType: string) => {
    const act = action?.toLowerCase() || ""
    const type = targetType?.toUpperCase() || ""
    
    switch (type) {
      case 'TASK':
        if (act.includes('delete')) return <Trash2 className="h-4 w-4 text-rose-400" />
        if (act.includes('create')) return <Plus className="h-4 w-4 text-emerald-400" />
        if (act.includes('update')) return <Edit3 className="h-4 w-4 text-sky-400" />
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />
      case 'SUBTASK':
        if (act.includes('delete')) return <Trash2 className="h-4 w-4 text-rose-400" />
        if (act.includes('create')) return <Plus className="h-4 w-4 text-indigo-400" />
        return <ListTodo className="h-4 w-4 text-indigo-400" />
      case 'PROJECT':
      case 'GROUP':
        if (act.includes('delete')) return <Trash2 className="h-4 w-4 text-rose-400" />
        if (act.includes('create')) return <Plus className="h-4 w-4 text-emerald-400" />
        return <Folder className="h-4 w-4 text-amber-400" />
      case 'USER':
        return <Shield className="h-4 w-4 text-purple-400" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  const content = (
    <div className={cn("flex flex-col h-full", !hideCard && "p-8")}>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Timeline
            </h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="h-3 w-3" />
              Activity History
            </p>
          </div>
        </div>
        
        <div className="relative w-full sm:max-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Filter history..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-11 rounded-xl bg-background/50 border-border focus-visible:ring-accent/30 placeholder:text-muted-foreground/50 transition-all hover:bg-background/80"
          />
        </div>
      </div>

      {error ? (
        <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-destructive/20 bg-destructive/5 p-12 text-center backdrop-blur-sm">
          <div className="space-y-4 max-w-xs mx-auto">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => fetchAuditLog()}
              className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {groupedLogs.length > 0 ? (
                <>
                  {groupedLogs.map(({ label, entries }, groupIdx) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, delay: groupIdx * 0.04 }}
                      className="space-y-5"
                    >
                      {/* Date Group Header */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/60">
                          {label}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                      </div>

                      {/* Log Entries in this group */}
                      {entries.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="group relative flex gap-6"
                        >
                          {/* Visual Connector */}
                          {index !== entries.length - 1 && (
                            <div className="absolute left-6 top-12 bottom-[-20px] w-[2px] bg-gradient-to-b from-border/80 via-border/30 to-transparent" />
                          )}
                          
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm transition-all group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5">
                            {getIcon(log.action, log.target_type)}
                          </div>
                          
                          <div className="flex flex-col gap-1.5 py-1 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <Clock className="h-3 w-3" />
                                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {log.target_id && log.target_type === 'TASK' && (
                                <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm leading-relaxed text-foreground font-semibold group-hover:text-primary transition-colors">
                              {describeAction(log.action, log.details, log.target_type, log.target_id)}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                  
                  {filteredLogs.length >= currentLimit && !search && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4 flex justify-center"
                    >
                      <Button 
                        variant="ghost" 
                        onClick={() => setCurrentLimit(prev => prev + 10)}
                        className="h-10 px-6 rounded-full font-bold uppercase tracking-[0.2em] text-xs text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                      >
                        <ChevronDown className="mr-2 h-4 w-4 animate-bounce" />
                        Load More
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                <div className="flex flex-col h-48 items-center justify-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30">
                    <Sparkles className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium italic">
                    {loading ? "Discovering history..." : "Silence. No activity logged yet."}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )

  if (hideCard) {
    return <div className={cn("h-full", className)}>{content}</div>
  }

  if (loading && logs.length === 0) {
    return (
      <Card className={cn("overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem] h-full flex flex-col", className)}>
        <div className="flex items-center gap-4 mb-8">
           <div className="h-12 w-12 bg-muted rounded-2xl animate-pulse" />
           <div className="space-y-2">
             <div className="h-5 w-32 bg-muted rounded animate-pulse" />
             <div className="h-3 w-24 bg-muted rounded animate-pulse" />
           </div>
        </div>
        <div className="space-y-8 flex-1">
          {skeletonIds.map((id) => (
            <div key={id} className="flex gap-6">
              <div className="h-12 w-12 bg-muted rounded-2xl animate-pulse" />
              <div className="flex-1 space-y-3 pt-1">
                <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden border bg-background/50 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem] h-full flex flex-col", className)}>
      {content}
    </Card>
  )
}
