import { describe, it, expect, beforeEach, vi } from "vitest"
import type { SessionPhaseIn } from "@/lib/api"
import {
  buildPhasePlan,
  createLocalSession,
  evaluateLocal,
  pauseLocal,
  resumeLocal,
  advanceLocal,
  stopLocal,
  deriveSessionView,
  formatClock,
  remainingSeconds,
  stopwatchElapsedSeconds,
  pauseUsedSeconds,
  nextDeadlineMs,
  saveLocalSession,
  loadLocalSession,
  clearLocalSession,
  GRACE_SECONDS,
  ms,
} from "./focus-session"

const T0 = Date.parse("2026-11-01T10:00:00Z")
const at = (seconds: number) => T0 + seconds * 1000

const timerInput = (overrides: Partial<Parameters<typeof createLocalSession>[0]> = {}) => ({
  mode: "timer" as const,
  phases: [
    { kind: "focus" as const, minutes: 1 },
    { kind: "break" as const, minutes: 1 },
    { kind: "focus" as const, minutes: 1 },
  ],
  task_id: null,
  tag_id: null,
  difficulty: "easy" as const,
  auto_start_breaks: true,
  auto_start_focus: false,
  pause_budget_count: 3,
  pause_budget_seconds: 300,
  ...overrides,
})

const storage = new Map<string, string>()
vi.mock("idb-keyval", () => ({
  get: async (key: string) => {
    const raw = storage.get(key)
    return raw ? JSON.parse(raw) : undefined
  },
  set: async (key: string, value: unknown) => {
    storage.set(key, JSON.stringify(value))
  },
  del: async (key: string) => {
    storage.delete(key)
  },
}))

describe("buildPhasePlan", () => {
  it("alternates focus/break and closes with the long break", () => {
    const plan = buildPhasePlan({
      focusMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      cycles: 4,
    })
    expect(plan).toEqual<SessionPhaseIn[]>([
      { kind: "focus", minutes: 25 },
      { kind: "break", minutes: 5 },
      { kind: "focus", minutes: 25 },
      { kind: "break", minutes: 5 },
      { kind: "focus", minutes: 25 },
      { kind: "break", minutes: 5 },
      { kind: "focus", minutes: 25 },
      { kind: "break", minutes: 15 },
    ])
  })

  it("clamps cycles and minutes into the schema bounds", () => {
    const plan = buildPhasePlan({
      focusMinutes: 9999,
      breakMinutes: 0,
      longBreakMinutes: 15,
      cycles: 99,
    })
    expect(plan).toHaveLength(16)
    expect(plan[0].minutes).toBe(600)
    expect(plan[1].minutes).toBe(1)
  })

  it("places a long break after every 4th focus phase", () => {
    const plan = buildPhasePlan({
      focusMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      cycles: 8,
    })
    const breaks = plan.filter((p) => p.kind === "break")
    // Short breaks after legs 1-3 and 5-7; long after leg 4 and the last leg.
    expect(breaks.map((b) => b.minutes)).toEqual([5, 5, 5, 15, 5, 5, 5, 15])
  })
})

describe("ms timestamp parse", () => {
  it("treats offset-less timestamps as UTC", () => {
    // SQLite datetimes carry no offset — Date.parse alone would read them
    // browser-local and skew the countdown by the UTC offset.
    expect(ms("2026-11-01T10:00:00")).toBe(Date.UTC(2026, 10, 1, 10, 0, 0))
    expect(ms("2026-11-01T10:00:00.000")).toBe(
      Date.UTC(2026, 10, 1, 10, 0, 0)
    )
  })

  it("honours explicit offsets and Z, and maps null to null", () => {
    expect(ms("2026-11-01T10:00:00Z")).toBe(Date.UTC(2026, 10, 1, 10, 0, 0))
    expect(ms("2026-11-01T10:00:00+05:00")).toBe(
      Date.UTC(2026, 10, 1, 5, 0, 0)
    )
    expect(ms("2026-11-01T10:00:00-02:00")).toBe(
      Date.UTC(2026, 10, 1, 12, 0, 0)
    )
    expect(ms(null)).toBeNull()
  })
})

describe("formatClock", () => {
  it("renders m:ss under an hour and h:mm:ss above", () => {
    expect(formatClock(0)).toBe("0:00")
    expect(formatClock(61)).toBe("1:01")
    expect(formatClock(1497)).toBe("24:57")
    expect(formatClock(3600)).toBe("1:00:00")
    expect(formatClock(3661)).toBe("1:01:01")
  })
})

