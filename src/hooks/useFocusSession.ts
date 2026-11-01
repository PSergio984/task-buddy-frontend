import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import axios from "axios"
import {
  focusSessionsApi,
  type FocusSession,
  type GameEventIn,
  type SessionActionResponse,
  type SessionStartRequest,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useGame } from "@/contexts/GameContext"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { removeGameEventsByPrefix } from "@/lib/game-event-queue"
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
  ms,
  type LocalSession,
  type SessionView,
} from "@/lib/focus-session"

export type SessionAction = "start" | "pause" | "resume" | "advance" | "stop"

const TICK_MS = 500
/** Floor between deadline-triggered server re-evaluations (offline / 5xx). */
const DEADLINE_POLL_MIN_MS = 5_000
/** A server session started within this window is the lost start response. */
const ADOPT_WINDOW_MS = 120_000

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
  /**
   * True while connectivity is down and the view is a read-only wall-clock
   * mirror of a server session — verbs must not run (no local scoring).
   */
  mirrored: boolean
}

export function useFocusSessionRuntime(): FocusSessionRuntime {
  const { user } = useAuth()
  const { enqueueEvent } = useGame()
  const { toast } = useToast()
  const userId = user?.id ?? null

  const [session, setSession] = useState<FocusSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busy, setBusy] = useState<SessionAction | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  const localRef = useRef<LocalSession | null>(null)
  const sessionRef = useRef<FocusSession | null>(null)
  const offsetRef = useRef(0) // server_time - client clock
  const refreshingRef = useRef(false)
  const lastDeadlinePollRef = useRef(0)

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
      if (res.profile && userId !== null) {
        setGameProfileCache(res.profile, userId)
      }
      applySession(res.session)
    },
    [applySession, userId]
  )

  const emitLocal = useCallback(
    (local: LocalSession, now: number) => {
      const before = signature(local.session)
      // shortcut: local sessions emit only the claimable types
      // (focus_phase_completed / damage). session_started/ended are
      // server-reserved, so an offline run has no session envelope in the
      // ledger timeline — accepted fidelity gap vs. forging server ids.
      const events = evaluateLocal(local, now)
      if (signature(local.session) === before) return
      applySession({ ...local.session })
      // Enqueue before persisting: a tab death between the two must strand
      // the snapshot, never the scoring events (eids re-dedupe on replay).
      void (async () => {
        for (const event of events) await enqueueEvent(event)
        if (local.session.status !== "active") {
          if (userId !== null) await clearLocalSession(userId)
        } else if (userId !== null) {
          await saveLocalSession(userId, local)
        }
      })()
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

  // Initial probe: server session wins; a network failure falls back to the
  // persisted local run. A non-network error proves nothing about offline —
  // it must not resurrect a stale local session.
  useEffect(() => {
    if (userId === null) {
      void Promise.resolve().then(() => setIsLoading(false))
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await focusSessionsApi.getActive()
        if (cancelled) return
        if (res !== null) {
          // Server session supersedes a persisted local run: its still-queued
          // web: events must drop too — server + claimable eids scoring the
          // same wall-clock would double-count XP or HP loss.
          const local = await loadLocalSession(userId)
          if (local !== null) {
            await removeGameEventsByPrefix(userId, `web:${local.client_id}:`)
            await clearLocalSession(userId)
          }
          localRef.current = null
          applyResponse(res)
          return
        }
      } catch (error) {
        if (cancelled) return
        if (!isNetworkError(error)) {
          console.error("Failed to probe focus session:", error)
          applySession(null)
          return
        }
        // Offline at probe: fall through to the persisted local session.
      }
      const local = await loadLocalSession(userId)
      if (cancelled) return
      if (local !== null && local.session.status === "active") {
        localRef.current = local
        emitLocal(local, Date.now())
        applySession({ ...local.session })
      } else {
        if (local !== null) await clearLocalSession(userId)
        applySession(null)
      }
    })().finally(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId, applyResponse, applySession, emitLocal])

  // Ticker: recompute the clock; local sessions re-evaluate every tick.
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now() + offsetRef.current)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (localRef.current !== null) {
      // Local timestamps are client-clock authored — never the skewed nowMs.
      emitLocal(localRef.current, Date.now())
      return
    }
    const current = sessionRef.current
    if (current === null || current.status !== "active") return
    const deadline = nextDeadlineMs(current)
    // Past a self-transition boundary: let the server replay wall-clock —
    // throttled, or an offline/5xx response would re-poll every tick.
    if (
      deadline !== null &&
      nowMs >= deadline &&
      Date.now() - lastDeadlinePollRef.current >= DEADLINE_POLL_MIN_MS
    ) {
      lastDeadlinePollRef.current = Date.now()
      void refreshRef.current()
    }
  }, [emitLocal, nowMs])

  // Connectivity drives both refresh and the offline-mirror display state.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void refreshRef.current()
    }
    const handleOffline = () => setIsOnline(false)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void refreshRef.current()
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
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
          // The POST may have committed while its response was lost — adopt a
          // just-started server session instead of split-braining (web: +
          // server: eids would double-score the same wall-clock).
          try {
            const res = await focusSessionsApi.getActive()
            const started = res === null ? null : ms(res.session.started_at)
            if (
              res !== null &&
              started !== null &&
              Math.abs(Date.now() - started) <= ADOPT_WINDOW_MS
            ) {
              applyResponse(res)
              toast({
                title: "Session recovered",
                description: "The server had already started this run.",
                variant: "info",
              })
              return
            }
          } catch {
            // Still offline — fall through to the client-run session.
          }
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
      action: Exclude<SessionAction, "start">,
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
    async (
      fn: (local: LocalSession, now: number) => GameEventIn[]
    ): Promise<boolean> => {
      const local = localRef.current
      if (local === null) return false
      if (local.session.status !== "active") return true
      try {
        // Evaluate before the verb — server parity: _evaluate runs inside
        // the lock first, so a due transition (e.g. pause-overflow) can't
        // be dodged by acting on the stale snapshot.
        const events = evaluateLocal(local, Date.now())
        if (local.session.status === "active") {
          events.push(...fn(local, Date.now()))
        }
        applySession({ ...local.session })
        for (const event of events) await enqueueEvent(event)
        if (local.session.status !== "active") {
          if (userId !== null) await clearLocalSession(userId)
        } else if (userId !== null) {
          await saveLocalSession(userId, local)
        }
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
    if (await localVerb((l, now) => pauseLocal(l, now))) return
    await serverVerb("pause", focusSessionsApi.pause)
  }, [localVerb, serverVerb])

  const resume = useCallback(async () => {
    if (await localVerb((l, now) => resumeLocal(l, now))) return
    await serverVerb("resume", focusSessionsApi.resume)
  }, [localVerb, serverVerb])

  const advance = useCallback(async () => {
    if (await localVerb((l, now) => advanceLocal(l, now))) return
    await serverVerb("advance", focusSessionsApi.advance)
  }, [localVerb, serverVerb])

  const stop = useCallback(async () => {
    if (await localVerb((l, now) => stopLocal(l, now))) return
    await serverVerb("stop", focusSessionsApi.stop)
  }, [localVerb, serverVerb])

  const dismissEnded = useCallback(async () => {
    localRef.current = null
    if (userId !== null) await clearLocalSession(userId)
    applySession(null)
  }, [applySession, userId])

  const mirrored =
    !isOnline &&
    session !== null &&
    session.id !== 0 &&
    session.status === "active"

  const view = useMemo(() => {
    if (session === null) return null
    if (!mirrored) return deriveSessionView(session, nowMs)
    // Offline mirror: replay wall-clock transitions on a throwaway clone for
    // display only. No LocalSession is persisted and the returned events are
    // discarded — the server stays the only scoring authority.
    const clone: LocalSession = {
      client_id: "mirror",
      session: { ...session, phases: session.phases.map((p) => ({ ...p })) },
    }
    evaluateLocal(clone, nowMs)
    return deriveSessionView(clone.session, nowMs)
  }, [session, nowMs, mirrored])

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
    mirrored,
  }
}
