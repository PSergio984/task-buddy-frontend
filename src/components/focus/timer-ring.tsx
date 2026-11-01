import { cn } from "@/lib/utils"

interface TimerRingProps {
  /** Ring fill fraction 0..1 (elapsed share of the phase). */
  readonly progress: number
  /** Center readout, e.g. "24:37". */
  readonly clockText: string
  /** Sub-label under the clock, e.g. "FOCUS · PHASE 1/4". */
  readonly subLabel: string
  /** Stroke accent per phase kind. */
  readonly tone?: "focus" | "break" | "stopwatch" | "idle"
  readonly className?: string
}

const R = 44
const CIRCUMFERENCE = 2 * Math.PI * R

const TONE_STROKE: Record<NonNullable<TimerRingProps["tone"]>, string> = {
  focus: "stroke-primary",
  break: "stroke-emerald-400",
  stopwatch: "stroke-amber-400",
  idle: "stroke-white/20",
}

export function TimerRing({
  progress,
  clockText,
  subLabel,
  tone = "focus",
  className,
}: TimerRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-60 w-60 md:h-72 md:w-72", className)}
      role="timer"
      aria-label={`${subLabel} ${clockText}`}
    >
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        strokeWidth="6"
        className="stroke-white/10"
      />
      <circle
        cx="50"
        cy="50"
        r={R}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
        transform="rotate(-90 50 50)"
        className={cn(
          "transition-[stroke-dashoffset] duration-500",
          TONE_STROKE[tone]
        )}
      />
      <text
        x="50"
        y="52"
        textAnchor="middle"
        className="fill-foreground font-mono text-[13px] font-black tabular-nums"
      >
        {clockText}
      </text>
      <text
        x="50"
        y="66"
        textAnchor="middle"
        className="fill-muted-foreground text-[4.5px] font-bold tracking-[0.2em] uppercase"
      >
        {subLabel}
      </text>
    </svg>
  )
}
