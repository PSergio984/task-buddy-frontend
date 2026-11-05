import { render } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FocusSessionProvider } from "./FocusSessionContext"
import { alertPhaseBoundary } from "@/lib/focus-audio"
import { deriveSessionView } from "@/lib/focus-session"
import { speedrunSession } from "@/lib/focus-session-test-utils"
import type { FocusSession } from "@/lib/api"
import type { FocusSessionRuntime } from "@/hooks/useFocusSession"

let runtime: FocusSessionRuntime
vi.mock("@/hooks/useFocusSession", () => ({
  useFocusSessionRuntime: () => runtime,
}))
vi.mock("@/lib/focus-audio", () => ({
  alertPhaseBoundary: vi.fn(),
}))

const T0 = Date.parse("2026-11-01T10:00:00Z")
const iso = (epoch: number) => new Date(epoch).toISOString()

const makeRuntime = (session: FocusSession | null): FocusSessionRuntime => ({
  session,
  isLocal: false,
  isLoading: false,
  busy: null,
  nowMs: T0,
  view: session === null ? null : deriveSessionView(session, T0),
  start: vi.fn(async () => {}),
  pause: vi.fn(async () => {}),
  resume: vi.fn(async () => {}),
  advance: vi.fn(async () => {}),
  stop: vi.fn(async () => {}),
  done: vi.fn(async () => {}),
  dismissEnded: vi.fn(async () => {}),
  mirrored: false,
  alertSettings: { alerts: true, alertVolume: 80 },
  setAlertSettings: vi.fn(),
})

// A fresh element per render — an identical JSX object lets React bail out
// of the provider's render pass, so the mocked runtime would never swap.
const tree = () => (
  <FocusSessionProvider>
    <div />
  </FocusSessionProvider>
)

describe("FocusSessionProvider speedrun boundary alerts (#69)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("a judged timeout fires the speedrun arm — the leg's terminal is 'abandoned'", () => {
    runtime = makeRuntime(speedrunSession())
    const { rerender } = render(tree())

    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "abandoned",
          ended_at: iso(T0 + 600_000),
          speedrun: {
            type: "time_boxed",
            budget_seconds: 600,
            result: "miss",
            reason: "timeout",
            elapsed_seconds: 600,
          },
        },
        phase: { status: "abandoned", ended_at: iso(T0 + 600_000) },
      })
    )
    rerender(tree())

    expect(alertPhaseBoundary).toHaveBeenCalledTimes(1)
    expect(alertPhaseBoundary).toHaveBeenCalledWith(
      "speedrun",
      0.8,
      expect.objectContaining({ result: "miss", reason: "timeout" }),
      600
    )
  })

  it("a judged win fires the speedrun arm — never the 'next phase' focus tone", () => {
    runtime = makeRuntime(speedrunSession())
    const { rerender } = render(tree())

    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "ended",
          ended_at: iso(T0 + 540_000),
          speedrun: {
            type: "time_boxed",
            budget_seconds: 600,
            result: "win",
            elapsed_seconds: 540,
            margin_seconds: 60,
          },
        },
        phase: {
          status: "completed",
          actual_seconds: 540,
          ended_at: iso(T0 + 540_000),
        },
      })
    )
    rerender(tree())

    expect(alertPhaseBoundary).toHaveBeenCalledTimes(1)
    expect(alertPhaseBoundary).toHaveBeenCalledWith(
      "speedrun",
      0.8,
      expect.objectContaining({ result: "win" }),
      600
    )
  })

  it("an abandoned non-speedrun leg still fires nothing", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: { mode: "timer", speedrun: null },
        phase: { kind: "focus", planned_seconds: 1500 },
      })
    )
    const { rerender } = render(tree())

    runtime = makeRuntime(
      speedrunSession({
        session: {
          mode: "timer",
          speedrun: null,
          status: "abandoned",
          ended_at: iso(T0 + 30_000),
        },
        phase: {
          kind: "focus",
          planned_seconds: 1500,
          status: "abandoned",
          ended_at: iso(T0 + 30_000),
        },
      })
    )
    rerender(tree())

    expect(alertPhaseBoundary).not.toHaveBeenCalled()
  })

  it("a completed focus leg still fires the focus arm", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: { mode: "timer", speedrun: null },
        phase: { kind: "focus", planned_seconds: 1500 },
      })
    )
    const { rerender } = render(tree())

    runtime = makeRuntime(
      speedrunSession({
        session: { mode: "timer", speedrun: null },
        phase: {
          kind: "focus",
          planned_seconds: 1500,
          status: "completed",
          actual_seconds: 1500,
          ended_at: iso(T0 + 1_500_000),
        },
      })
    )
    rerender(tree())

    expect(alertPhaseBoundary).toHaveBeenCalledWith("focus", 0.8, null, 1500)
  })
})
