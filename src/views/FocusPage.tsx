import { useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  CheckCircle2,
  Flag,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  SkipForward,
  Square,
  WifiOff,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { TimerRing } from "@/components/focus/timer-ring"
import { SessionSetup } from "@/components/focus/session-setup"
import { SessionSettingsSheet } from "@/components/focus/session-settings-sheet"
import { SessionNotePrompt } from "@/components/focus/session-note-prompt"
import { useFocusSession } from "@/contexts/FocusSessionContext"
import { useTasks } from "@/hooks/useTasks"
import { useTags } from "@/hooks/useTags"
import { primeAlertAudio, requestAlertPermission } from "@/lib/focus-audio"
import type { FocusSession } from "@/lib/api"
import {
  formatClock,
  sessionStartFromSettings,
  speedrunVerdictCopy,
  type FocusSettings,
  type SessionView,
} from "@/lib/focus-session"
import { FOCUS_SETTINGS_KEY, loadFocusSettings } from "@/lib/focus-settings"
import { cn } from "@/lib/utils"

function ringTone(view: SessionView): "focus" | "break" | "stopwatch" | "idle" {
  const phase = view.live ?? view.pending
  if (phase === null) return "idle"
  if (phase.kind === "break") return "break"
  if (phase.kind === "stopwatch") return "stopwatch"
  // Speedrun: time-boxed counts down like a timer; beat-best is an open clock.
  if (phase.kind === "speedrun") {
    return phase.planned_seconds > 0 ? "focus" : "stopwatch"
  }
  return "focus"
}

function CycleDots({ session }: Readonly<{ session: FocusSession }>) {
  const focusPhases = session.phases.filter((p) => p.kind === "focus")
  if (focusPhases.length <= 1) return null
  return (
    <div className="flex items-center gap-2 text-lg">
      {focusPhases.map((p) => (
        <span
          key={p.seq}
          className={cn(
            "leading-none",
            p.status === "completed"
              ? "text-primary"
              : p.status === "active" || p.status === "paused"
                ? "text-primary/60"
                : "text-foreground/20"
          )}
          role="img"
          aria-label={`focus phase ${p.seq} ${p.status}`}
        >
          {p.status === "completed"
            ? "●"
            : p.status === "active" || p.status === "paused"
              ? "◐"
              : "○"}
        </span>
      ))}
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
        cycles
      </span>
    </div>
  )
}

/**
 * Result-keyed copy for a finished speedrun (#69) — null for normal modes.
 * Titles and the default bodies come from speedrunVerdictCopy (shared with
 * the boundary alert); this wrapper only upgrades the description where the
 * judged blob carries the figures the page has room to show.
 */
function speedrunEndCopy(session: FocusSession): {
  ok: boolean
  title: string
  description: string
} | null {
  const run = session.speedrun
  if (session.mode !== "speedrun") return null
  const leg = session.phases.find((p) => p.kind === "speedrun")
  const { ok, title, body } = speedrunVerdictCopy(run, leg?.planned_seconds)
  const clock = (v: number | null | undefined) =>
    typeof v === "number" ? formatClock(v) : null
  let description = body
  if (run?.result === "win") {
    // margin_seconds is the judged spare; backends without it derive the
    // same number off the leg's budget minus the run's elapsed.
    const spare =
      run.margin_seconds ??
      (typeof run.elapsed_seconds === "number" && leg !== undefined
        ? Math.max(0, leg.planned_seconds - run.elapsed_seconds)
        : null)
    const margin = clock(spare)
    if (margin !== null) description = `Done with ${margin} to spare.`
  } else if (run?.result === "record") {
    // old_record_seconds lands once judged; the start-time target_seconds
    // is the same record snapshot on backends that omit it.
    const oldBest = clock(run.old_record_seconds ?? run.target_seconds)
    const newBest = clock(run.elapsed_seconds)
    if (oldBest !== null && newBest !== null) {
      description = `${oldBest} → ${newBest} for this activity.`
    }
  } else if (run?.result === "finished") {
    const record = clock(run.old_record_seconds ?? run.target_seconds)
    if (record !== null) {
      description = `Time logged — the record stands at ${record}.`
    }
  }
  return { ok, title, description }
}

function SessionControls({
  view,
  busy,
  compact,
  onPause,
  onResume,
  onAdvance,
  onStop,
  onDone,
}: Readonly<{
  view: SessionView
  busy: boolean
  compact?: boolean
  onPause: () => void
  onResume: () => void
  onAdvance: () => void
  onStop: () => void
  onDone: () => void
}>) {
  const live = view.live
  const isStopwatch = live?.kind === "stopwatch"
  const isSpeedrun = live?.kind === "speedrun"
  // A stopwatch stop never owes HP — only a timer with zero completed focus
  // phases abandons, and gets the destructive copy/variant. A speedrun stop
  // is ALWAYS the abandon path (#69: give up → HP loss).
  const isAbandon = isSpeedrun || (!isStopwatch && view.focusDone === 0)
  const stopLabel = isSpeedrun
    ? "Give up (−HP)"
    : isAbandon
      ? "Stop → abandon (−HP)"
      : "End session"
  const stopButton = (
    <Button
      variant="outline"
      onClick={onStop}
      disabled={busy}
      className={cn(
        "h-12 gap-2 rounded-2xl px-5 font-bold",
        isAbandon
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-white/15 text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      <Square className="h-4 w-4" />
      {stopLabel}
    </Button>
  )

  if (view.status === "awaiting") {
    const next = view.pending
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Button
            onClick={onAdvance}
            disabled={busy || next === null}
            className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Play className="h-4 w-4" />
            Start {next?.kind ?? "phase"} · {formatClock(view.clockSeconds)}
          </Button>
          {stopButton}
        </div>
        {view.graceEndsInSec !== null && (
          <p className="text-xs text-muted-foreground">
            Auto-ends in {formatClock(view.graceEndsInSec)} if not started
          </p>
        )}
      </div>
    )
  }

  if (view.status !== "running" && view.status !== "paused") return null

  // Speedrun (#69): Done is the win/finish path, give-up abandons for HP
  // loss, and pauses never bank time — the clock keeps counting.
  if (isSpeedrun) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={onDone}
            disabled={busy}
            className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20"
          >
            <Flag className="h-4 w-4" />
            Done
          </Button>
          {view.status === "paused" ? (
            <Button
              variant="outline"
              onClick={onResume}
              disabled={busy}
              className="h-12 gap-2 rounded-2xl border-white/15 px-5 font-bold text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={onPause}
              disabled={busy}
              className="h-12 gap-2 rounded-2xl border-white/15 px-5 font-bold text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {!compact && stopButton}
        </div>
        <p className="text-xs text-muted-foreground">
          {view.status === "paused"
            ? "Paused — the clock keeps running."
            : "Pauses don't stop the clock."}
        </p>
      </div>
    )
  }

  const isBreak = live?.kind === "break"
  const pauseLabel = isStopwatch
    ? "Pause"
    : view.pausesLeft === null
      ? "Pause"
      : `Pause (${view.pausesLeft} left · ${formatClock(view.pauseUsedSec)} used)`

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {isBreak ? (
        <Button
          onClick={onAdvance}
          disabled={busy}
          className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20"
        >
          <SkipForward className="h-4 w-4" />
          Skip break
        </Button>
      ) : view.status === "paused" ? (
        <Button
          onClick={onResume}
          disabled={busy}
          className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Play className="h-4 w-4" />
          Resume
          {!isStopwatch &&
            ` · ${formatClock(view.pauseUsedSec)}/${formatClock(view.pauseBudgetSec)} paused`}
        </Button>
      ) : (
        <Button
          onClick={onPause}
          disabled={busy || view.pausesLeft === 0}
          className="h-12 gap-2 rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Pause className="h-4 w-4" />
          {pauseLabel}
        </Button>
      )}
      {!compact && stopButton}
    </div>
  )
}

export function FocusPage() {
  const runtime = useFocusSession()
  const { session, view, isLocal, isLoading, busy, mirrored } = runtime
  const [settings, setSettings] = useState<FocusSettings>(loadFocusSettings)
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

  // Persist settings (task/tag links are per-run, never persisted). Storage
  // can be blocked or full — a rejected write must not break the page.
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

  // Auto-enter immersive for a fresh session when the setting is on. A
  // session already live when the probe settles is a remount/restore —
  // don't auto-immerse unprompted on reload.
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

  // Phase-boundary alert effects live in FocusSessionProvider — they must
  // fire while the user is on another route, not only on /focus.

  const exitImmersive = () => {
    setImmersive(false)
    void document.exitFullscreen?.().catch(() => {})
  }

  const handleStart = async () => {
    // User gesture — the one moment notification permission may be requested
    // and the AudioContext can be resumed (autoplay policy).
    if (settings.alerts) {
      requestAlertPermission()
      primeAlertAudio()
    }
    await runtime.start(sessionStartFromSettings(settings))
  }

  const handleStop = async () => {
    setStopConfirmOpen(false)
    await runtime.stop()
  }

  // Mirror alert prefs into the shared runtime — the provider's boundary
  // alert must follow the LIVE state even if the persist below fails.
  const handleSettingsChange = (next: FocusSettings) => {
    setSettings(next)
    runtime.setAlertSettings({
      alerts: next.alerts,
      alertVolume: next.alertVolume,
    })
  }

  const running = session !== null && view !== null

  const ringBlock = running && (
    <div className="flex flex-col items-center gap-3">
      <TimerRing
        progress={view.progress}
        clockText={formatClock(view.clockSeconds)}
        subLabel={view.kindLabel}
        tone={ringTone(view)}
      />
      {isLocal && (
        <Badge
          variant="outline"
          className="gap-1 rounded-full border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black tracking-widest text-amber-400 uppercase"
        >
          <WifiOff className="h-3 w-3" /> Offline · syncs later
        </Badge>
      )}
      {mirrored && (
        <Badge
          variant="outline"
          className="gap-1 rounded-full border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[10px] font-black tracking-widest text-sky-400 uppercase"
        >
          <WifiOff className="h-3 w-3" /> Offline · showing mirror — reconnect
          to act
        </Badge>
      )}
    </div>
  )

  const chipsBlock = running && (linkedTask !== null || linkedTag !== null) && (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {linkedTask && (
        <Badge className="rounded-full bg-primary/15 px-4 py-1 text-xs font-bold text-primary">
          📌 {linkedTask.title}
        </Badge>
      )}
      {linkedTag && (
        <Badge
          variant="secondary"
          className="rounded-full bg-accent/15 px-4 py-1 text-xs font-bold text-accent"
        >
          #{linkedTag.name}
        </Badge>
      )}
    </div>
  )

  const speedrunEnd =
    running && (view.status === "ended" || view.status === "abandoned")
      ? speedrunEndCopy(session)
      : null

  const endedBlock = running &&
    (view.status === "ended" || view.status === "abandoned") && (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        {speedrunEnd !== null ? (
          <>
            {speedrunEnd.ok ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
            <div>
              <p className="text-lg font-black tracking-tight">
                {speedrunEnd.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {speedrunEnd.description}
              </p>
            </div>
          </>
        ) : view.status === "ended" ? (
          <>
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="text-lg font-black tracking-tight">
                Session complete
              </p>
              <p className="text-sm text-muted-foreground">
                Finished phases already scored — totals updated.
              </p>
            </div>
          </>
        ) : (
          <>
            <XCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="text-lg font-black tracking-tight">
                Session abandoned
              </p>
              <p className="text-sm text-muted-foreground">
                HP lost — start a new run to win it back.
              </p>
            </div>
          </>
        )}
        {/* Skippable end-of-session note (issue #67) — only a real
            server session can carry one; local runs have no row.
            Keyed on the id so the next ended run re-opens it. */}
        {view.status === "ended" && session.id !== 0 && (
          <SessionNotePrompt key={session.id} sessionId={session.id} />
        )}
        <Button
          onClick={() => void runtime.dismissEnded()}
          disabled={mirrored}
          className="h-11 rounded-2xl bg-primary px-8 font-bold text-primary-foreground"
        >
          {mirrored ? "Reconnect to dismiss" : "Close"}
        </Button>
      </div>
    )

  const controlsBlock = running &&
    view.status !== "ended" &&
    view.status !== "abandoned" && (
      <SessionControls
        view={view}
        busy={busy !== null || mirrored}
        onPause={() => void runtime.pause()}
        onResume={() => void runtime.resume()}
        onAdvance={() => void runtime.advance()}
        onStop={() => setStopConfirmOpen(true)}
        onDone={() => void runtime.done()}
      />
    )

  return (
    <>
      <ConfirmationModal
        open={stopConfirmOpen}
        onOpenChange={setStopConfirmOpen}
        onConfirm={handleStop}
        title={
          session?.mode === "speedrun"
            ? "Give up the run?"
            : view && view.focusDone === 0 && session?.mode !== "stopwatch"
              ? "Abandon session?"
              : "End session?"
        }
        description={
          session?.mode === "speedrun"
            ? // Only a beat-best run chases a record — time-boxed has none.
              session.speedrun?.type === "beat_best"
              ? "Giving up counts as an abandon — HP is lost and the record stands."
              : "Giving up counts as an abandon — HP is lost."
            : view && view.focusDone === 0 && session?.mode !== "stopwatch"
              ? "No focus phase completed yet — stopping now costs HP."
              : session?.mode === "stopwatch"
                ? "The stopwatch ends here — no HP cost."
                : "Completed focus phases keep their earned XP and gold."
        }
        confirmText={
          session?.mode === "speedrun"
            ? "Give up (−HP)"
            : view && view.focusDone === 0 && session?.mode !== "stopwatch"
              ? "Abandon (−HP)"
              : "End session"
        }
        variant={
          session?.mode === "speedrun" ||
          (view !== null &&
            view.focusDone === 0 &&
            session?.mode !== "stopwatch")
            ? "destructive"
            : "default"
        }
        isLoading={busy !== null}
        contentClassName={immersive ? "z-[120]" : undefined}
      />

      <SessionSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={handleSettingsChange}
      />

      {/* Immersive mode — distraction-free overlay */}
      {immersive &&
        running &&
        view.status !== "ended" &&
        view.status !== "abandoned" && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background">
            {ringBlock}
            <SessionControls
              view={view}
              busy={busy !== null || mirrored}
              compact
              onPause={() => void runtime.pause()}
              onResume={() => void runtime.resume()}
              onAdvance={() => void runtime.advance()}
              onStop={() => setStopConfirmOpen(true)}
              onDone={() => void runtime.done()}
            />
            <button
              onClick={exitImmersive}
              className="absolute top-6 right-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
            >
              <Minimize2 className="h-4 w-4" /> Exit immersive
            </button>
          </div>
        )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 flex-col gap-8 bg-background/20 p-4 backdrop-blur-3xl md:p-8 lg:p-12"
      >
        <header className="space-y-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
          >
            {isLocal ? "Local run" : "Gamified focus"}
          </Badge>
          <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
            Focus
          </h1>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-72 w-72 animate-pulse rounded-full bg-white/5" />
          </div>
        ) : !running ? (
          <div className="flex flex-1 items-start justify-center pt-8">
            <SessionSetup
              settings={settings}
              onChange={handleSettingsChange}
              onStart={() => void handleStart()}
              onOpenSettings={() => setSettingsOpen(true)}
              busy={busy === "start"}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
            <div className="flex flex-col items-center gap-5">
              {ringBlock}
              <CycleDots session={session} />
              {view.status === "running" || view.status === "paused" ? (
                <button
                  onClick={() => {
                    setImmersive(true)
                    void document.documentElement
                      .requestFullscreen?.()
                      .catch(() => {})
                  }}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-white/10 hover:text-foreground"
                >
                  <Maximize2 className="h-4 w-4" /> Immersive
                </button>
              ) : null}
            </div>

            <div className="flex w-full max-w-md flex-col items-center gap-6 lg:pt-10">
              {chipsBlock}
              {endedBlock}
              {controlsBlock}
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}
