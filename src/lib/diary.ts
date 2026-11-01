/**
 * Diary/timeline day helpers (pure, no React).
 *
 * The backend buckets diary entries, timeline sessions and ledger markers by
 * the UTC calendar day (app/api/routers/game.py::_day_window). The UI
 * therefore navigates UtcDay strings ("YYYY-MM-DD") — never local dates — and
 * says so on the axis, rather than silently shifting a user's day boundary.
 */

import { format } from "date-fns"

/** A UTC calendar day, "YYYY-MM-DD". */
export type UtcDay = string

const DAY_MS = 86_400_000

export function todayUtcDay(): UtcDay {
  return new Date().toISOString().slice(0, 10)
}

/**
 * A Date whose LOCAL components match the UTC day — for widgets that render
 * in local time (calendar pickers, date-fns format). `format()` on the
 * result shows the intended UTC day.
 */
export function utcDayToLocalDate(day: UtcDay): Date {
  const [y, m, d] = day.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** The UtcDay the user picked on a local-time-rendered calendar. */
export function localDateToUtcDay(date: Date): UtcDay {
  return format(date, "yyyy-MM-dd")
}

export function addUtcDays(day: UtcDay, n: number): UtcDay {
  const utcMs = Date.parse(`${day}T00:00:00Z`) + n * DAY_MS
  return new Date(utcMs).toISOString().slice(0, 10)
}

/** Short label for the navigator, e.g. "Sat, Nov 1". */
export function utcDayLabel(day: UtcDay): string {
  return format(utcDayToLocalDate(day), "EEE, MMM d")
}

/** "14:32" — HH:mm on the UTC axis (the same axis the backend buckets on). */
export function utcTimeLabel(epochMs: number): string {
  const d = new Date(epochMs)
  const hh = d.getUTCHours().toString().padStart(2, "0")
  const mm = d.getUTCMinutes().toString().padStart(2, "0")
  return `${hh}:${mm}`
}

const RETENTION_DAYS: Record<string, number> = { "90d": 90, "1y": 365 }

/**
 * Earliest visible UtcDay for a retention pref; null = 'forever' (no
 * horizon). Mirrors app/crud/game.py::retention_cutoff — read filter only,
 * nothing is deleted when the window shrinks.
 */
export function retentionCutoffDay(
  retention: string | null | undefined,
  today: UtcDay
): UtcDay | null {
  const days = RETENTION_DAYS[retention ?? "forever"]
  return days === undefined ? null : addUtcDays(today, -days)
}

export const RETENTION_OPTIONS: ReadonlyArray<{
  value: "90d" | "1y" | "forever"
  label: string
}> = [
  { value: "90d", label: "90 days" },
  { value: "1y", label: "1 year" },
  { value: "forever", label: "Forever" },
]
