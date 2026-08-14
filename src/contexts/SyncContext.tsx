"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { useToast } from "@/hooks/use-toast"
import { api } from "@/lib/api"
import { queryClient } from "@/lib/query-client"
import { applyDeltaToCache, mergeConflictsIntoDelta } from "@/lib/sync-delta"
import {
  enqueueOrCall as enqueueOrCallPure,
  type EnqueueOrCallResult,
  type PendingMutationInput,
} from "@/lib/sync-enqueue"
import { flushSync, type SyncResponse } from "@/lib/sync-flush"
import { enqueueMutation, pendingMutationCount } from "@/lib/sync-queue"
import { getHttpErrorStatus, getRetryAfterSec } from "@/lib/errors"

interface SyncContextValue {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  conflictCount: number
  enqueueOrCall: <T>(
    mutation: PendingMutationInput,
    call: (mutation: PendingMutationInput) => Promise<T>
  ) => Promise<EnqueueOrCallResult<T>>
  triggerFlush: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

const CONFLICT_COUNT_CLEAR_MS = 10_000

function invalidateEntityQueries(
  entity: SyncResponse["conflicts"][number]["entity"]
) {
  const key =
    entity === "task" || entity === "subtask"
      ? "tasks"
      : entity === "project"
        ? "projects"
        : null
  if (key) {
    void queryClient.invalidateQueries({ queryKey: [key] })
  }
}

function applyDeltaToQueries(delta: SyncResponse["delta"]) {
  const tasksQueries = queryClient.getQueriesData<Record<string, unknown>[]>({
    queryKey: ["tasks"],
  })
  tasksQueries.forEach(([queryKey, tasks]) => {
    if (!tasks) return
    const params = queryKey[1] as
      | { filter?: string; project_id?: number; tag_id?: number }
      | undefined
    if (params?.filter || params?.project_id || params?.tag_id) {
      // Filtered lists may not contain the incoming rows; refetch instead of merging.
      void queryClient.invalidateQueries({ queryKey })
      return
    }
    const merged = applyDeltaToCache({ tasks, projects: [] }, delta)
    queryClient.setQueryData(queryKey, merged.tasks)
  })

  const taskQueries = queryClient.getQueriesData<Record<string, unknown>>({
    queryKey: ["task"],
  })
  taskQueries.forEach(([queryKey, task]) => {
    if (!task) return
    const merged = applyDeltaToCache({ tasks: [task], projects: [] }, delta)
    queryClient.setQueryData(queryKey, merged.tasks[0])
  })

  const projectQueries = queryClient.getQueriesData<Record<string, unknown>[]>({
    queryKey: ["projects"],
  })
  projectQueries.forEach(([queryKey, projects]) => {
    if (!projects) return
    const merged = applyDeltaToCache({ tasks: [], projects }, delta)
    queryClient.setQueryData(queryKey, merged.projects)
  })
}

export function SyncProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  )
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)
  const flushingRef = useRef(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const conflictClearTimerRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const triggerFlushRef = useRef<() => Promise<void>>(async () => {})
  const sinceRef = useRef<string | null>(null)

  const refreshPendingCount = useCallback(async () => {
    setPendingCount(await pendingMutationCount())
  }, [])

  const scheduleRetry = useCallback((retryAfterSec: number) => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
    retryTimerRef.current = setTimeout(() => {
      void triggerFlushRef.current()
    }, retryAfterSec * 1000)
  }, [])

  const triggerFlush = useCallback(async () => {
    if (flushingRef.current) return
    const count = await pendingMutationCount()
    if (count === 0 || !navigator.onLine) return
    flushingRef.current = true
    setIsSyncing(true)
    try {
      const result = await flushSync({
        isOnline: () => navigator.onLine,
        since: sinceRef.current,
        sendSync: async (request) => {
          const response = await api.post<SyncResponse>("/api/v1/sync", request)
          return response.data
        },
      })
      if (result.since) {
        sinceRef.current = result.since
      }
      if (result.conflictCount > 0) {
        setConflictCount(result.conflictCount)
        toast({
          title: "Sync",
          description: `${result.conflictCount} of your offline changes were overridden by newer changes.`,
          variant: "warning",
        })
        if (conflictClearTimerRef.current)
          clearTimeout(conflictClearTimerRef.current)
        conflictClearTimerRef.current = setTimeout(() => {
          setConflictCount(0)
        }, CONFLICT_COUNT_CLEAR_MS)
      }
      for (const conflict of result.conflicts) {
        if (conflict.op === "delete" && !conflict.server_state) {
          // A rejected delete without server state cannot be reconstructed from
          // the delta; refetch so the surviving row converges back into view.
          invalidateEntityQueries(conflict.entity)
        }
      }
      const delta = mergeConflictsIntoDelta(result.delta, result.conflicts)
      if (
        delta.tasks.length > 0 ||
        delta.subtasks.length > 0 ||
        delta.projects.length > 0
      ) {
        applyDeltaToQueries(delta)
      }
      if (result.retryAfterSec !== null && result.retryAfterSec > 0) {
        scheduleRetry(result.retryAfterSec)
      }
    } catch (error) {
      console.error("Sync flush failed; queue retained.", error)
    } finally {
      flushingRef.current = false
      setIsSyncing(false)
      await refreshPendingCount()
    }
  }, [refreshPendingCount, scheduleRetry, toast])

  useEffect(() => {
    triggerFlushRef.current = triggerFlush
  }, [triggerFlush])

  useEffect(() => {
    void pendingMutationCount().then((count) => setPendingCount(count))
    const handleOnline = () => {
      setIsOnline(true)
      void triggerFlush()
    }
    const handleOffline = () => setIsOnline(false)
    const handleFocus = () => {
      if (navigator.onLine) void triggerFlush()
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("focus", handleFocus)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (conflictClearTimerRef.current)
        clearTimeout(conflictClearTimerRef.current)
    }
  }, [refreshPendingCount, triggerFlush])

  const enqueueOrCall = useCallback(
    async <T,>(
      mutation: PendingMutationInput,
      call: (mutation: PendingMutationInput) => Promise<T>
    ) => {
      const result = await enqueueOrCallPure<T>({
        isOnline: () => navigator.onLine,
        call,
        enqueue: async (m) => {
          await enqueueMutation(m)
        },
        mutation,
      })
      await refreshPendingCount()
      if (result.queued && navigator.onLine) {
        if (getHttpErrorStatus(result.error) === 429) {
          // The mutation was already rate limited; retry from this first 429
          // instead of immediately re-hitting the API.
          scheduleRetry(getRetryAfterSec(result.error) ?? 60)
        } else {
          void triggerFlush()
        }
      }
      return result
    },
    [refreshPendingCount, scheduleRetry, triggerFlush]
  )

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      pendingCount,
      conflictCount,
      enqueueOrCall,
      triggerFlush,
    }),
    [
      isOnline,
      isSyncing,
      pendingCount,
      conflictCount,
      enqueueOrCall,
      triggerFlush,
    ]
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider")
  }
  return context
}
