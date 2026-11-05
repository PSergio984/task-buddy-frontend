import { describe, it, expect } from "vitest"
import type { TimelineDayResponse } from "@/lib/api"
import { buildDayTimeline, markerLabel, markerScoreLabel } from "./timeline"

const DAY = "2025-11-01"
const DAY_START = Date.parse(`${DAY}T00:00:00Z`)

function baseResponse(): TimelineDayResponse {
  return {
    date: DAY,
    sessions: [],
    markers: [],
    diary: [],
    server_time: `${DAY}T20:00:00Z`,
  }
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    mode: "timer",
    // Backend session statuses are active | ended | abandoned.
    status: "ended",
    task_id: null,
    activity_label: null,
    started_at: `${DAY}T09:00:00Z`,
    ended_at: `${DAY}T09:25:00Z`,
    duration_seconds: 1500,
    phases: [],
    ...overrides,
  }
}

describe("markerLabel", () => {
  it("prettifies ledger type strings", () => {
    expect(markerLabel("focus_phase_completed")).toBe("Focus phase completed")
    expect(markerLabel("session_started")).toBe("Session started")
  })
})

describe("markerScoreLabel", () => {
  it("summarizes scored outcomes", () => {
    expect(markerScoreLabel({ scored: true, xp: 40, gold: 12.7 })).toBe(
      "+40 XP · +12g"
    )
    expect(markerScoreLabel({ scored: true, hp_lost: 5 })).toBe("−5 HP")
  })

  it("returns null for unscored or absent outcomes", () => {
    expect(markerScoreLabel(null)).toBeNull()
    expect(markerScoreLabel({ scored: false })).toBeNull()
    expect(markerScoreLabel({ scored: true })).toBeNull()
  })
})

