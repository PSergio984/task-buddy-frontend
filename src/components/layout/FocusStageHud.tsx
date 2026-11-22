import React from "react"
import { cn } from "@/lib/utils"

export interface FocusStageHudProps {
  timeRemaining?: string
  isPlaying?: boolean
  onTogglePlay?: () => void
  onReset?: () => void
  sessionLabel?: string
  metaLabel?: string
  className?: string
}

export function FocusStageHud({
  timeRemaining = "50:00",
  isPlaying = false,
  onTogglePlay,
  onReset,
  sessionLabel = "01 — CURRENT SESSION · 1/4",
  metaLabel = "ENGINEERING // TASK_BUDDY_L2",
  className,
}: FocusStageHudProps) {
  return (
    <div
      className={cn("focus-hud flex flex-col items-center mb-9 select-none", className)}
      data-testid="focus-stage-hud"
    >
      {/* Stage Label */}
      <div className="hud-meta-label font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--gray-400)] mb-3">
        {sessionLabel}
      </div>

      {/* Hero Time Display */}
      <div
        id="timer-display"
        className="time-hero font-sans font-bold text-[54px] tracking-[-0.04em] leading-none text-[var(--ink)] mb-1.5"
      >
        {timeRemaining}
      </div>

      {/* Meta context label */}
      <div className="time-subline font-mono text-[11.5px] text-[var(--gray-400)] mb-5">
        {metaLabel}
      </div>

      {/* Action buttons */}
      <div className="btn-action-row flex items-center gap-2.5">
        <button
          type="button"
          onClick={onTogglePlay}
          className="btn-primary-pill bg-ink bg-[var(--ink)] text-bg text-[var(--bg)] font-sans text-[13px] font-semibold px-5 py-2 rounded-full cursor-pointer flex items-center gap-2 shadow-xs transition-all hover:opacity-90 active:scale-95"
          aria-label={isPlaying ? "Pause Focus" : "Start Focus"}
        >
          <span>{isPlaying ? "⏸" : "▶"}</span>
          <span>{isPlaying ? "PAUSE" : "START FOCUS"}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn-secondary-pill bg-[var(--gray-50)] border border-gray-200 border-[var(--gray-200)] text-[var(--gray-500)] hover:text-[var(--ink)] hover:border-[var(--gray-300)] font-mono text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer"
          aria-label="Reset Timer"
        >
          RESET
        </button>
      </div>
    </div>
  )
}
