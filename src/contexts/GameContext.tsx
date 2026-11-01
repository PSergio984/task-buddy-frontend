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
import { useAuth } from "@/contexts/AuthContext"
import { gameApi, type GameEventIn } from "@/lib/api"
import {
  enqueueGameEvent as persistGameEvent,
  flushGameEventQueue,
  pendingGameEventCount,
} from "@/lib/game-event-queue"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { probeGate } from "@/lib/focus-probe-gate"
import type { UserId } from "@/lib/sync-queue"

interface GameContextValue {
  /** Events queued for the /game/events ledger while offline. */
  pendingEventCount: number
  /** Persist a claimable event, then try to flush immediately. */
  enqueueEvent: (event: GameEventIn) => Promise<void>
  flushEvents: () => Promise<void>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth()
  const userId: UserId | null = user?.id ?? null
  const [pendingEventCount, setPendingEventCount] = useState(0)
  const flushingRef = useRef(false)
  const pendingFlushRef = useRef(false)
  const flushRef = useRef<() => Promise<void>>(async () => {})

  const refreshCount = useCallback(async () => {
    setPendingEventCount(
      userId === null ? 0 : await pendingGameEventCount(userId)
    )
  }, [userId])

  const flushEvents = useCallback(async () => {
    if (userId === null || !navigator.onLine) return
    if (flushingRef.current) {
      // A trigger mid-flush must not be dropped — run a trailing pass.
      pendingFlushRef.current = true
      return
    }
    // Synchronous guard — set before the FIRST await so two same-tick
    // triggers can never both enter a flush.
    flushingRef.current = true
    try {
      // Every flush path (mount, online, focus, visibility, enqueue) waits
      // out an armed focus probe — a pending supersede must drop the local
      // run's web: claims before they can POST.
      await probeGate(userId)
      if ((await pendingGameEventCount(userId)) === 0) return
      const res = await flushGameEventQueue(userId, gameApi.postEvents)
      if (res?.profile) void setGameProfileCache(res.profile, userId)
    } catch (error) {
      // The queue is authoritative — a failed flush just retries later.
      console.error("Game event flush failed; queue retained.", error)
    } finally {
      flushingRef.current = false
      await refreshCount()
      if (pendingFlushRef.current) {
        pendingFlushRef.current = false
        void flushEvents()
      }
    }
  }, [refreshCount, userId])

  useEffect(() => {
    flushRef.current = flushEvents
  }, [flushEvents])

  const enqueueEvent = useCallback(
    async (event: GameEventIn) => {
      if (userId === null) return
      await persistGameEvent(userId, event)
      await refreshCount()
      void flushEvents()
    },
    [flushEvents, refreshCount, userId]
  )

  useEffect(() => {
    // Deferred so the count refresh isn't a synchronous setState in an effect.
    void Promise.resolve().then(async () => {
      void refreshCount()
      // The probe gate lives inside flushEvents — every trigger (this mount
      // flush included) arrives ordered behind any in-flight supersede.
      if (navigator.onLine) void flushRef.current()
    })
    const handleOnline = () => void flushRef.current()
    const handleFocus = () => {
      if (navigator.onLine) void flushRef.current()
    }
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        void flushRef.current()
      }
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [refreshCount, userId])

  const value = useMemo(
    () => ({ pendingEventCount, enqueueEvent, flushEvents }),
    [pendingEventCount, enqueueEvent, flushEvents]
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGame(): GameContextValue {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}
