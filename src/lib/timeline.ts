/**
 * Timeline assembly (pure, no React) — turns a TimelineDayResponse into
 * positioned render items: focus sessions become width-true blocks on the
 * 24h UTC axis, ledger events become point markers. Overlapping sessions get
 * separate lanes via a greedy first-fit so blocks never cover each other.
 */

import type { TimelineDayResponse } from "@/lib/api"
import { ms } from "@/lib/focus-session"
import { utcTimeLabel } from "@/lib/diary"

export interface TimelinePhaseItem {
  seq: number
  kind: string
  status: string
  /** Position relative to the parent block span, 0..1. */
  startFrac: number
  widthFrac: number
}

export interface TimelineBlockItem {
  id: number
  /** activity_label, else a "Timer session"/"Stopwatch session" fallback. */
  label: string
  mode: string
  status: string
  taskId: number | null
  startMs: number
  endMs: number
  /** Position on the day axis, 0..1. */
  startFrac: number
  widthFrac: number
  /** Lane index for stacked rendering when sessions overlap. */
  lane: number
  startLabel: string
  endLabel: string
  durationLabel: string
  phases: TimelinePhaseItem[]
}

export interface TimelineMarkerItem {
  id: number
  type: string
  /** Human label, e.g. "Focus phase completed". */
  label: string
  tsMs: number
  frac: number
  timeLabel: string
  /** Scoring summary from the outcome blob, e.g. "+40 XP · +12g" / "−5 HP". */
  scoreLabel: string | null
}

export interface DayTimelineView {
  dayStartMs: number
  dayEndMs: number
  laneCount: number
  blocks: TimelineBlockItem[]
  markers: TimelineMarkerItem[]
}

const DAY_MS = 86_400_000
/** Floor so a zero-length span still shows a sliver on the axis. */
const MIN_WIDTH_FRAC = 0.004

const clampFrac = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Width fraction for a span starting at startFrac — the minimum floor is
 * capped by the room left so startFrac + width ≤ 1 always holds, even when
 * the span starts in the axis' last sliver.
 */
const spanFrac = (
  startFrac: number,
  rawFrac: number,
  minFrac: number
): number => {
  const maxFrac = Math.max(0, 1 - startFrac)
  return Math.max(Math.min(minFrac, maxFrac), Math.min(maxFrac, rawFrac))
}

/** ms() but NaN-safe — a malformed ISO falls back like a missing one. */
const msOr = (iso: string | null, fallback: number): number => {
  const v = ms(iso)
  return v !== null && Number.isFinite(v) ? v : fallback
}

/** "session_started" → "Session started". */
export function markerLabel(type: string): string {
  const words = type.replaceAll("_", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function blockLabel(mode: string, activityLabel: string | null): string {
  if (activityLabel !== null && activityLabel !== "") return activityLabel
  return mode === "stopwatch" ? "Stopwatch session" : "Focus session"
}

function durationLabel(seconds: number): string {
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return `${total}s`
  // Round to whole minutes first so 59.9m carries into the hour
  // (3599s → "1h 0m", not "60m").
  const minutes = Math.round(total / 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/**
 * "01:30 +1d" for an end at/past the UTC day edge — sessions bucket by
 * start day but can run over midnight; the block clamps at the axis edge
 * and the label stays honest about the continuation.
 */
function endLabel(endMs: number, dayStartMs: number, dayEndMs: number): string {
  const label = utcTimeLabel(endMs)
  if (endMs < dayEndMs) return label
  const days = Math.max(1, Math.floor((endMs - dayStartMs) / DAY_MS))
  return `${label} +${days}d`
}

/** Scoring summary from the marker's outcome blob; null when unscored. */
export function markerScoreLabel(
  outcome: Record<string, unknown> | null
): string | null {
  if (outcome === null || outcome.scored !== true) return null
  const parts: string[] = []
  if (typeof outcome.xp === "number" && outcome.xp > 0) {
    parts.push(`+${outcome.xp} XP`)
  }
  if (typeof outcome.gold === "number" && outcome.gold > 0) {
    parts.push(`+${Math.floor(outcome.gold)}g`)
  }
  if (typeof outcome.hp_lost === "number" && outcome.hp_lost > 0) {
    parts.push(`−${outcome.hp_lost} HP`)
  }
  return parts.length > 0 ? parts.join(" · ") : null
}

export function buildDayTimeline(res: TimelineDayResponse): DayTimelineView {
  const dayStartMs = Date.parse(`${res.date}T00:00:00Z`)
  const dayEndMs = dayStartMs + DAY_MS
  const span = dayEndMs - dayStartMs
  const serverNowMs = msOr(res.server_time, dayEndMs)
  const frac = (t: number) => clampFrac((t - dayStartMs) / span)

  const sessions = res.sessions
    .map((s) => {
      const startMs = msOr(s.started_at, dayStartMs)
      // A still-running block closes on the response's server clock.
      const endMs = msOr(s.ended_at, serverNowMs)
      return { session: s, startMs, endMs }
    })
    .sort((a, b) => a.startMs - b.startMs || a.session.id - b.session.id)

  // Greedy first-fit lanes: a session drops in the first lane whose last
  // block already ended before it starts.
  const laneEnds: number[] = []
  const blocks = sessions.map(({ session: s, startMs, endMs }) => {
    let lane = laneEnds.findIndex((end) => end <= startMs)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(endMs)
    } else {
      laneEnds[lane] = endMs
    }
    const blockSpan = Math.max(1, endMs - startMs)
    const phases: TimelinePhaseItem[] = s.phases
      .filter((p) => p.started_at !== null)
      .map((p) => {
        const pStart = msOr(p.started_at, startMs)
        const pEnd = msOr(p.ended_at, endMs)
        const startFrac = clampFrac((pStart - startMs) / blockSpan)
        return {
          seq: p.seq,
          kind: p.kind,
          status: p.status,
          startFrac,
          // An overrunning phase stops at the block's edge.
          widthFrac: spanFrac(startFrac, (pEnd - pStart) / blockSpan, 0.02),
        }
      })
    const startFrac = frac(startMs)
    return {
      id: s.id,
      label: blockLabel(s.mode, s.activity_label),
      mode: s.mode,
      status: s.status,
      taskId: s.task_id,
      startMs,
      endMs,
      startFrac,
      // Clamped at the axis edge — a session may end past UTC midnight.
      widthFrac: spanFrac(startFrac, (endMs - startMs) / span, MIN_WIDTH_FRAC),
      lane,
      startLabel: utcTimeLabel(startMs),
      endLabel: endLabel(endMs, dayStartMs, dayEndMs),
      durationLabel: durationLabel((endMs - startMs) / 1000),
      phases,
    }
  })

  const markers: TimelineMarkerItem[] = res.markers
    .map((e) => {
      const tsMs = msOr(e.ts, dayStartMs)
      return {
        id: e.id,
        type: e.type,
        label: markerLabel(e.type),
        tsMs,
        frac: frac(tsMs),
        timeLabel: utcTimeLabel(tsMs),
        scoreLabel: markerScoreLabel(e.outcome),
      }
    })
    .sort((a, b) => a.tsMs - b.tsMs || a.id - b.id)

  return { dayStartMs, dayEndMs, laneCount: laneEnds.length, blocks, markers }
}
