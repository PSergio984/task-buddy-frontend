import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import {
  type AuditEntry,
  groupByDate,
  isExcluded,
} from "@/lib/audit-trail-helpers"

interface UseAuditTrailOptions {
  limit: number
}

export type ActionFilter = "all" | "create" | "update" | "delete"
export type DateFilter = "all" | "today" | "yesterday" | "7d" | "30d"

function isInDateRange(dateStr: string, filter: DateFilter): boolean {
  if (filter === "all") return true
  const date = new Date(dateStr)
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  if (filter === "today") return date >= startOfToday
  if (filter === "yesterday")
    return date >= startOfYesterday && date < startOfToday
  if (filter === "7d") {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 7)
    return date >= cutoff
  }
  if (filter === "30d") {
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - 30)
    return date >= cutoff
  }
  return true
}

export function useAuditTrail({ limit }: UseAuditTrailOptions) {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [currentLimit, setCurrentLimit] = useState(limit)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const { user } = useAuth()

  const fetchAuditLog = useCallback(
    async (signal?: AbortSignal) => {
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
    },
    [user, currentLimit]
  )

  useEffect(() => {
    const controller = new AbortController()
    void Promise.resolve().then(() => {
      fetchAuditLog(controller.signal)
    })
    return () => controller.abort()
  }, [fetchAuditLog])

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => !isExcluded(log.action))
      .filter((log) => {
        if (actionFilter === "all") return true
        const act = log.action?.toLowerCase() ?? ""
        return act.includes(actionFilter)
      })
      .filter((log) => isInDateRange(log.created_at, dateFilter))
      .filter((log) => {
        const searchLower = search.toLowerCase()
        if (!searchLower) return true
        return (
          log.action?.toLowerCase().includes(searchLower) ||
          log.details?.toLowerCase().includes(searchLower)
        )
      })
      .slice(0, currentLimit)
  }, [logs, search, actionFilter, dateFilter, currentLimit])

  const groupedLogs = useMemo(() => groupByDate(filteredLogs), [filteredLogs])

  return {
    logs,
    loading,
    error,
    search,
    setSearch,
    actionFilter,
    setActionFilter,
    dateFilter,
    setDateFilter,
    currentLimit,
    setCurrentLimit,
    filteredLogs,
    groupedLogs,
    fetchAuditLog,
  }
}
