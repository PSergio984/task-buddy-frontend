import type { FocusSession } from "@/lib/api"

/**
 * Shared fixture builders for the focus-session suites (same convention as
 * game-column-test-utils / game-hook-test-utils): one canonical shape, the
 * suites hand over only the discriminating overrides.
 */

/** The suites' shared epoch (each keeps its own T0/at()/iso() helpers). */
export const SESSION_T0 = Date.parse("2026-11-01T10:00:00Z")

const iso = (epoch: number) => new Date(epoch).toISOString()

/**
 * A server-shaped speedrun session (#69): one kind:"speedrun" leg judged on
 * wall-clock — created via POST, never createLocalSession. `phase` spreads
 * over the leg and `session` over the envelope, so blob edits go in
 * `session.speedrun` and a verdict in `session.status`/`ended_at`.
 */
export function speedrunSession({
  id = 7,
  startedAt = SESSION_T0,
  phase = {},
  session = {},
}: {
  id?: number
  startedAt?: number
  phase?: Record<string, unknown>
  session?: Record<string, unknown>
} = {}): FocusSession {
  return {
    id,
    mode: "speedrun",
    status: "active",
    task_id: null,
    activity_label: "Deep work",
    preset: null,
    pause_budget_count: 0,
    pause_budget_seconds: 0,
    started_at: iso(startedAt),
    ended_at: null,
    speedrun: { type: "time_boxed", budget_seconds: 600 },
    phases: [
      {
        seq: 0,
        kind: "speedrun",
        status: "active",
        planned_seconds: 600,
        actual_seconds: null,
        pause_count: 0,
        paused_seconds: 0,
        pause_started_at: null,
        started_at: iso(startedAt),
        ended_at: null,
        ...phase,
      },
    ],
    ...session,
  } as FocusSession
}
