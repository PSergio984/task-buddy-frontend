import { vi } from "vitest"
import type { FocusSession } from "@/lib/api"
import type { FocusSessionRuntime } from "@/hooks/useFocusSession"
import { deriveSessionView } from "@/lib/focus-session"

/**
 * Shared fixture builders for the focus-session suites (same convention as
 * game-column-test-utils / game-hook-test-utils): one canonical shape, the
 * suites hand over only the discriminating overrides.
 */

/** The suites' shared epoch (each keeps its own T0/at()/iso() helpers). */
const SESSION_T0 = Date.parse("2026-11-01T10:00:00Z")

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

/**
 * The FocusSessionRuntime stub both component suites drive — view derived
 * like the real hook, every verb a vi.fn. `alerts` flips the live prefs the
 * provider's boundary-alert effect reads.
 */
export function makeRuntime(
  session: FocusSession | null,
  { alerts = false }: { alerts?: boolean } = {}
): FocusSessionRuntime {
  return {
    session,
    isLocal: false,
    isLoading: false,
    busy: null,
    nowMs: SESSION_T0,
    view: session === null ? null : deriveSessionView(session, SESSION_T0),
    start: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    resume: vi.fn(async () => {}),
    advance: vi.fn(async () => {}),
    stop: vi.fn(async () => {}),
    done: vi.fn(async () => {}),
    dismissEnded: vi.fn(async () => {}),
    mirrored: false,
    alertSettings: { alerts, alertVolume: 80 },
    setAlertSettings: vi.fn(),
  }
}
