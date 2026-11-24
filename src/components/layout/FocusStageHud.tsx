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
      className={cn(
        "focus-hud mb-9 flex flex-col items-center select-none",
        className
      )}
      data-testid="focus-stage-hud"
    >
      {/* Stage Label */}
      <div className="hud-meta-label mb-3 font-mono text-[11px] tracking-[0.1em] text-[var(--gray-400)] uppercase">
        {sessionLabel}
      </div>

      {/* Hero Time Display */}
      <div
        id="timer-display"
        className="time-hero mb-1.5 font-sans text-[54px] leading-none font-bold tracking-[-0.04em] text-[var(--ink)]"
      >
        {timeRemaining}
      </div>

      {/* Meta context label */}
      <div className="time-subline mb-5 font-mono text-[11.5px] text-[var(--gray-400)]">
        {metaLabel}
      </div>

      {/* Action buttons */}
      <div className="btn-action-row flex items-center gap-2.5">
        <button
          type="button"
          onClick={onTogglePlay}
          className="btn-primary-pill text-bg flex cursor-pointer items-center gap-2 rounded-full bg-[var(--ink)] bg-ink px-5 py-2 font-sans text-[13px] font-semibold text-[var(--bg)] shadow-xs transition-all hover:opacity-90 active:scale-95"
          aria-label={isPlaying ? "Pause Focus" : "Start Focus"}
        >
          <span>{isPlaying ? "⏸" : "▶"}</span>
          <span>{isPlaying ? "PAUSE" : "START FOCUS"}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="btn-secondary-pill cursor-pointer rounded-full border border-[var(--gray-200)] border-gray-200 bg-[var(--gray-50)] px-3 py-1.5 font-mono text-xs text-[var(--gray-500)] transition-all hover:border-[var(--gray-300)] hover:text-[var(--ink)]"
          aria-label="Reset Timer"
        >
          RESET
        </button>
      </div>
    </div>
  )
}