describe("createLocalSession", () => {
  it("starts the first phase active and leaves the rest pending", () => {
    const local = createLocalSession(timerInput(), T0)
    const { session } = local
    expect(session.status).toBe("active")
    expect(session.phases).toHaveLength(3)
    expect(session.phases[0].status).toBe("active")
    expect(session.phases[0].started_at).not.toBeNull()
    expect(session.phases[1].status).toBe("pending")
    expect(session.phases[1].started_at).toBeNull()
    expect(local.client_id).toBeTruthy()
  })

  it("creates a single open-ended stopwatch leg", () => {
    const local = createLocalSession(
      timerInput({ mode: "stopwatch" }),
      T0
    )
    expect(local.session.phases).toHaveLength(1)
    expect(local.session.phases[0].kind).toBe("stopwatch")
    expect(local.session.phases[0].planned_seconds).toBe(0)
  })
})

describe("evaluateLocal", () => {
  it("does nothing before the phase deadline", () => {
    const local = createLocalSession(timerInput(), T0)
    const events = evaluateLocal(local, at(30))
    expect(events).toHaveLength(0)
    expect(local.session.phases[0].status).toBe("active")
  })

  it("completes an elapsed focus phase, claims it, auto-starts the break", () => {
    const local = createLocalSession(timerInput(), T0)
    const events = evaluateLocal(local, at(61))
    expect(local.session.phases[0].status).toBe("completed")
    expect(local.session.phases[1].status).toBe("active")
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe("focus_phase_completed")
    expect(events[0].payload.minutes).toBe(1)
    expect(events[0].payload.difficulty).toBe("easy")
    expect(events[0].client_event_id).toContain(local.client_id)
  })

  it("chains through several elapsed phases in one pass", () => {
    const local = createLocalSession(timerInput(), T0)
    // Jump past focus1+break+start of focus2 — auto_start_focus=false leaves
    // the second focus pending inside its grace window.
    const events = evaluateLocal(local, at(121))
    expect(local.session.phases[0].status).toBe("completed")
    expect(local.session.phases[1].status).toBe("completed")
    expect(local.session.phases[2].status).toBe("pending")
    expect(events.map((e) => e.type)).toEqual(["focus_phase_completed"])
    expect(local.session.status).toBe("active")
  })

  it("ends the session cleanly after the last pending phase lapses grace", () => {
    const local = createLocalSession(timerInput(), T0)
    evaluateLocal(local, at(121))
    // focus2 pending since t+120; grace expires at t+420.
    const events = evaluateLocal(local, at(120 + GRACE_SECONDS + 1))
    expect(local.session.status).toBe("ended")
    expect(events).toHaveLength(0)
  })

  it("abandons with a damage claim when grace lapses on zero focus", () => {
    const local = createLocalSession(
      timerInput({
        phases: [
          { kind: "break", minutes: 1 },
          { kind: "focus", minutes: 1 },
        ],
        auto_start_breaks: false,
      }),
      T0
    )
    evaluateLocal(local, at(61)) // break done, focus pending
    const events = evaluateLocal(local, at(60 + GRACE_SECONDS + 1))
    expect(local.session.status).toBe("abandoned")
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe("damage")
    expect(events[0].payload.reason).toBe("absence_grace")
  })

  it("abandons a paused phase that overflows the seconds budget", () => {
    const local = createLocalSession(timerInput(), T0)
    pauseLocal(local, at(10))
    const events = evaluateLocal(local, at(10 + 301))
    expect(local.session.status).toBe("abandoned")
    expect(events[0].type).toBe("damage")
    expect(events[0].payload.reason).toBe("pause_overflow")
  })

  it("is idempotent — a second evaluation emits nothing", () => {
    const local = createLocalSession(timerInput(), T0)
    const first = evaluateLocal(local, at(61))
    const second = evaluateLocal(local, at(61))
    expect(first).toHaveLength(1)
    expect(second).toHaveLength(0)
  })
})

