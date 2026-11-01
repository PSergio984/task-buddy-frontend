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
import { armProbeGate, releaseProbeGate } from "@/lib/focus-probe-gate"
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
  // server_time - client clock; state (not a ref) so the view memo can
  // un-skew local sessions with pure inputs: nowMs - serverOffset.
  const [serverOffset, setServerOffset] = useState(0)
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
      const serverNow = ms(res.server_time)
      const nextOffset =
        serverNow === null || !Number.isFinite(serverNow)
          ? 0
          : serverNow - Date.now()
      setServerOffset(nextOffset)
      setNowMs(Date.now() + nextOffset)
      if (res.profile && userId !== null) {
        void setGameProfileCache(res.profile, userId)
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
        try {
          for (const event of events) await enqueueEvent(event)
          if (local.session.status !== "active") {
            if (userId !== null) await clearLocalSession(userId)
          } else if (userId !== null) {
            await saveLocalSession(userId, local)
          }
        } catch (error) {
          // A rejected write leaves the event queued-or-not; the next mount
          // re-evaluates and dedupes — failure just must not be silent.
          console.error("Failed to persist local session progress:", error)
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

  // A local run may be shadowed by a server session started on another
  // device — on reconnect, probe once; a live session supersedes the local
  // run (same drop path as the mount probe).
  const reprobeLocal = useCallback(async () => {
    const local = localRef.current
    if (local === null || userId === null) return
    // Re-arm the probe gate BEFORE the first await: a same-tick
    // online-triggered flush must queue behind this probe, or it could
    // POST the superseded local run's web: claims before the drop lands.
    const gate = armProbeGate(userId)
    try {
      const res = await focusSessionsApi.getActive()
      if (res !== null) {
        localRef.current = null
        await removeGameEventsByPrefix(userId, `web:${local.client_id}:`)
        await clearLocalSession(userId)
        applyResponse(res)
      }
    } catch {
      // Still unreachable — the local run continues undisturbed.
    } finally {
      releaseProbeGate(userId, gate)
    }
  }, [applyResponse, userId])
  const reprobeLocalRef = useRef(reprobeLocal)
  useEffect(() => {
    reprobeLocalRef.current = reprobeLocal
  }, [reprobeLocal])

  // Initial probe: server session wins; a network failure falls back to the
  // persisted local run. A non-network error proves nothing about offline —
  // it must not resurrect a stale local session.
  useEffect(() => {
    if (userId === null) {
      localRef.current = null
      sessionRef.current = null
      void Promise.resolve().then(() => {
        setSession(null)
        setIsLoading(false)
      })
      return
    }
    let cancelled = false
    // Any stale local/applied session belongs to the previous probe/user —
    // clear it so the previous account's session can't render or accept
    // controls under the new account while this probe is in flight. Only the
    // restore branch below may repopulate either for THIS user.
    localRef.current = null
    sessionRef.current = null
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setSession(null)
        setIsLoading(true)
      }
    })
    // Arm BEFORE any await: GameContext's deferred mount flush awaits this
    // gate so a supersede-drop lands before the first POST of this queue.
    const gate = armProbeGate(userId)
    void (async () => {
      try {
        const res = await focusSessionsApi.getActive()
        if (cancelled) return
        if (res !== null) {
          // Server session supersedes a persisted local run: its still-queued
          // web: events must drop too — server + claimable eids scoring the
          // same wall-clock would double-count XP or HP loss. The drop is
          // conservative: a non-overlapping live server session also drops
          // local claims — duplicate session envelopes can't be told apart
          // from real double-work, so the server always wins.
          const local = await loadLocalSession(userId)
          if (local !== null) {
            await removeGameEventsByPrefix(userId, `web:${local.client_id}:`)
            await clearLocalSession(userId)
          }
          // Recheck after the drops — a cancelled probe must not apply a
          // stale server session over the newer probe's state.
          if (cancelled) return
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
        if (cancelled) return
        applySession(null)
      }
    })().finally(() => {
      releaseProbeGate(userId, gate)
      if (!cancelled) setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [userId, applyResponse, applySession, emitLocal])

  const hasSession = session !== null
  // Ticker: recompute the clock; local sessions re-evaluate every tick.
  // Runs only while a session exists — the provider outlives the page.
  useEffect(() => {
    if (!hasSession) return
    const timer = setInterval(() => {
      setNowMs(Date.now() + serverOffset)
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [hasSession, serverOffset])

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
    // throttled, and never while offline (a guaranteed-failure poll).
    if (
      isOnline &&
      deadline !== null &&
      nowMs >= deadline &&
      Date.now() - lastDeadlinePollRef.current >= DEADLINE_POLL_MIN_MS
    ) {
      lastDeadlinePollRef.current = Date.now()
      void refreshRef.current()
    }
  }, [emitLocal, nowMs, isOnline])

  // Connectivity drives both refresh and the offline-mirror display state.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (localRef.current !== null) void reprobeLocalRef.current()
      else void refreshRef.current()
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
        // The POST may have committed while its response was lost — or the
        // server refused (409 already-active). Probe once either way: ANY
        // non-null getActive is authoritative — the server evaluated
        // clock-death before returning, so age never means "stale".
        try {
          const res = await focusSessionsApi.getActive()
          if (res !== null) {
            applyResponse(res)
            toast({
              title: "Session recovered",
              description:
                "The server already has a live session — resuming it.",
              variant: "info",
            })
            return
          }
        } catch {
          // Probe failed too — fall through to the original error's path.
        }
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
        // be dodged by acting on the stale snapshot. Those events are real
        // wall-clock claims regardless of the verb's outcome — enqueue them
        // BEFORE fn so a throwing verb can't take them down with it.
        const events = evaluateLocal(local, Date.now())
        applySession({ ...local.session })
        for (const event of events) await enqueueEvent(event)
        if (local.session.status === "active") {
          const verbEvents = fn(local, Date.now())
          applySession({ ...local.session })
          for (const event of verbEvents) await enqueueEvent(event)
        }
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
    // Clear the view first — a rejected idb delete must not strand a dead
    // session on screen (the stale snapshot is re-dropped on next mount).
    applySession(null)
    if (userId !== null) await clearLocalSession(userId)
  }, [applySession, userId])

  const mirrored =
    !isOnline &&
    session !== null &&
    session.id !== 0 &&
    session.status === "active"

  const view = useMemo(() => {
    if (session === null) return null
    // Local sessions are client-clock authored — the server offset must not
    // skew their ring (nowMs - offset ≡ the client clock at last tick).
    // Mirrored sessions evaluate the server clone on skewed nowMs.
    if (!mirrored) {
      return deriveSessionView(
        session,
        session.id === 0 ? nowMs - serverOffset : nowMs
      )
    }
    // Offline mirror: replay wall-clock transitions on a throwaway clone for
    // display only. No LocalSession is persisted and the returned events are
    // discarded — the server stays the only scoring authority.
    const clone: LocalSession = {
      client_id: "mirror",
      session: { ...session, phases: session.phases.map((p) => ({ ...p })) },
    }
    evaluateLocal(clone, nowMs)
    return deriveSessionView(clone.session, nowMs)
  }, [session, nowMs, mirrored, serverOffset])

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
