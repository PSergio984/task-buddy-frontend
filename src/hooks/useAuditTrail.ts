import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { 
  type AuditEntry, groupByDate, isExcluded 
} from "@/lib/audit-trail-helpers"

interface UseAuditTrailOptions {
  limit: number
}

export function useAuditTrail({ limit }: UseAuditTrailOptions) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [currentLimit, setCurrentLimit] = useState(limit)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const { user } = useAuth()
  
  const fetchAuditLog = useCallback(async (signal?: AbortSignal) => {
    if (!user) {
      setLoading(false)
      return
    }
    try {
      const response = await api.get("/api/v1/audit/logs", {
        params: { limit: Math.min(Math.max(currentLimit * 2, 50), 500) },
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
    // Using a microtask to avoid "set-state-in-effect" warning for synchronous parts of fetchAuditLog
    void Promise.resolve().then(() => {
      fetchAuditLog(controller.signal)
    })
    return () => controller.abort()
  }, [fetchAuditLog])

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => !isExcluded(log.action))
      .filter((log) => {
        const searchLower = search.toLowerCase()
        if (!searchLower) return true
        return log.action?.toLowerCase().includes(searchLower) || 
               log.details?.toLowerCase().includes(searchLower)
      })
      .slice(0, currentLimit)
  }, [logs, search, currentLimit])

  const groupedLogs = useMemo(() => groupByDate(filteredLogs), [filteredLogs])

  return {
    logs,
    loading,
    error,
    search,
    setSearch,
    currentLimit,
    setCurrentLimit,
    filteredLogs,
    groupedLogs,
    fetchAuditLog
  }
}
