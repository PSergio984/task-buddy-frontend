import { useRef, useState, type KeyboardEvent } from "react"
import { RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ActivityDay, ActivityGrid, ActivityStats } from "@/lib/api"
import { utcDayLabel } from "@/lib/diary"
import { cardClass } from "@/lib/game-columns"
import { buildWeeks } from "@/lib/game-profile"
import { cn } from "@/lib/utils"

interface ActivityPanelProps {
  readonly grid: ActivityGrid | undefined
  readonly stats: ActivityStats | undefined
  readonly gridIsPending: boolean
  readonly gridIsError: boolean
  readonly statsIsPending: boolean
  readonly statsIsError: boolean
  readonly isOnline: boolean
  readonly onGridRetry: () => void
  readonly onStatsRetry: () => void
}

/** Intensity ramp indexed by tier (tier > 4 clamps to the top swatch). */
const TIER_STYLES = [
  "bg-white/5",
  "bg-emerald-950",
  "bg-emerald-800",
  "bg-emerald-600",
  "bg-emerald-400",
] as const

function tierClass(tier: number): string {
  return TIER_STYLES[Math.min(tier, TIER_STYLES.length - 1)]
}

function hoursLabel(hours: number): string {
  return `${hours.toFixed(1)}h`
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-3">
      <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black text-foreground">{value}</p>
    </div>
  )
}

/** Arrow-key deltas over the flat day list — weeks are 7-day columns. */
const ARROW_DELTAS: Record<string, number> = {
  ArrowLeft: -7,
  ArrowRight: 7,
  ArrowUp: -1,
  ArrowDown: 1,
}

function DayCell({
  day,
  tabIndex,
  onFocus,
  onKeyDown,
  cellRef,
}: {
  day: ActivityDay
  tabIndex: number
  onFocus: () => void
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void
  cellRef: (el: HTMLButtonElement | null) => void
}) {
  // Server-computed intensity bucket — no client mirror of tier_for.
  const tier = day.tier
  const date = utcDayLabel(day.date)
  const eventEntries = Object.entries(day.events)
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          ref={cellRef}
          tabIndex={tabIndex}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          aria-label={`${date}: ${Math.round(day.score)} pts, ${Math.round(day.focus_minutes)}m focus`}
          className={cn(
            "h-3.5 w-3.5 rounded-[4px] border border-white/5 transition-transform hover:scale-125",
            tierClass(tier)
          )}
        />
      </TooltipTrigger>
      <TooltipContent className="rounded-xl border-white/10 bg-background/95 px-3 py-2">
        <p className="text-xs font-black text-foreground">
          {date} — {Math.round(day.score)} pts
        </p>
        <p className="text-[10px] font-bold text-muted-foreground">
          {Math.round(day.focus_minutes)}m focus
        </p>
        {eventEntries.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">No scored events</p>
        ) : (
          eventEntries.map(([type, count]) => (
            <p
              key={type}
              className="text-[10px] font-bold text-muted-foreground capitalize"
            >
              {type.replace(/_/g, " ")} ×{count}
            </p>
          ))
        )}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * One section's loading/offline contract (same rules the panel had as a
 * whole): pending while online → skeleton; error or offline-uncached →
 * an inline retry card; anything else with no data renders nothing.
 */
function SectionFallback({
  isPending,
  isError,
  isOnline,
  onlineMessage,
  offlineMessage,
  skeletonClass,
  onRetry,
}: {
  isPending: boolean
  isError: boolean
  isOnline: boolean
  onlineMessage: string
  offlineMessage: string
  skeletonClass: string
  onRetry: () => void
}) {
  if (isPending && isOnline) {
    return (
      <div
        className={cn("animate-pulse rounded-3xl bg-white/5", skeletonClass)}
      />
    )
  }
  if (isError || !isOnline) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
        <p className="text-sm text-muted-foreground">
          {isOnline ? onlineMessage : offlineMessage}
        </p>
        <Button
          variant="outline"
          onClick={onRetry}
          className="h-9 gap-2 rounded-2xl border-white/15 px-4 text-xs font-bold"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </Button>
      </div>
    )
  }
  return null
}

