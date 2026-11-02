/**
 * Habits & dailies column helpers (pure, no React).
 *
 * Drift thresholds mirror the backend's drift math (delta = 0.9747^value,
 * value clamped [-47.27, +21.27]): value > 0 means recent +clicks already
 * pushed the payout below neutral ("farmed"), value < 0 means the habit is
 * neglected and pays more than neutral ("fresh").
 */
import type {
  Daily,
  DailyItem,
  DailyItemInput,
  Recurrence,
  SessionDifficulty,
} from "@/lib/api"

/** Mirrors the backend's field bound (HabitIn/DailyIn.title max_length). */
export const TITLE_MAX = 200
/** Checklist bounds — DailyIn.items ≤30 rows, DailyItemIn.title ≤200. */
export const ITEMS_MAX = 30
export const ITEM_TITLE_MAX = 200

export const cardClass = "rounded-3xl border border-white/10 bg-white/5 p-5"
export const fieldClass =
  "rounded-2xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"

export const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: SessionDifficulty
  label: string
}> = [
  { value: "trivial", label: "Trivial" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
]

export type HabitDrift = "fresh" | "steady" | "farmed"

export function habitDrift(value: number): HabitDrift {
  // A single easy click moves value by ~1 — sub-1 drift is still neutral.
  if (value >= 1) return "farmed"
  if (value <= -1) return "fresh"
  return "steady"
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** One-line summary of a stored recurrence blob; unknown shapes → "Custom". */
export function recurrenceLabel(recurrence: Recurrence | undefined): string {
  switch (recurrence?.kind) {
    case "daily":
      return "Every day"
    case "weekdays": {
      const days = recurrence.days
      if (days.length === 0) return "Custom"
      if (days.length >= 7) return "Every day"
      return days.map((d) => WEEKDAY_SHORT[d] ?? "?").join(" · ")
    }
    case "every_n_days":
      return recurrence.interval <= 1
        ? "Every day"
        : `Every ${recurrence.interval} days`
    case "times_per_week":
      return `${recurrence.count}× per week`
    default:
      return "Custom"
  }
}

/** Bell text for a row: up to two times shown, then a "+n" remainder. */
export function reminderLabel(times: string[]): string {
  if (times.length <= 2) return times.join(" · ")
  return `${times.slice(0, 2).join(" · ")} +${times.length - 2}`
}

/** "x/y" proportional completion for a daily's sub-checklist. */
export function itemsProgress(daily: Daily): { done: number; total: number } {
  return {
    done: daily.items.filter((i) => i.done_today).length,
    total: daily.items.length,
  }
}

/** Checklist textarea → item inputs: one item per non-blank line, in order. */
export function parseItemLines(text: string): DailyItemInput[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((title) => ({ title }))
}

/** Checklist → textarea contents for the edit form. */
export function itemLines(items: DailyItem[]): string {
  return items.map((i) => i.title).join("\n")
}

/** Signed net-counter text: +12 / 0 / −3 (minus sign, not a hyphen). */
export function counterLabel(counter: number): string {
  if (counter > 0) return `+${counter}`
  if (counter < 0) return `−${Math.abs(counter)}`
  return "0"
}
