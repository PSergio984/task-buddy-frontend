import { useTasks } from "@/hooks/useTasks"
import type { DayTimelineView } from "@/lib/timeline"
import { cn } from "@/lib/utils"

/** Tick every 6h — sparse enough for small widths. */
const TICK_HOURS = [0, 6, 12, 18, 24]

const LANE_HEIGHT = 40
const LANE_GAP = 8

interface DayTimelineProps {
  readonly timeline: DayTimelineView
}

function phaseTone(kind: string, status: string): string {
  if (kind === "break") return "bg-sky-400/30"
  if (status === "abandoned" || status === "skipped") return "bg-white/10"
  return "bg-primary/60"
}

/**
 * The merged day view's time axis: focus sessions as proportional blocks
 * (stacked into lanes when they overlap), ledger events as point markers —
 * all on the UTC day axis the backend buckets by.
 */
export function DayTimeline({ timeline }: DayTimelineProps) {
  const { data: tasks = [] } = useTasks()
  const taskTitle = (id: number) =>
    tasks.find((t) => t.id === id)?.title ?? null

  const axisHeight = timeline.laneCount * (LANE_HEIGHT + LANE_GAP)
  const hasBlocks = timeline.blocks.length > 0
  const hasMarkers = timeline.markers.length > 0

  return (
    <div className="space-y-4">
      {/* Axis */}
      <div className="relative">
        {/* Hour gridlines + labels */}
        <div
          className="relative overflow-hidden"
          style={{ height: axisHeight + 52 }}
          role="presentation"
        >
          {TICK_HOURS.map((h) => (
            <div
              key={h}
              className="absolute top-0 border-l border-white/10"
              style={{
                left: `${(h / 24) * 100}%`,
                height: axisHeight + 28,
              }}
            >
              <span
                className={cn(
                  "absolute top-full pt-1 text-[10px] font-bold text-muted-foreground tabular-nums",
                  h === 0
                    ? "translate-x-0"
                    : h === 24
                      ? "-translate-x-full"
                      : "-translate-x-1/2"
                )}
              >
                {h.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {/* Session blocks */}
          {timeline.blocks.map((block) => (
            <div
              key={block.id}
              role="img"
              aria-label={`${block.label}: ${block.startLabel}–${block.endLabel} UTC (${block.durationLabel})`}
              title={`${block.label} · ${block.startLabel}–${block.endLabel} UTC · ${block.durationLabel}`}
              className={cn(
                "group absolute overflow-hidden rounded-xl border text-[10px] font-bold",
                block.status === "abandoned"
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-primary/30 bg-primary/15"
              )}
              style={{
                left: `${block.startFrac * 100}%`,
                width: `${block.widthFrac * 100}%`,
                top: block.lane * (LANE_HEIGHT + LANE_GAP),
                height: LANE_HEIGHT,
              }}
            >
              {/* Phase sub-spans */}
              {block.phases.map((phase) => (
                <div
                  key={phase.seq}
                  className={cn(
                    "absolute inset-y-0",
                    phaseTone(phase.kind, phase.status)
                  )}
                  style={{
                    left: `${phase.startFrac * 100}%`,
                    width: `${phase.widthFrac * 100}%`,
                  }}
                />
              ))}
              <span className="absolute inset-x-2 top-1 truncate text-foreground/80">
                {block.label}
              </span>
              <span className="absolute inset-x-2 bottom-1 text-[9px] font-bold tracking-widest text-muted-foreground uppercase tabular-nums">
                {block.startLabel}–{block.endLabel}
              </span>
            </div>
          ))}

          {/* Point markers */}
          <div
            className="absolute inset-x-0"
            style={{ top: axisHeight + 8, height: 16 }}
          >
            {timeline.markers.map((marker) => (
              <div
                key={marker.id}
                role="img"
                aria-label={`${marker.label} at ${marker.timeLabel} UTC`}
                title={`${marker.timeLabel} UTC · ${marker.label}`}
                className={cn(
                  "absolute h-2.5 w-2.5 rounded-full",
                  // Edge-aware translate (same trick as the tick labels): a
                  // centered dot at frac 0 or 1 would lose half its width
                  // to the container's overflow clip.
                  marker.frac === 0
                    ? "translate-x-0"
                    : marker.frac === 1
                      ? "-translate-x-full"
                      : "-translate-x-1/2",
                  marker.scoreLabel !== null && marker.scoreLabel.includes("−")
                    ? "bg-destructive"
                    : marker.scoreLabel !== null
                      ? "bg-amber-400"
                      : "bg-muted-foreground/60"
                )}
                style={{ left: `${marker.frac * 100}%`, top: 4 }}
              />
            ))}
          </div>
        </div>
      </div>

      {!hasBlocks && !hasMarkers && (
        <p className="text-sm text-muted-foreground">
          Nothing scored this day — run a focus session or click a habit.
        </p>
      )}

      {/* Legend / accessible list of the same data */}
      {(hasBlocks || hasMarkers) && (
        <ul className="space-y-1.5">
          {timeline.blocks.map((block) => (
            <li
              key={`s-${block.id}`}
              className="flex items-center gap-2 text-xs text-foreground/80"
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm bg-primary/60" />
              <span className="min-w-0 truncate font-bold">
                {block.label}
                {block.taskId !== null &&
                  taskTitle(block.taskId) !== null &&
                  ` · ${taskTitle(block.taskId)}`}
              </span>
              <span className="ml-auto shrink-0 text-[10px] font-bold tracking-widest text-muted-foreground tabular-nums">
                {block.startLabel}–{block.endLabel} · {block.durationLabel}
              </span>
            </li>
          ))}
          {timeline.markers.map((marker) => (
            <li
              key={`m-${marker.id}`}
              className="flex items-center gap-2 text-xs text-foreground/70"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/60" />
              <span className="min-w-0 truncate">{marker.label}</span>
              {marker.scoreLabel !== null && (
                <span className="shrink-0 text-[10px] font-black tracking-wider text-amber-400">
                  {marker.scoreLabel}
                </span>
              )}
              <span className="ml-auto shrink-0 text-[10px] font-bold tracking-widest text-muted-foreground tabular-nums">
                {marker.timeLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
