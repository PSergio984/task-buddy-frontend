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
  const h = Math.floor(total / 3600)
  const m = Math.round((total % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${total}s`
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
  const serverNowMs = ms(res.server_time) ?? dayEndMs
  const frac = (t: number) => clampFrac((t - dayStartMs) / span)

  const sessions = res.sessions
    .map((s) => {
      const startMs = ms(s.started_at) ?? dayStartMs
      // A still-running block closes on the response's server clock.
      const endMs = ms(s.ended_at) ?? serverNowMs
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
        const pStart = ms(p.started_at) ?? startMs
        const pEnd = ms(p.ended_at) ?? endMs
        return {
          seq: p.seq,
          kind: p.kind,
          status: p.status,
          startFrac: clampFrac((pStart - startMs) / blockSpan),
          widthFrac: Math.max(0.02, (pEnd - pStart) / blockSpan),
        }
      })
    return {
      id: s.id,
      label: blockLabel(s.mode, s.activity_label),
      mode: s.mode,
      status: s.status,
      taskId: s.task_id,
      startMs,
      endMs,
      startFrac: frac(startMs),
      widthFrac: Math.max(MIN_WIDTH_FRAC, (endMs - startMs) / span),
      lane,
      startLabel: utcTimeLabel(startMs),
      endLabel: utcTimeLabel(endMs),
      durationLabel: durationLabel((endMs - startMs) / 1000),
      phases,
    }
  })

  const markers: TimelineMarkerItem[] = res.markers
    .map((e) => {
      const tsMs = ms(e.ts) ?? dayStartMs
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
