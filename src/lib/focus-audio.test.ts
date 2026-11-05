import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { alertPhaseBoundary } from "./focus-audio"

/**
 * Boundary-alert copy, driven through the hidden-tab path: with the page
 * backgrounded and permission granted, alertPhaseBoundary fires a system
 * Notification — the copy is what a user reads when they weren't looking.
 */
class MockNotification {
  static permission = "granted"
  static instances: { title: string; body?: string }[] = []
  constructor(title: string, opts?: NotificationOptions) {
    MockNotification.instances.push({ title, body: opts?.body })
  }
}

describe("alertPhaseBoundary speedrun arm (#69)", () => {
  beforeEach(() => {
    MockNotification.instances = []
    vi.stubGlobal("Notification", MockNotification)
    vi.spyOn(document, "hidden", "get").mockReturnValue(true)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  const last = () =>
    MockNotification.instances[MockNotification.instances.length - 1]

  it("a judged timeout fires out-of-time copy — not 'next phase ready'", () => {
    alertPhaseBoundary(
      "speedrun",
      0.8,
      {
        type: "time_boxed",
        result: "miss",
        reason: "timeout",
        elapsed_seconds: 600,
      },
      600
    )
    expect(last()).toEqual({
      title: "Out of time",
      body: "The clock hit zero — HP lost.",
    })
  })

  it("a give-up miss fires the abandoned copy (reason: abandon)", () => {
    alertPhaseBoundary(
      "speedrun",
      0.8,
      {
        type: "time_boxed",
        result: "miss",
        reason: "abandon",
        elapsed_seconds: 120,
      },
      600
    )
    expect(last().title).toBe("Run abandoned")
    expect(last().body).toMatch(/HP lost/)
  })

  it("a reason-less miss falls back to the leg's clock", () => {
    alertPhaseBoundary(
      "speedrun",
      0.8,
      { type: "time_boxed", result: "miss", elapsed_seconds: 120 },
      600
    )
    expect(last().title).toBe("Run abandoned")
    alertPhaseBoundary(
      "speedrun",
      0.8,
      { type: "time_boxed", result: "miss", elapsed_seconds: 600 },
      600
    )
    expect(last().title).toBe("Out of time")
  })

  it("a reason-less miss on an open clock is a give-up, never a timeout", () => {
    // beat_best legs pass plannedSeconds 0 — an open-ended run can't be
    // "Out of time".
    alertPhaseBoundary(
      "speedrun",
      0.8,
      { type: "beat_best", result: "miss", elapsed_seconds: 120 },
      0
    )
    expect(last().title).toBe("Run abandoned")
    expect(last().body).toMatch(/HP lost/)
  })

  it("an unjudged end alerts neutral — no HP claim without a verdict", () => {
    alertPhaseBoundary("speedrun", 0.8, { type: "time_boxed" }, 600)
    expect(last().title).toBe("Run ended")
    expect(last().body).not.toMatch(/HP lost/)
    alertPhaseBoundary("speedrun", 0.8, null, 600)
    expect(last().title).toBe("Run ended")
  })

  it("a speedrun win fires the cleared copy — never the focus copy", () => {
    alertPhaseBoundary(
      "speedrun",
      0.8,
      {
        type: "time_boxed",
        result: "win",
        elapsed_seconds: 540,
        margin_seconds: 60,
      },
      600
    )
    expect(last().title).toBe("Speedrun cleared")
    expect(last().body).not.toMatch(/next phase/)
  })

  it("record and finished verdicts alert as successes", () => {
    alertPhaseBoundary("speedrun", 0.8, {
      type: "beat_best",
      result: "record",
      elapsed_seconds: 270,
      old_record_seconds: 300,
    })
    expect(last().title).toBe("New personal best!")
    alertPhaseBoundary("speedrun", 0.8, {
      type: "beat_best",
      result: "finished",
      old_record_seconds: 300,
    })
    expect(last().title).toBe("Run complete")
  })

  it("a normal focus boundary still reads 'next phase'", () => {
    alertPhaseBoundary("focus", 0.8)
    expect(last().title).toBe("Focus phase complete")
    expect(last().body).toMatch(/next phase/)
  })
})
