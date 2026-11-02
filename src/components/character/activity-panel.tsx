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
import { activityTier, buildWeeks } from "@/lib/game-profile"
import { cn } from "@/lib/utils"

interface ActivityPanelProps {
  readonly grid: ActivityGrid | undefined
  readonly stats: ActivityStats | undefined
  readonly isPending: boolean
  readonly isError: boolean
  readonly isOnline: boolean
  readonly onRetry: () => void
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

function DayCell({
  day,
  tierThresholds,
}: {
  day: ActivityDay
  tierThresholds: number[]
}) {
  const tier = activityTier(day.score, tierThresholds)
  const date = utcDayLabel(day.date)
  const eventEntries = Object.entries(day.events)
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
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

export function ActivityPanel({
  grid,
  stats,
  isPending,
  isError,
  isOnline,
  onRetry,
}: ActivityPanelProps) {
  // Same loading/offline contract as the habits column.
  if (isPending && isOnline) {
    return (
      <div className="space-y-3">
        <div className="h-20 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
      </div>
    )
  }
  const missing = grid === undefined && stats === undefined
  if ((isError || !isOnline) && missing) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
        {!isOnline && <WifiOff className="h-6 w-6 text-amber-400" />}
        <p className="text-sm text-muted-foreground">
          {isOnline
            ? "Couldn't load your activity."
            : "You're offline and your activity isn't in the local cache."}
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

  const weeks = grid !== undefined ? buildWeeks(grid.days) : []

  return (
    <div className="space-y-8">
      {stats !== undefined && (
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
      )}

      {grid !== undefined && (
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
            <div
              className="flex w-max gap-[3px]"
              role="grid"
              aria-label="Contribution grid"
            >
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
                        tierThresholds={grid.tier_thresholds}
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
      )}
    </div>
  )
}
