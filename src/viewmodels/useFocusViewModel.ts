/**
 * Focus View Model
 * Encapsulates focus session state, UI toggles, sound priming, and actions for FocusPage.
 */
import { useEffect, useMemo, useRef, useState } from "react"
import { useFocusSession } from "@/contexts/FocusSessionContext"
import { useTasks } from "@/hooks/useTasks"
import { useTags } from "@/hooks/useTags"
import { primeAlertAudio, requestAlertPermission } from "@/lib/focus-audio"
import {
  FocusModel,
  FOCUS_SETTINGS_KEY,
  getRingTone,
  getSpeedrunEndCopy,
  sessionStartFromSettings,
  type FocusSettings,
  type RingTone,
} from "@/models/focus.model"

export function useFocusViewModel() {
  const runtime = useFocusSession()
  const { session, view, isLocal, isLoading, busy, mirrored } = runtime

  const [settings, setSettings] = useState<FocusSettings>(
    FocusModel.loadSettings
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const immersiveEnteredFor = useRef<string | null>(null)

  const { data: tasks = [] } = useTasks()
  const { data: tags = [] } = useTags()

  const linkedTask = useMemo(
    () => tasks.find((t) => t.id === session?.task_id) ?? null,
    [tasks, session?.task_id]
  )
  const linkedTag = useMemo(
    () => tags.find((t) => t.id === session?.preset?.tag_id) ?? null,
    [tags, session?.preset?.tag_id]
  )

  // Persist settings (task/tag links are per-run, never persisted).
  useEffect(() => {
    try {
      const { taskId: _t, tagId: _g, ...persistable } = settings
      globalThis.localStorage.setItem(
        FOCUS_SETTINGS_KEY,
        JSON.stringify(persistable)
      )
    } catch {
      // Settings persistence is best-effort.
    }
  }, [settings])

  // Auto-enter immersive for a fresh session when the setting is on.
  const restoredRef = useRef(false)
  useEffect(() => {
    if (!restoredRef.current && !isLoading) {
      restoredRef.current = true
      if (session !== null) {
        immersiveEnteredFor.current = session.started_at
      }
    }
    if (
      session?.status === "active" &&
      settings.immersive &&
      immersiveEnteredFor.current !== session.started_at
    ) {
      immersiveEnteredFor.current = session.started_at
      void Promise.resolve().then(() => setImmersive(true))
      void document.documentElement.requestFullscreen?.().catch(() => {})
    }
    if (session === null) immersiveEnteredFor.current = null
    if (view?.status === "ended" || view?.status === "abandoned") {
      void Promise.resolve().then(() => setImmersive(false))
      void document.exitFullscreen?.().catch(() => {})
    }
  }, [session, settings.immersive, view?.status, isLoading])

  const enterImmersive = () => {
    setImmersive(true)
    void document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const exitImmersive = () => {
    setImmersive(false)
    void document.exitFullscreen?.().catch(() => {})
  }

  const startSession = async () => {
    if (settings.alerts) {
      requestAlertPermission()
      primeAlertAudio()
    }
    await runtime.start(sessionStartFromSettings(settings))
  }

  const stopSession = async () => {
    setStopConfirmOpen(false)
    await runtime.stop()
  }

  const handleSettingsChange = (next: FocusSettings) => {
    setSettings(next)
    runtime.setAlertSettings({
      alerts: next.alerts,
      alertVolume: next.alertVolume,
    })
  }

  const running = session !== null && view !== null

  const live = view?.live
  const isStopwatch = live?.kind === "stopwatch"
  const isSpeedrun = live?.kind === "speedrun"
  const isAbandon = isSpeedrun || (!isStopwatch && (view?.focusDone ?? 0) === 0)
  const stopLabel = isSpeedrun
    ? "Give up (−HP)"
    : isAbandon
      ? "Stop → abandon (−HP)"
      : "End session"

  const ringTone: RingTone = view ? getRingTone(view) : "idle"

  const speedrunEnd =
    running && (view.status === "ended" || view.status === "abandoned")
      ? getSpeedrunEndCopy(session)
      : null

  const stopModalTitle =
    session?.mode === "speedrun"
      ? "Give up the run?"
      : view && view.focusDone === 0 && session?.mode !== "stopwatch"
        ? "Abandon session?"
        : "End session?"

  const stopModalDescription =
    session?.mode === "speedrun"
      ? session.speedrun?.type === "beat_best"
        ? "Giving up counts as an abandon — HP is lost and the record stands."
        : "Giving up counts as an abandon — HP is lost."
      : view && view.focusDone === 0 && session?.mode !== "stopwatch"
        ? "No focus phase completed yet — stopping now costs HP."
        : session?.mode === "stopwatch"
          ? "The stopwatch ends here — no HP cost."
          : "Completed focus phases keep their earned XP and gold."

  const stopModalConfirmText =
    session?.mode === "speedrun"
      ? "Give up (−HP)"
      : view && view.focusDone === 0 && session?.mode !== "stopwatch"
        ? "Abandon (−HP)"
        : "End session"

  const stopModalVariant: "destructive" | "default" =
    session?.mode === "speedrun" ||
    (view !== null && view.focusDone === 0 && session?.mode !== "stopwatch")
      ? "destructive"
      : "default"

  return {
    // Session state
    session,
    view,
    isLocal,
    isLoading,
    busy,
    mirrored,
    running,
    linkedTask,
    linkedTag,
    ringTone,
    speedrunEnd,

    // Controls derivation
    isStopwatch,
    isSpeedrun,
    isAbandon,
    stopLabel,

    // Stop modal derivation
    stopModalTitle,
    stopModalDescription,
    stopModalConfirmText,
    stopModalVariant,

    // UI state
    settings,
    settingsOpen,
    stopConfirmOpen,
    immersive,

    // Setters / toggles
    setSettingsOpen,
    setStopConfirmOpen,
    openSettings: () => setSettingsOpen(true),
    closeSettings: () => setSettingsOpen(false),
    openStopConfirm: () => setStopConfirmOpen(true),
    closeStopConfirm: () => setStopConfirmOpen(false),
    enterImmersive,
    exitImmersive,
    onSettingsChange: handleSettingsChange,

    // Session verbs
    start: startSession,
    stop: stopSession,
    pause: runtime.pause,
    resume: runtime.resume,
    advance: runtime.advance,
    done: runtime.done,
    dismissEnded: runtime.dismissEnded,
  }
}
