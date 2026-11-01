import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import {
  focusSessionsApi,
  type FocusSession,
  type SessionActionResponse,
  type SessionStartRequest,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import {
  clearLocalSession,
  createLocalSession,
  evaluateLocal,
  advanceLocal,
  pauseLocal,
  resumeLocal,
  stopLocal,
  loadLocalSession,
  saveLocalSession,
  deriveSessionView,
  nextDeadlineMs,
  type LocalSession,
  type SessionView,
} from "@/lib/focus-session"

export type SessionAction =
  | "start"
  | "pause"
  | "resume"
  | "advance"
  | "stop"
  | "refresh"

const TICK_MS = 500

/** Statuses-only fingerprint — any local transition flips a bit. */
const signature = (s: FocusSession) =>
  `${s.status}|${s.phases.map((p) => `${p.status}:${p.paused_seconds}`).join(",")}`

const isNetworkError = (err: unknown) =>
  axios.isAxiosError(err) && err.response === undefined

export interface FocusSessionRuntime {
  /** The live or just-finished session; null shows the setup panel. */
  session: FocusSession | null
  /** True when the session runs fully client-side (offline contract). */
  isLocal: boolean
  isLoading: boolean
  busy: SessionAction | null
  /** Server-skew-adjusted clock driving every derived readout. */
  nowMs: number
  view: SessionView | null
  start: (input: SessionStartRequest) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  advance: () => Promise<void>
  stop: () => Promise<void>
  /** Clear a finished session back to the setup panel. */
  dismissEnded: () => Promise<void>
}

export function useFocusSession(): FocusSessionRuntime {
  const { user } = useAuth()
  const { enqueueEvent } = useGame()
  const { toast } = useToast()
  const userId = user?.id ?? null

  const [session, setSession] = useState<FocusSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<SessionAction | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const localRef = useRef<LocalSession | null>(null)
  const sessionRef = useRef<FocusSession | null>(null)
  const offsetRef = useRef(0) // server_time - client clock
  const refreshingRef = useRef(false)
  const startedRef = useRef(false)

  const applySession = useCallback((next: FocusSession | null) => {
    sessionRef.current = next
    setSession(next)
  }, [])

  const applyResponse = useCallback(
    (res: SessionActionResponse | null) => {
      if (res === null) {
        applySession(null)
        return
      }
      offsetRef.current = Date.parse(res.server_time) - Date.now()
      setNowMs(Date.now() + offsetRef.current)
      if (res.profile) setGameProfileCache(res.profile)
      applySession(res.session)
    },
    [applySession]
  )

  const emitLocal = useCallback(
    (local: LocalSession, now: number) => {
      const before = signature(local.session)
      const events = evaluateLocal(local, now)
      if (signature(local.session) === before) return
      for (const event of events) void enqueueEvent(event)
      if (local.session.status !== "active") {
        // Terminal state: scoring events are already queued; drop the record.
        if (userId !== null) void clearLocalSession(userId)
      } else if (userId !== null) {
        void saveLocalSession(userId, local)
      }
      applySession({ ...local.session })
    },
    [applySession, enqueueEvent, userId]
  )

  const refresh = useCallback(async () => {
    if (localRef.current !== null) {
      emitLocal(localRef.current, Date.now())
      return
    }
    if (refreshingRef.current) return
    refreshingRef.current = true
    try {
      const res = await focusSessionsApi.getActive()
      applyResponse(res)
    } catch (error) {
      // Offline keeps the last authoritative view — the server replays
      // wall-clock on the next successful call anyway.
      if (!isNetworkError(error)) {
        console.error("Failed to refresh focus session:", error)
      }
    } finally {
      refreshingRef.current = false
    }
  }, [applyResponse, emitLocal])

  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  // Initial probe: server session wins; otherwise restore a persisted local run.
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    if (userId === null) {
      void Promise.resolve().then(() => setIsLoading(false))
      return
    }
    void (async () => {
      try {
        const res = await focusSessionsApi.getActive()
        if (res !== null) {
          if (userId !== null) await clearLocalSession(userId)
          applyResponse(res)
          return
        }
      } catch {
        // Offline at probe: fall through to the persisted local session.
      }
      const local = await loadLocalSession(userId)
      if (local !== null && local.session.status === "active") {
        localRef.current = local
        emitLocal(local, Date.now())
        applySession({ ...local.session })
      } else {
        if (local !== null) await clearLocalSession(userId)
        applySession(null)
      }
    })().finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Ticker: recompute the clock; local sessions re-evaluate every tick.
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() + offsetRef.current)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (localRef.current !== null) {
      emitLocal(localRef.current, nowMs)
      return
    }
    const current = sessionRef.current
    if (current === null || current.status !== "active") return
    const deadline = nextDeadlineMs(current)
    // Past a self-transition boundary: let the server replay wall-clock.
    if (deadline !== null && nowMs >= deadline) void refreshRef.current()
  }, [emitLocal, nowMs])

  // Regain connectivity/visibility -> resync against server truth.
  useEffect(() => {
    const handleOnline = () => void refreshRef.current()
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshRef.current()
    }
    window.addEventListener("online", handleOnline)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("online", handleOnline)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [])

  const start = useCallback(
    async (input: SessionStartRequest) => {
      setBusy("start")
      try {
        const res = await focusSessionsApi.start(input)
        localRef.current = null
        applyResponse(res)
      } catch (error) {
        if (isNetworkError(error) && userId !== null) {
          // Offline-first: run the whole session client-side; completed
          // focus phases queue their scoring events for the ledger.
          const local = createLocalSession(
            {
              mode: input.mode ?? "timer",
              phases: input.phases ?? [],
              task_id: input.task_id ?? null,
              tag_id: input.tag_id ?? null,
              difficulty: input.difficulty ?? "easy",
              auto_start_breaks: input.auto_start_breaks ?? true,
              auto_start_focus: input.auto_start_focus ?? false,
              pause_budget_count: input.pause_budget_count ?? 3,
              pause_budget_seconds: input.pause_budget_seconds ?? 300,
            },
            Date.now()
          )
          localRef.current = local
          await saveLocalSession(userId, local)
          applySession({ ...local.session })
          toast({
            title: "Offline session",
            description:
              (input.mode ?? "timer") === "stopwatch"
                ? "No connection — the stopwatch runs, but milestone XP needs an online session."
                : "No connection — this run scores and syncs when you're back online.",
            variant: "info",
          })
        } else {
          toast({
            title: "Couldn't start session",
            description: getErrorMessage(error),
            variant: "destructive",
          })
        }
      } finally {
        setBusy(null)
      }
    },
    [applyResponse, applySession, toast, userId]
  )

  const serverVerb = useCallback(
    async (
      action: Exclude<SessionAction, "start" | "refresh">,
      call: (sessionId: number) => Promise<SessionActionResponse>
    ) => {
      const current = sessionRef.current
      if (current === null) return
      setBusy(action)
      try {
        const res = await call(current.id)
        applyResponse(res)
      } catch (error) {
        if (isNetworkError(error)) {
          toast({
            title: "Offline",
            description:
              "That action didn't reach the server — the wall clock is still running.",
            variant: "warning",
          })
        } else {
          toast({
            title: "Action failed",
            description: getErrorMessage(error),
            variant: "destructive",
          })
        }
        await refresh()
      } finally {
        setBusy(null)
      }
    },
    [applyResponse, refresh, toast]
  )

  const localVerb = useCallback(
    (fn: (local: LocalSession, now: number) => unknown) => {
      const local = localRef.current
      if (local === null) return false
      try {
        const events = fn(local, Date.now()) as ReturnType<typeof pauseLocal>
        for (const event of events) void enqueueEvent(event)
        if (local.session.status !== "active") {
          if (userId !== null) void clearLocalSession(userId)
        } else if (userId !== null) {
          void saveLocalSession(userId, local)
        }
        applySession({ ...local.session })
      } catch (error) {
        toast({
          title: "Action failed",
          description:
            error instanceof Error ? error.message : "Not allowed right now.",
          variant: "destructive",
        })
      }
      return true
    },
    [applySession, enqueueEvent, toast, userId]
  )

  const pause = useCallback(async () => {
    if (localVerb((l, now) => pauseLocal(l, now))) return
    await serverVerb("pause", focusSessionsApi.pause)
  }, [localVerb, serverVerb])

  const resume = useCallback(async () => {
    if (localVerb((l, now) => resumeLocal(l, now))) return
    await serverVerb("resume", focusSessionsApi.resume)
  }, [localVerb, serverVerb])

  const advance = useCallback(async () => {
    if (localVerb((l, now) => advanceLocal(l, now))) return
    await serverVerb("advance", focusSessionsApi.advance)
  }, [localVerb, serverVerb])

  const stop = useCallback(async () => {
    if (localVerb((l, now) => stopLocal(l, now))) return
    await serverVerb("stop", focusSessionsApi.stop)
  }, [localVerb, serverVerb])

  const dismissEnded = useCallback(async () => {
    localRef.current = null
    if (userId !== null) await clearLocalSession(userId)
    applySession(null)
  }, [applySession, userId])

  const view = useMemo(
    () => (session === null ? null : deriveSessionView(session, nowMs)),
    [session, nowMs]
  )

  return {
    session,
    // Local sessions are created with id 0 — server ids start at 1.
    isLocal: session !== null && session.id === 0,
    isLoading,
    busy,
    nowMs,
    view,
    start,
    pause,
    resume,
    advance,
    stop,
    dismissEnded,
  }
}
