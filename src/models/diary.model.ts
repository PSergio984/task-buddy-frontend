import type {
  DiaryEntry,
  DiaryEntryInput,
  DiaryEntryPatch,
  RetentionPreference,
} from "@/lib/api"
import {
  todayUtcDay,
  utcDayToLocalDate,
  localDateToUtcDay,
  addUtcDays,
  utcDayLabel,
  utcTimeLabel,
  retentionCutoffDay,
  RETENTION_OPTIONS,
  type UtcDay,
} from "@/lib/diary"
import { buildDayTimeline, type DayTimelineView } from "@/lib/timeline"

/**
 * Pure domain model for Diary and Timeline.
 * Zero React/DOM hooks or JSX.
 */

/** PATCH fields are strings-or-null: trim strings, preserve null clears. */
export const trimPatch = (patch: DiaryEntryPatch): DiaryEntryPatch =>
  Object.fromEntries(
    Object.entries(patch).map(([k, v]) => [
      k,
      typeof v === "string" ? v.trim() : v,
    ])
  ) as DiaryEntryPatch

export interface DiaryDisabledReasonParams {
  readonly isOnline: boolean
  readonly beyondHorizon: boolean
  readonly cutoff: UtcDay | null
  readonly futureDay: boolean
  readonly retention: string
}

export function getDiaryDisabledReason({
  isOnline,
  beyondHorizon,
  cutoff,
  futureDay,
  retention,
}: DiaryDisabledReasonParams): string | null {
  if (beyondHorizon && cutoff !== null) {
    return `Entries before ${utcDayLabel(cutoff)} are hidden by your ${
      retention === "90d" ? "90-day" : "1-year"
    } retention setting.`
  }
  if (futureDay) {
    return "You can't write entries for a day that hasn't started yet (UTC)."
  }
  if (!isOnline) {
    return "You're offline — entries can be read from cache but not changed."
  }
  return null
}

export {
  todayUtcDay,
  utcDayToLocalDate,
  localDateToUtcDay,
  addUtcDays,
  utcDayLabel,
  utcTimeLabel,
  retentionCutoffDay,
  RETENTION_OPTIONS,
  buildDayTimeline,
}

export type {
  DiaryEntry,
  DiaryEntryInput,
  DiaryEntryPatch,
  RetentionPreference,
  UtcDay,
  DayTimelineView,
}
