import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FocusPage } from "./FocusPage"
import { deriveSessionView } from "@/lib/focus-session"
import type { FocusSession } from "@/lib/api"
import type { FocusSessionRuntime } from "@/hooks/useFocusSession"

const T0 = Date.parse("2026-11-01T10:00:00Z")
const iso = (epoch: number) => new Date(epoch).toISOString()

let runtime: FocusSessionRuntime
vi.mock("@/contexts/FocusSessionContext", () => ({
  useFocusSession: () => runtime,
}))
vi.mock("@/hooks/useTasks", () => ({ useTasks: () => ({ data: [] }) }))
vi.mock("@/hooks/useTags", () => ({ useTags: () => ({ data: [] }) }))
vi.mock("@/components/focus/session-note-prompt", () => ({
  SessionNotePrompt: () => null,
}))
vi.mock("@/lib/focus-audio", () => ({
  primeAlertAudio: vi.fn(),
  requestAlertPermission: vi.fn(),
  alertPhaseBoundary: vi.fn(),
}))

/** Server-shaped speedrun session (#69): one kind:"speedrun" leg. */
function speedrunSession(
  session: Record<string, unknown> = {},
  phase: Record<string, unknown> = {}
): FocusSession {
  return {
    id: 7,
    mode: "speedrun",
    status: "active",
    task_id: null,
    activity_label: "Deep work",
    preset: null,
    pause_budget_count: 0,
    pause_budget_seconds: 0,
    started_at: iso(T0),
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
        started_at: iso(T0),
        ended_at: null,
        ...phase,
      },
    ],
    ...session,
  } as FocusSession
}

function makeRuntime(session: FocusSession | null): FocusSessionRuntime {
  return {
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
    alertSettings: { alerts: false, alertVolume: 80 },
    setAlertSettings: vi.fn(),
  }
}

describe("FocusPage speedrun (#69)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("live time-boxed run: Done + give-up + clock-keeps-running copy", () => {
    runtime = makeRuntime(speedrunSession())
    render(<FocusPage />)
    expect(screen.getByRole("button", { name: /Done/ })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Give up \(−HP\)/ })
    ).toBeInTheDocument()
    expect(screen.getByText(/Pauses don't stop the clock/)).toBeInTheDocument()
  })

  it("Done fires the server verb", () => {
    runtime = makeRuntime(speedrunSession())
    render(<FocusPage />)
    fireEvent.click(screen.getByRole("button", { name: /Done/ }))
    expect(runtime.done).toHaveBeenCalled()
  })

  it("paused run: the clock-keeps-running warning shows", () => {
    runtime = makeRuntime(
      speedrunSession(
        {},
        { status: "paused", pause_started_at: iso(T0 - 30_000) }
      )
    )
    render(<FocusPage />)
    expect(
      screen.getByText(/Paused — the clock keeps running/)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Resume/ })).toBeInTheDocument()
  })

  it("beat-best shows the record it's chasing", () => {
    runtime = makeRuntime(
      speedrunSession(
        { speedrun: { type: "beat_best", target_seconds: 300 } },
        { planned_seconds: 0 }
      )
    )
    render(<FocusPage />)
    expect(screen.getByText(/Speedrun · beat 5:00/)).toBeInTheDocument()
  })

  it("give-up routes through the stop flow with speedrun copy", async () => {
    runtime = makeRuntime(speedrunSession())
    render(<FocusPage />)
    fireEvent.click(screen.getByRole("button", { name: /Give up \(−HP\)/ }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent("Give up the run?")
    expect(dialog).toHaveTextContent(/HP is lost/)
    fireEvent.click(
      within(dialog).getByRole("button", { name: /Give up \(−HP\)/ })
    )
    expect(runtime.stop).toHaveBeenCalled()
  })

  it.each([
    ["win", "Speedrun cleared", /Done with 5:00 to spare/],
    ["miss", "Out of time", /HP lost/],
    ["record", "New personal best!", /5:00 → 4:30/],
    ["finished", "Run complete", /record stands at 5:00/],
    ["abandoned", "Run abandoned", /HP lost/],
  ])("ended copy for result %s", (result, title, description) => {
    const speedrun =
      result === "win"
        ? { type: "time_boxed", result, margin_seconds: 300 }
        : result === "record"
          ? {
              type: "beat_best",
              result,
              target_seconds: 300,
              record_seconds: 270,
              elapsed_seconds: 270,
            }
          : result === "finished"
            ? { type: "beat_best", result, record_seconds: 300 }
            : { type: "time_boxed", result }
    const terminal = result === "miss" || result === "abandoned"
    runtime = makeRuntime(
      speedrunSession(
        {
          status: terminal ? "abandoned" : "ended",
          ended_at: iso(T0 + 300_000),
          speedrun,
        },
        { status: terminal ? "abandoned" : "completed" }
      )
    )
    render(<FocusPage />)
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(description)).toBeInTheDocument()
  })
})
