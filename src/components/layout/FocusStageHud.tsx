import React from "react"
import { cn } from "@/lib/utils"

export interface FocusStageHudProps {
  timeRemaining?: string
  isPlaying?: boolean
  playLabel?: string
  onTogglePlay?: () => void
  onReset?: () => void
  sessionLabel?: string
  metaLabel?: string
  disabled?: boolean
  stopLabel?: string
  className?: string
}

export function FocusStageHud({
  timeRemaining = "50:00",
  isPlaying = false,
  playLabel,
  onTogglePlay,
  onReset,
  sessionLabel = "01 — CURRENT SESSION · 1/4",
  metaLabel,
  disabled = false,
  stopLabel = "RESET",
  className,
}: FocusStageHudProps) {
  const defaultPlayLabel = isPlaying ? "PAUSE" : "START FOCUS"
  const resolvedPlayLabel = playLabel ?? defaultPlayLabel

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
      {metaLabel && (
        <div className="time-subline mb-5 font-mono text-[11.5px] text-[var(--gray-400)]">
          {metaLabel}
        </div>
      )}

      {/* Action buttons */}
      <div className="btn-action-row flex items-center gap-2.5">
        <button
          type="button"
          onClick={onTogglePlay}
          disabled={disabled}
          className="btn-primary-pill flex cursor-pointer items-center gap-2 rounded-full bg-[var(--ink)] bg-ink px-5 py-2 font-sans text-[13px] font-semibold text-[var(--bg)] text-bg shadow-xs transition-all hover:opacity-90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          aria-label={resolvedPlayLabel}
        >
          <span>{isPlaying ? "⏸" : "▶"}</span>
          <span>{resolvedPlayLabel}</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="btn-secondary-pill cursor-pointer rounded-full border border-[var(--gray-200)] border-gray-200 bg-[var(--gray-50)] px-3 py-1.5 font-mono text-xs text-[var(--gray-500)] transition-all hover:border-[var(--gray-300)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-50"
          aria-label="Reset Timer"
        >
          {stopLabel}
        </button>
      </div>
    </div>
  )
}