describe("local verbs", () => {
  it("pause/resume banks the paused seconds", () => {
    const local = createLocalSession(timerInput(), T0)
    pauseLocal(local, at(10))
    const phase = local.session.phases[0]
    expect(phase.status).toBe("paused")
    expect(phase.pause_count).toBe(1)
    resumeLocal(local, at(40))
    expect(phase.status).toBe("active")
    expect(phase.paused_seconds).toBe(30)
    // The deadline now shifts by the banked 30s (completes at t+90).
    expect(evaluateLocal(local, at(89))).toHaveLength(0)
    expect(evaluateLocal(local, at(90))).toHaveLength(1)
  })

  it("refuses to pause a break", () => {
    const local = createLocalSession(timerInput(), T0)
    evaluateLocal(local, at(61))
    expect(() => pauseLocal(local, at(70))).toThrow("breaks cannot be paused")
  })

  it("the (n+1)th pause overflows the count budget and abandons", () => {
    const local = createLocalSession(
      timerInput({ pause_budget_count: 1 }),
      T0
    )
    pauseLocal(local, at(10))
    resumeLocal(local, at(20))
    const events = pauseLocal(local, at(30))
    expect(local.session.status).toBe("abandoned")
    expect(events[0].payload.reason).toBe("pause_overflow")
  })

  it("advance skips a running break into the pending focus", () => {
    const local = createLocalSession(timerInput(), T0)
    evaluateLocal(local, at(61))
    advanceLocal(local, at(70))
    expect(local.session.phases[1].status).toBe("skipped")
    expect(local.session.phases[2].status).toBe("active")
  })

  it("advance starts a pending phase while nothing runs", () => {
    const local = createLocalSession(
      timerInput({ auto_start_breaks: false }),
      T0
    )
    evaluateLocal(local, at(61))
    expect(local.session.phases[1].status).toBe("pending")
    advanceLocal(local, at(70))
    expect(local.session.phases[1].status).toBe("active")
  })

  it("stop with zero completed focus abandons and claims damage", () => {
    const local = createLocalSession(timerInput(), T0)
    const events = stopLocal(local, at(30))
    expect(local.session.status).toBe("abandoned")
    expect(local.session.phases[0].status).toBe("abandoned")
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe("damage")
    expect(events[0].payload.reason).toBe("manual_stop")
  })

  it("abandon eid omits the reason — divergent reasons dedupe server-side", () => {
    // manual_stop vs pause_overflow vs absence_grace: the eid carries no
    // {reason} suffix, so two tabs abandoning the same run for different
    // reasons collapse to ONE damage claim (reason stays in the payload).
    const manual = createLocalSession(timerInput(), T0)
    const manualEvents = stopLocal(manual, at(30))
    expect(manualEvents[0].client_event_id).toBe(
      `web:${manual.client_id}:session_abandoned`
    )
    expect(manualEvents[0].payload.reason).toBe("manual_stop")

    const overflow = createLocalSession(timerInput(), T0)
    pauseLocal(overflow, T0) // pause budget 300s
    const overflowEvents = evaluateLocal(overflow, T0 + 301_000)
    expect(overflowEvents[0].type).toBe("damage")
    expect(overflowEvents[0].payload.reason).toBe("pause_overflow")
    expect(overflowEvents[0].client_event_id).toBe(
      `web:${overflow.client_id}:session_abandoned`
    )
  })

  it("stop after a completed focus ends cleanly", () => {
    const local = createLocalSession(timerInput(), T0)
    evaluateLocal(local, at(61))
    const events = stopLocal(local, at(70))
    expect(local.session.status).toBe("ended")
    expect(local.session.phases[1].status).toBe("skipped")
    expect(events).toHaveLength(0)
  })

  it("stopwatch stop banks elapsed but claims no scoring event", () => {
    // Milestone XP is server-authored — an offline stopwatch ends unscored.
    const local = createLocalSession(timerInput({ mode: "stopwatch" }), T0)
    const events = stopLocal(local, at(30 * 60))
    expect(local.session.status).toBe("ended")
    expect(local.session.phases[0].status).toBe("completed")
    expect(local.session.phases[0].actual_seconds).toBe(30 * 60)
    expect(events).toHaveLength(0)
  })

  it("stopwatch stop banks the open pause (engine parity)", () => {
    const local = createLocalSession(timerInput({ mode: "stopwatch" }), T0)
    pauseLocal(local, at(60))
    stopLocal(local, at(120))
    const phase = local.session.phases[0]
    expect(phase.paused_seconds).toBe(60)
    expect(phase.pause_started_at).toBeNull()
    expect(phase.actual_seconds).toBe(60)
  })
})

describe("terminal-state verb guards", () => {
  it("verbs no-op on an ended session (no double-stop damage)", () => {
    const local = createLocalSession(timerInput(), T0)
    stopLocal(local, at(30)) // manual_stop abandon — zero completed focus
    expect(local.session.status).toBe("abandoned")
    // A second stop/pause/resume/advance must not re-emit or mutate.
    expect(stopLocal(local, at(60))).toEqual([])
    expect(pauseLocal(local, at(60))).toEqual([])
    expect(resumeLocal(local, at(60))).toEqual([])
    expect(advanceLocal(local, at(60))).toEqual([])
    expect(local.session.status).toBe("abandoned")
  })

  it("evaluateLocal no-ops on a terminal session", () => {
    const local = createLocalSession(timerInput(), T0)
    stopLocal(local, at(30))
    expect(evaluateLocal(local, at(9999))).toEqual([])
  })
})

