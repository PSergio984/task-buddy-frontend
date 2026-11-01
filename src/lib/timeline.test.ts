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
    status: "completed",
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
