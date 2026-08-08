"use client"

import { useEffect, useRef } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"

import { api } from "@/lib/api"
import { getRealtimeClient } from "@/lib/realtime-client"
import { useAuth } from "@/contexts/AuthContext"
import { queryClient } from "@/lib/query-client"

type TableMapping = {
  table: string
  invalidate: string[][]
}

const TABLE_MAPPINGS: TableMapping[] = [
  { table: "tbl_tasks", invalidate: [["tasks"], ["task"], ["stats"]] },
  { table: "tbl_subtasks", invalidate: [["tasks"], ["task"]] },
  { table: "tbl_projects", invalidate: [["projects"], ["tasks"]] },
  { table: "tbl_tags", invalidate: [["tags"], ["tasks"]] },
  { table: "tbl_notifications", invalidate: [["notifications"]] },
]

type RealtimeToken = {
  token: string
  expires_in: number
}

const RETRY_BASE_MS = 5000
const RETRY_MAX_MS = 60000

export function RealtimeWatcher() {
  const { user } = useAuth()
  const channelsRef = useRef<RealtimeChannel[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const client = getRealtimeClient()
    if (!client || !user || user.email_confirmed === false) return undefined

    let disposed = false
    let retryMs = RETRY_BASE_MS

    const scheduleTokenRefresh = (delayMs: number) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      const needSubscribe = channelsRef.current.length === 0
      timerRef.current = setTimeout(() => void mintToken(needSubscribe), delayMs)
    }

    const mintToken = async (subscribe: boolean) => {
      if (disposed) return

      let tokenData: RealtimeToken
      try {
        const response = await api.post<RealtimeToken>("/api/v1/realtime/token")
        tokenData = response.data
      } catch (err) {
        console.error("Realtime token fetch failed:", err)
        retryMs = Math.min(retryMs * 2, RETRY_MAX_MS)
        scheduleTokenRefresh(retryMs)
        return
      }

      retryMs = RETRY_BASE_MS

      if (disposed) return

      // RLS policies are re-evaluated on token refresh, so a setAuth-only
      // update keeps existing channels alive across expiries.
      client.realtime.setAuth(tokenData.token)

      if (subscribe) {
        for (const mapping of TABLE_MAPPINGS) {
          const channel = client
            .channel(`postgres_changes:${mapping.table}`)
            .on(
              "postgres_changes",
              {
                event: "*",
                schema: "public",
                table: mapping.table,
              },
              () => {
                for (const key of mapping.invalidate) {
                  void queryClient.invalidateQueries({ queryKey: key })
                }
              }
            )
            .subscribe()
          channelsRef.current.push(channel)
        }
      }

      const refreshMs = Math.max((tokenData.expires_in - 30) * 1000, 5000)
      scheduleTokenRefresh(refreshMs)
    }

    void mintToken(true)

    return () => {
      disposed = true
      if (timerRef.current) clearTimeout(timerRef.current)
      for (const channel of channelsRef.current) {
        void client.removeChannel(channel)
      }
      channelsRef.current = []
    }
  }, [user])

  return null
}