export function ActivityPanel({
  grid,
  stats,
  gridIsPending,
  gridIsError,
  statsIsPending,
  statsIsError,
  isOnline,
  onGridRetry,
  onStatsRetry,
}: ActivityPanelProps) {
  const weeks = grid !== undefined ? buildWeeks(grid.days) : []
  // Roving tabindex over the flat (chronological) day list — exactly one
  // cell is tabbable and arrows walk it: Up/Down an adjacent day,
  // Left/Right the same weekday a week over. Weeks are column-major and
  // each column is exactly 7 slots, so ±7 always lands on the same
  // weekday of the adjacent week (out-of-range = that day isn't in the
  // window → stay put).
  const days: ActivityDay[] = []
  const dayIndex = new Map<string, number>()
  for (const week of weeks)
    for (const d of week)
      if (d !== null) {
        dayIndex.set(d.date, days.length)
        days.push(d)
      }
  const [focusIndex, setFocusIndex] = useState(0)
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([])
  const rovingIndex = focusIndex < days.length ? focusIndex : 0

  const moveFocus = (index: number, delta: number) => {
    const next = index + delta
    if (next < 0 || next >= days.length) return
    setFocusIndex(next)
    // DOM focus opens the cell's tooltip via the Radix trigger.
    cellRefs.current[next]?.focus()
  }

  const onDayKeyDown =
    (index: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
      const delta = ARROW_DELTAS[e.key]
      if (delta === undefined) return
      e.preventDefault()
      moveFocus(index, delta)
    }

  return (
    <div className="space-y-8">
      {stats !== undefined ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatChip
            label="Avg / day"
            value={hoursLabel(stats.avg_hours_per_day)}
          />
          <StatChip label="Total focus" value={hoursLabel(stats.total_hours)} />
          <StatChip label="Streak" value={`${stats.current_streak}d`} />
          <StatChip label="Longest" value={`${stats.longest_streak}d`} />
          <StatChip
            label="Best day"
            value={
              stats.best_day !== null
                ? `${utcDayLabel(stats.best_day.date)} · ${Math.round(stats.best_day.score)}`
                : "—"
            }
          />
          <StatChip
            label="This week"
            value={`${Math.round(stats.weekly_total)} pts`}
          />
        </div>
      ) : (
        <SectionFallback
          isPending={statsIsPending}
          isError={statsIsError}
          isOnline={isOnline}
          onlineMessage="Couldn't load your activity stats."
          offlineMessage="You're offline and your activity stats aren't in the local cache."
          skeletonClass="h-20"
          onRetry={onStatsRetry}
        />
      )}

      {grid !== undefined ? (
        <section className={cardClass} aria-labelledby="activity-grid-heading">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2
              id="activity-grid-heading"
              className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
            >
              Activity
            </h2>
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              {utcDayLabel(grid.start)} – {utcDayLabel(grid.end)} · UTC
            </span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex w-max gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) =>
                    day === null ? (
                      <div
                        key={`blank-${wi}-${di}`}
                        className="h-3.5 w-3.5"
                        aria-hidden
                      />
                    ) : (
                      <DayCell
                        key={day.date}
                        day={day}
                        tabIndex={
                          dayIndex.get(day.date) === rovingIndex ? 0 : -1
                        }
                        onFocus={() =>
                          setFocusIndex(dayIndex.get(day.date) ?? 0)
                        }
                        onKeyDown={onDayKeyDown(dayIndex.get(day.date) ?? 0)}
                        cellRef={(el) => {
                          const i = dayIndex.get(day.date)
                          if (i !== undefined) cellRefs.current[i] = el
                        }}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-1.5">
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
              Less
            </span>
            {TIER_STYLES.map((cls) => (
              <span
                key={cls}
                className={cn(
                  "h-3 w-3 rounded-[4px] border border-white/5",
                  cls
                )}
              />
            ))}
            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
              More
            </span>
          </div>
        </section>
      ) : (
        <SectionFallback
          isPending={gridIsPending}
          isError={gridIsError}
          isOnline={isOnline}
          onlineMessage="Couldn't load the activity grid."
          offlineMessage="You're offline and the activity grid isn't in the local cache."
          skeletonClass="h-40"
          onRetry={onGridRetry}
        />
      )}
    </div>
  )
}
