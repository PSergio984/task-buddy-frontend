"use client"

import { createContext, useContext, useEffect, useRef } from "react"
import {
  useFocusSessionRuntime,
  type FocusSessionRuntime,
} from "@/hooks/useFocusSession"
import { loadFocusSettings } from "@/lib/focus-settings"
import { alertPhaseBoundary } from "@/lib/focus-audio"

/**
 * Owns the single session-runtime instance for the whole app — the Focus page
 * and the persistent mini bar must share one probe/ticker/local session, so
 * the runtime is created here once instead of inside the /focus route.
 */
const FocusSessionContext = createContext<FocusSessionRuntime | null>(null)

export function FocusSessionProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const runtime = useFocusSessionRuntime()

  // Phase-boundary alerts live in the persistent shell — they must fire
  // while the user is on another route, not only on /focus. The status map
  // resets per session so a restored/sequential run can't replay tones, and
  // each fired boundary is keyed so it can't ring twice.
  const { session, view, mirrored } = runtime
  const prevPhaseStatus = useRef<Map<number, string>>(new Map())
  const firedBoundaries = useRef<Set<string>>(new Set())
  const sessionKey = session ? `${session.id}:${session.started_at}` : null
  useEffect(() => {
    prevPhaseStatus.current = new Map()
    firedBoundaries.current = new Set()
  }, [sessionKey])
  useEffect(() => {
    if (session === null) return
    const { alerts, alertVolume } = loadFocusSettings()
    for (const phase of session.phases) {
      const prev = prevPhaseStatus.current.get(phase.seq)
      prevPhaseStatus.current.set(phase.seq, phase.status)
      const finished =
        (phase.status === "completed" || phase.status === "skipped") &&
        prev !== "completed" &&
        prev !== "skipped" &&
        prev !== undefined
      const boundaryKey = `${phase.seq}:${phase.status}`
      if (finished && !firedBoundaries.current.has(boundaryKey)) {
        firedBoundaries.current.add(boundaryKey)
        if (alerts) {
          alertPhaseBoundary(
            phase.kind === "break" ? "break" : "focus",
            alertVolume / 100
          )
        }
      }
    }
  }, [session])

  // Mirror mode: session.phases is a frozen server snapshot, so the effect
  // above can't see mirrored boundaries. Track the derived view instead — a
  // live-seq change means the previous leg just ended; fire its kind's tone.
  const mirrorLiveRef = useRef<{ seq: number; kind: string } | null>(null)
  useEffect(() => {
    if (!mirrored || view === null) {
      mirrorLiveRef.current = null
      return
    }
    const live = view.live
    const prev = mirrorLiveRef.current
    mirrorLiveRef.current = live ? { seq: live.seq, kind: live.kind } : null
    if (prev !== null && (live === null || live.seq !== prev.seq)) {
      const boundaryKey = `mirror:${prev.seq}`
      if (!firedBoundaries.current.has(boundaryKey)) {
        firedBoundaries.current.add(boundaryKey)
        const { alerts, alertVolume } = loadFocusSettings()
        if (alerts) {
          alertPhaseBoundary(
            prev.kind === "break" ? "break" : "focus",
            alertVolume / 100
          )
        }
      }
    }
  }, [mirrored, view])

  return (
    <FocusSessionContext.Provider value={runtime}>
      {children}
    </FocusSessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFocusSession(): FocusSessionRuntime {
  const context = useContext(FocusSessionContext)
  if (!context) {
    throw new Error("useFocusSession must be used within FocusSessionProvider")
  }
  return context
}
