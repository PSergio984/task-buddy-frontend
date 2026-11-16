/**
 * Focus Domain Model
 * Encapsulates entity contracts, session view derivations, and API communication for focus sessions.
 */
import {
  focusSessionsApi,
  type FocusSession,
  type SessionPhaseIn,
  type SessionPhaseOut,
  type SessionDifficulty,
  type SessionMode,
  type SpeedrunKind,
  type SpeedrunState,
  type SessionStartRequest,
  type SessionActionResponse,
} from "@/lib/api"
import {
  FOCUS_PRESETS,
  GRACE_SECONDS,
  STOPWATCH_MILESTONE_SECONDS,
  formatClock,
  sessionStartFromSettings,
  speedrunVerdictCopy,
  deriveSessionView,
  buildPhasePlan,
  type FocusPlanOptions,
  type FocusPresetId,
  type FocusSettings,
  type SessionView,
} from "@/lib/focus-session"
import { FOCUS_SETTINGS_KEY, loadFocusSettings } from "@/lib/focus-settings"

export type {
  FocusSession,
  SessionPhaseIn,
  SessionPhaseOut,
  SessionDifficulty,
  SessionMode,
  SpeedrunKind,
  SpeedrunState,
  SessionStartRequest,
  SessionActionResponse,
  FocusPlanOptions,
  FocusPresetId,
  FocusSettings,
  SessionView,
}

export {
  FOCUS_PRESETS,
  GRACE_SECONDS,
  STOPWATCH_MILESTONE_SECONDS,
  FOCUS_SETTINGS_KEY,
  formatClock,
  sessionStartFromSettings,
  speedrunVerdictCopy,
  deriveSessionView,
  buildPhasePlan,
  loadFocusSettings,
}

export type RingTone = "focus" | "break" | "stopwatch" | "idle"

export function getRingTone(view: SessionView): RingTone {
  const phase = view.live ?? view.pending
  if (phase === null) return "idle"
  if (phase.kind === "break") return "break"
  if (phase.kind === "stopwatch") return "stopwatch"
  if (phase.kind === "speedrun") {
    return phase.planned_seconds > 0 ? "focus" : "stopwatch"
  }
  return "focus"
}

export function getSpeedrunEndCopy(session: FocusSession): {
  ok: boolean
  title: string
  description: string
} | null {
  const run = session.speedrun
  if (session.mode !== "speedrun") return null
  const leg = session.phases.find((p) => p.kind === "speedrun")
  const { ok, title, body } = speedrunVerdictCopy(run, leg?.planned_seconds)
  const clock = (v: number | null | undefined) =>
    typeof v === "number" ? formatClock(v) : null
  let description = body
  if (run?.result === "win") {
    const spare =
      run.margin_seconds ??
      (typeof run.elapsed_seconds === "number" && leg !== undefined
        ? Math.max(0, leg.planned_seconds - run.elapsed_seconds)
        : null)
    const margin = clock(spare)
    if (margin !== null) description = `Done with ${margin} to spare.`
  } else if (run?.result === "record") {
    const oldBest = clock(run.old_record_seconds ?? run.target_seconds)
    const newBest = clock(run.elapsed_seconds)
    if (oldBest !== null && newBest !== null) {
      description = `${oldBest} → ${newBest} for this activity.`
    }
  } else if (run?.result === "finished") {
    const record = clock(run.old_record_seconds ?? run.target_seconds)
    if (record !== null) {
      description = `Time logged — the record stands at ${record}.`
    }
  }
  return { ok, title, description }
}

export const FocusModel = {
  api: focusSessionsApi,
  presets: FOCUS_PRESETS,
  loadSettings: loadFocusSettings,
  formatClock,
  getRingTone,
  getSpeedrunEndCopy,
  sessionStartFromSettings,
}