describe("buildDayTimeline", () => {
  it("maps a session to a width-true block on the UTC day axis", () => {
    // 09:00–10:00 UTC = 9h–10h into the day → fracs 0.375..0.4167.
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T09:00:00Z`,
        ended_at: `${DAY}T10:00:00Z`,
        duration_seconds: 3600,
      })
    )
    const view = buildDayTimeline(res)
    expect(view.blocks).toHaveLength(1)
    const block = view.blocks[0]
    expect(block.startFrac).toBeCloseTo(9 / 24, 3)
    expect(block.widthFrac).toBeCloseTo(1 / 24, 3)
    expect(block.lane).toBe(0)
    expect(block.startLabel).toBe("09:00")
    expect(block.endLabel).toBe("10:00")
    expect(block.durationLabel).toBe("1h 0m")
    expect(block.label).toBe("Focus session")
    expect(view.laneCount).toBe(1)
  })

  it("prefers activity_label for the block label", () => {
    const res = baseResponse()
    res.sessions.push(session({ activity_label: "Deep work" }))
    expect(buildDayTimeline(res).blocks[0].label).toBe("Deep work")
  })

  it("labels a speedrun block when no activity_label is set (#69)", () => {
    const res = baseResponse()
    res.sessions.push(session({ mode: "speedrun" }))
    expect(buildDayTimeline(res).blocks[0].label).toBe("Speedrun session")
  })

  it("closes a still-running block on server_time", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T19:00:00Z`,
        ended_at: null,
        status: "active",
      })
    )
    const block = buildDayTimeline(res).blocks[0]
    expect(block.endLabel).toBe("20:00")
    expect(block.widthFrac).toBeCloseTo(1 / 24, 3)
  })

  it("assigns overlapping sessions to separate lanes", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        id: 1,
        started_at: `${DAY}T09:00:00Z`,
        ended_at: `${DAY}T10:00:00Z`,
      }),
      session({
        id: 2,
        started_at: `${DAY}T09:30:00Z`,
        ended_at: `${DAY}T10:30:00Z`,
      }),
      // A third session after both ended lands back on lane 0.
      session({
        id: 3,
        started_at: `${DAY}T11:00:00Z`,
        ended_at: `${DAY}T12:00:00Z`,
      })
    )
    const view = buildDayTimeline(res)
    expect(view.blocks.map((b) => b.lane)).toEqual([0, 1, 0])
    expect(view.laneCount).toBe(2)
  })

  it("positions phases as sub-spans inside their block", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T09:00:00Z`,
        ended_at: `${DAY}T10:00:00Z`,
        phases: [
          {
            seq: 0,
            kind: "focus",
            status: "completed",
            planned_seconds: 1500,
            actual_seconds: 1500,
            started_at: `${DAY}T09:00:00Z`,
            ended_at: `${DAY}T09:25:00Z`,
          },
          {
            seq: 1,
            kind: "break",
            status: "completed",
            planned_seconds: 300,
            actual_seconds: 300,
            started_at: `${DAY}T09:25:00Z`,
            ended_at: `${DAY}T09:30:00Z`,
          },
          // never started — skipped by the assembly
          {
            seq: 2,
            kind: "focus",
            status: "skipped",
            planned_seconds: 1500,
            actual_seconds: null,
            started_at: null,
            ended_at: null,
          },
        ],
      })
    )
    const phases = buildDayTimeline(res).blocks[0].phases
    expect(phases).toHaveLength(2)
    expect(phases[0].startFrac).toBeCloseTo(0, 3)
    expect(phases[0].widthFrac).toBeCloseTo(25 / 60, 3)
    expect(phases[1].startFrac).toBeCloseTo(25 / 60, 3)
    expect(phases[1].widthFrac).toBeCloseTo(5 / 60, 3)
  })

  it("clamps an overnight session at the axis edge and labels it +Nd", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T23:00:00Z`,
        ended_at: "2025-11-02T01:30:00Z",
        duration_seconds: 9000,
      })
    )
    const block = buildDayTimeline(res).blocks[0]
    expect(block.startFrac).toBeCloseTo(23 / 24, 3)
    expect(block.startFrac + block.widthFrac).toBeLessThanOrEqual(1)
    expect(block.widthFrac).toBeCloseTo(1 / 24, 3) // 23:00 → 24:00
    expect(block.endLabel).toBe("01:30 +1d")
    // The real duration is still reported even though the bar is clipped.
    expect(block.durationLabel).toBe("2h 30m")
  })

  it("holds the strict invariant even for a start in the day's last sliver", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T23:59:30Z`,
        ended_at: "2025-11-02T00:10:00Z",
        duration_seconds: 2400,
      })
    )
    const block = buildDayTimeline(res).blocks[0]
    // startFrac ≈ 0.9997 > 1 − MIN_WIDTH_FRAC: the floor must yield, not bleed.
    expect(block.startFrac).toBeGreaterThan(0.996)
    expect(block.startFrac + block.widthFrac).toBeLessThanOrEqual(1)
    expect(block.widthFrac).toBeCloseTo(1 - block.startFrac, 5)
  })

  it("clamps a still-running session when server_time is past midnight", () => {
    const res = baseResponse()
    res.server_time = "2025-11-02T02:00:00Z"
    res.sessions.push(
      session({
        started_at: `${DAY}T23:30:00Z`,
        ended_at: null,
        status: "active",
      })
    )
    const block = buildDayTimeline(res).blocks[0]
    expect(block.startFrac + block.widthFrac).toBeLessThanOrEqual(1)
    expect(block.endLabel).toBe("02:00 +1d")
  })

  it("clamps a phase that overruns its block", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T23:00:00Z`,
        ended_at: "2025-11-02T01:00:00Z",
        phases: [
          {
            seq: 0,
            kind: "focus",
            status: "completed",
            planned_seconds: 7200,
            actual_seconds: 10_800,
            started_at: `${DAY}T23:30:00Z`,
            // Inconsistent data: phase ends after the session's own end.
            ended_at: "2025-11-02T02:00:00Z",
          },
        ],
      })
    )
    const phase = buildDayTimeline(res).blocks[0].phases[0]
    expect(phase.startFrac + phase.widthFrac).toBeLessThanOrEqual(1)
    expect(phase.startFrac + phase.widthFrac).toBeCloseTo(1, 3)
  })

  it("renders a 59m59s duration as 1h 0m, not 60m", () => {
    const res = baseResponse()
    res.sessions.push(
      session({
        started_at: `${DAY}T09:00:00Z`,
        ended_at: `${DAY}T09:59:59Z`,
        duration_seconds: 3599,
      })
    )
    expect(buildDayTimeline(res).blocks[0].durationLabel).toBe("1h 0m")
  })

  it("falls back instead of emitting NaN positions on malformed timestamps", () => {
    const res = baseResponse()
    res.sessions.push(
      session({ started_at: "not-a-date", ended_at: `${DAY}T10:00:00Z` })
    )
    res.markers.push({
      id: 1,
      type: "session_started",
      ts: "garbage",
      outcome: null,
    })
    const view = buildDayTimeline(res)
    expect(Number.isFinite(view.blocks[0].startFrac)).toBe(true)
    expect(Number.isFinite(view.blocks[0].widthFrac)).toBe(true)
    expect(Number.isFinite(view.markers[0].frac)).toBe(true)
  })

  it("maps ledger events to sorted point markers", () => {
    const res = baseResponse()
    res.markers.push(
      {
        id: 2,
        type: "focus_phase_completed",
        ts: `${DAY}T09:25:00Z`,
        outcome: { scored: true, xp: 40, gold: 12 },
      },
      {
        id: 1,
        type: "session_started",
        ts: `${DAY}T09:00:00Z`,
        outcome: null,
      }
    )
    const view = buildDayTimeline(res)
    expect(view.markers.map((m) => m.id)).toEqual([1, 2])
    const started = view.markers[0]
    expect(started.label).toBe("Session started")
    expect(started.frac).toBeCloseTo(9 / 24, 3)
    expect(started.timeLabel).toBe("09:00")
    expect(started.scoreLabel).toBeNull()
    expect(view.markers[1].scoreLabel).toBe("+40 XP · +12g")
  })

  it("handles an empty day", () => {
    const view = buildDayTimeline(baseResponse())
    expect(view.blocks).toEqual([])
    expect(view.markers).toEqual([])
    expect(view.laneCount).toBe(0)
    expect(view.dayEndMs - view.dayStartMs).toBe(86_400_000)
    expect(view.dayStartMs).toBe(DAY_START)
  })
})
