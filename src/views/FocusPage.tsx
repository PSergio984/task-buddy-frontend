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
import { FocusStageHud } from "@/components/layout/FocusStageHud"
import { useFocusViewModel } from "@/viewmodels/useFocusViewModel"
import { formatClock, type SessionView } from "@/models/focus.model"
import type { FocusSession } from "@/models/focus.model"
import { cn } from "@/lib/utils"

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

function SessionControls({
  view,
  busy,
  compact,
  isStopwatch,
  isSpeedrun,
  isAbandon,
  stopLabel,
  onPause,
  onResume,
  onAdvance,
  onStop,
  onDone,
}: Readonly<{
  view: SessionView
  busy: boolean
  compact?: boolean
  isStopwatch: boolean
  isSpeedrun: boolean
  isAbandon: boolean
  stopLabel: string
  onPause: () => void
  onResume: () => void
  onAdvance: () => void
  onStop: () => void
  onDone: () => void
}>) {
  const live = view.live
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
  const vm = useFocusViewModel()

  const ringBlock = vm.running && vm.view && (
    <div className="flex flex-col items-center gap-3">
      <TimerRing
        progress={vm.view.progress}
        clockText={formatClock(vm.view.clockSeconds)}
        subLabel={vm.view.kindLabel}
        tone={vm.ringTone}
      />
      {vm.isLocal && (
        <Badge
          variant="outline"
          className="gap-1 rounded-full border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black tracking-widest text-amber-400 uppercase"
        >
          <WifiOff className="h-3 w-3" /> Offline · syncs later
        </Badge>
      )}
      {vm.mirrored && (
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

  const hudBlock = vm.running &&
    vm.view &&
    vm.view.status !== "ended" &&
    vm.view.status !== "abandoned" && (
      <FocusStageHud
        timeRemaining={formatClock(vm.view.clockSeconds)}
        isPlaying={vm.view.status === "running"}
        sessionLabel={vm.view.kindLabel}
        metaLabel={
          vm.linkedTask?.title
            ? `TASK // ${vm.linkedTask.title}`
            : vm.linkedTag
              ? `TAG // ${vm.linkedTag.name}`
              : undefined
        }
        onTogglePlay={() => {
          if (vm.view?.status === "running") {
            void vm.pause()
          } else if (vm.view?.status === "paused") {
            void vm.resume()
          }
        }}
        onReset={vm.openStopConfirm}
      />
    )

  const chipsBlock = vm.running &&
    (vm.linkedTask !== null || vm.linkedTag !== null) && (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {vm.linkedTask && (
          <Badge className="rounded-full bg-primary/15 px-4 py-1 text-xs font-bold text-primary">
            📌 {vm.linkedTask.title}
          </Badge>
        )}
        {vm.linkedTag && (
          <Badge
            variant="secondary"
            className="rounded-full bg-accent/15 px-4 py-1 text-xs font-bold text-accent"
          >
            #{vm.linkedTag.name}
          </Badge>
        )}
      </div>
    )

  const endedBlock = vm.running &&
    vm.session &&
    vm.view &&
    (vm.view.status === "ended" || vm.view.status === "abandoned") && (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        {vm.speedrunEnd !== null ? (
          <>
            {vm.speedrunEnd.ok ? (
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
            <div>
              <p className="text-lg font-black tracking-tight">
                {vm.speedrunEnd.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {vm.speedrunEnd.description}
              </p>
            </div>
          </>
        ) : vm.view.status === "ended" ? (
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
        {/* Skippable end-of-session note (issue #67) */}
        {vm.view.status === "ended" && vm.session.id !== 0 && (
          <SessionNotePrompt key={vm.session.id} sessionId={vm.session.id} />
        )}
        <Button
          onClick={() => void vm.dismissEnded()}
          disabled={vm.mirrored}
          className="h-11 rounded-2xl bg-primary px-8 font-bold text-primary-foreground"
        >
          {vm.mirrored ? "Reconnect to dismiss" : "Close"}
        </Button>
      </div>
    )

  const controlsBlock = vm.running &&
    vm.view &&
    vm.view.status !== "ended" &&
    vm.view.status !== "abandoned" && (
      <SessionControls
        view={vm.view}
        busy={vm.busy !== null || vm.mirrored}
        isStopwatch={vm.isStopwatch}
        isSpeedrun={vm.isSpeedrun}
        isAbandon={vm.isAbandon}
        stopLabel={vm.stopLabel}
        onPause={() => void vm.pause()}
        onResume={() => void vm.resume()}
        onAdvance={() => void vm.advance()}
        onStop={vm.openStopConfirm}
        onDone={() => void vm.done()}
      />
    )

  return (
    <>
      <ConfirmationModal
        open={vm.stopConfirmOpen}
        onOpenChange={vm.setStopConfirmOpen}
        onConfirm={vm.stop}
        title={vm.stopModalTitle}
        description={vm.stopModalDescription}
        confirmText={vm.stopModalConfirmText}
        variant={vm.stopModalVariant}
        isLoading={vm.busy !== null}
        contentClassName={vm.immersive ? "z-[120]" : undefined}
      />

      <SessionSettingsSheet
        open={vm.settingsOpen}
        onOpenChange={vm.setSettingsOpen}
        settings={vm.settings}
        onChange={vm.onSettingsChange}
      />

      {/* Immersive mode — distraction-free overlay */}
      {vm.immersive &&
        vm.running &&
        vm.view &&
        vm.view.status !== "ended" &&
        vm.view.status !== "abandoned" && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background">
            {ringBlock}
            <SessionControls
              view={vm.view}
              busy={vm.busy !== null || vm.mirrored}
              compact
              isStopwatch={vm.isStopwatch}
              isSpeedrun={vm.isSpeedrun}
              isAbandon={vm.isAbandon}
              stopLabel={vm.stopLabel}
              onPause={() => void vm.pause()}
              onResume={() => void vm.resume()}
              onAdvance={() => void vm.advance()}
              onStop={vm.openStopConfirm}
              onDone={() => void vm.done()}
            />
            <button
              onClick={vm.exitImmersive}
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
            {vm.isLocal ? "Local run" : "Gamified focus"}
          </Badge>
          <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
            Focus
          </h1>
        </header>

        {vm.isLoading ? (
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-72 w-72 animate-pulse rounded-full bg-white/5" />
          </div>
        ) : !vm.running ? (
          <div className="flex flex-1 items-start justify-center pt-8">
            <SessionSetup
              settings={vm.settings}
              onChange={vm.onSettingsChange}
              onStart={() => void vm.start()}
              onOpenSettings={vm.openSettings}
              busy={vm.busy === "start"}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-16">
            <div className="flex flex-col items-center gap-5">
              {hudBlock}
              {ringBlock}
              {vm.session && <CycleDots session={vm.session} />}
              {vm.view &&
              (vm.view.status === "running" || vm.view.status === "paused") ? (
                <button
                  onClick={vm.enterImmersive}
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