describe("clock derivations", () => {
  it("remainingSeconds counts down and freezes while paused", () => {
    const local = createLocalSession(timerInput(), T0)
    const phase = local.session.phases[0]
    expect(remainingSeconds(phase, at(30))).toBe(30)
    pauseLocal(local, at(30))
    expect(remainingSeconds(phase, at(50))).toBe(30)
    expect(remainingSeconds(phase, at(90))).toBe(30)
  })

  it("stopwatchElapsedSeconds counts up minus pauses", () => {
    const local = createLocalSession(timerInput({ mode: "stopwatch" }), T0)
    const phase = local.session.phases[0]
    expect(stopwatchElapsedSeconds(phase, at(90))).toBe(90)
    pauseLocal(local, at(90))
    resumeLocal(local, at(120))
    expect(stopwatchElapsedSeconds(phase, at(150))).toBe(120)
  })

  it("pauseUsedSeconds includes the still-open pause", () => {
    const local = createLocalSession(timerInput(), T0)
    pauseLocal(local, at(10))
    expect(pauseUsedSeconds(local.session.phases[0], at(70))).toBe(60)
  })

  it("nextDeadlineMs is the phase end, the pause overflow, then grace", () => {
    const local = createLocalSession(timerInput(), T0)
    expect(nextDeadlineMs(local.session)).toBe(at(60))
    pauseLocal(local, at(10))
    // paused at t+10 with 300s budget -> overflow at t+310
    expect(nextDeadlineMs(local.session)).toBe(at(310))
    resumeLocal(local, at(20))
    evaluateLocal(local, at(70)) // focus done at 60+10 banked, break active
    evaluateLocal(local, at(132)) // break done at 130 -> awaiting grace
    // Grace deadline anchors to the last phase end (t+130), not eval time.
    expect(nextDeadlineMs(local.session)).toBe(
      at(130) + GRACE_SECONDS * 1000
    )
  })
})

describe("deriveSessionView", () => {
  it("reports a running focus phase with its pause budget", () => {
    const local = createLocalSession(timerInput(), T0)
    const view = deriveSessionView(local.session, at(15))
    expect(view.status).toBe("running")
    expect(view.clockSeconds).toBe(45)
    expect(view.progress).toBeCloseTo(0.25)
    expect(view.kindLabel).toBe("Focus · phase 1/2")
    expect(view.pausesLeft).toBe(3)
    expect(view.focusDone).toBe(0)
    expect(view.focusTotal).toBe(2)
  })

  it("reports awaiting with the grace countdown", () => {
    const local = createLocalSession(
      timerInput({ auto_start_breaks: false }),
      T0
    )
    evaluateLocal(local, at(61))
    const view = deriveSessionView(local.session, at(70))
    expect(view.status).toBe("awaiting")
    expect(view.kindLabel).toBe("Up next: Break")
    expect(view.graceEndsInSec).toBe(GRACE_SECONDS - 10)
  })

  it("reports ended and abandoned terminals", () => {
    const local = createLocalSession(timerInput(), T0)
    stopLocal(local, at(30))
    let view = deriveSessionView(local.session, at(30))
    expect(view.status).toBe("abandoned")
    const done = createLocalSession(timerInput(), T0)
    evaluateLocal(done, at(121))
    evaluateLocal(done, at(120 + GRACE_SECONDS + 1))
    view = deriveSessionView(done.session, at(9999))
    expect(view.status).toBe("ended")
  })

  it("tracks stopwatch elapsed and milestone progress", () => {
    const local = createLocalSession(timerInput({ mode: "stopwatch" }), T0)
    const view = deriveSessionView(local.session, at(5 * 60))
    expect(view.status).toBe("running")
    expect(view.clockSeconds).toBe(300)
    expect(view.progress).toBeCloseTo(300 / 1500)
    expect(view.kindLabel).toBe("Stopwatch")
  })
})

describe("local session persistence", () => {
  beforeEach(() => storage.clear())

  it("round-trips a session through storage", async () => {
    const local = createLocalSession(timerInput(), T0)
    evaluateLocal(local, at(61))
    await saveLocalSession("u1", local)
    const restored = await loadLocalSession("u1")
    expect(restored?.client_id).toBe(local.client_id)
    expect(restored?.session.phases[0].status).toBe("completed")
    await clearLocalSession("u1")
    expect(await loadLocalSession("u1")).toBeNull()
  })
})
