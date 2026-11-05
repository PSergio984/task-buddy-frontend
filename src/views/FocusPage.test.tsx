import { render, screen, fireEvent, within } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { FocusPage } from "./FocusPage"
import { makeRuntime, speedrunSession } from "@/lib/focus-session-test-utils"
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
      speedrunSession({
        phase: { status: "paused", pause_started_at: iso(T0 - 30_000) },
      })
    )
    render(<FocusPage />)
    expect(
      screen.getByText(/Paused — the clock keeps running/)
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Resume/ })).toBeInTheDocument()
  })

  it("beat-best shows the record it's chasing", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: { speedrun: { type: "beat_best", target_seconds: 300 } },
        phase: { planned_seconds: 0 },
      })
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

  it("time-boxed give-up drops the record clause — there is no record", async () => {
    runtime = makeRuntime(speedrunSession())
    render(<FocusPage />)
    fireEvent.click(screen.getByRole("button", { name: /Give up \(−HP\)/ }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent(/HP is lost\./)
    expect(dialog).not.toHaveTextContent(/record stands/)
  })

  it("beat-best give-up keeps the record clause", async () => {
    runtime = makeRuntime(
      speedrunSession({
        session: { speedrun: { type: "beat_best", target_seconds: 300 } },
        phase: { planned_seconds: 0 },
      })
    )
    render(<FocusPage />)
    fireEvent.click(screen.getByRole("button", { name: /Give up \(−HP\)/ }))
    const dialog = await screen.findByRole("alertdialog")
    expect(dialog).toHaveTextContent(/HP is lost and the record stands/)
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
              old_record_seconds: 300,
              elapsed_seconds: 270,
            }
          : result === "finished"
            ? { type: "beat_best", result, old_record_seconds: 300 }
            : { type: "time_boxed", result }
    const terminal = result === "miss" || result === "abandoned"
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: terminal ? "abandoned" : "ended",
          ended_at: iso(T0 + 300_000),
          speedrun,
        },
        phase: { status: terminal ? "abandoned" : "completed" },
      })
    )
    render(<FocusPage />)
    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText(description)).toBeInTheDocument()
  })

  it("a win without margin_seconds derives the spare off the leg's budget", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "ended",
          ended_at: iso(T0 + 300_000),
          speedrun: { type: "time_boxed", result: "win", elapsed_seconds: 300 },
        },
        phase: { status: "completed" },
      })
    )
    render(<FocusPage />)
    expect(screen.getByText("Speedrun cleared")).toBeInTheDocument()
    expect(screen.getByText(/Done with 5:00 to spare/)).toBeInTheDocument()
  })

  it("a record without old_record_seconds falls back to the start-time target", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "ended",
          ended_at: iso(T0 + 270_000),
          speedrun: {
            type: "beat_best",
            result: "record",
            target_seconds: 300,
            elapsed_seconds: 270,
          },
        },
        phase: { status: "completed", planned_seconds: 0 },
      })
    )
    render(<FocusPage />)
    expect(screen.getByText("New personal best!")).toBeInTheDocument()
    expect(screen.getByText(/5:00 → 4:30/)).toBeInTheDocument()
  })

  const judgedMiss = (speedrun: Record<string, unknown>) => {
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "abandoned",
          ended_at: iso(T0 + 120_000),
          speedrun: { type: "time_boxed", ...speedrun },
        },
        phase: { status: "abandoned" },
      })
    )
    render(<FocusPage />)
  }

  it("a give-up miss reads as abandoned, not out-of-time (reason: abandon)", () => {
    judgedMiss({ result: "miss", reason: "abandon", elapsed_seconds: 120 })
    expect(screen.getByText("Run abandoned")).toBeInTheDocument()
    expect(screen.getByText(/HP lost/)).toBeInTheDocument()
    expect(screen.queryByText("Out of time")).not.toBeInTheDocument()
  })

  it("a timeout miss keeps the out-of-time copy (reason: timeout)", () => {
    judgedMiss({ result: "miss", reason: "timeout", elapsed_seconds: 600 })
    expect(screen.getByText("Out of time")).toBeInTheDocument()
    expect(screen.getByText(/clock hit zero/)).toBeInTheDocument()
    expect(screen.queryByText("Run abandoned")).not.toBeInTheDocument()
  })

  it("a reason-less miss falls back to the clock — early elapsed means give-up", () => {
    judgedMiss({ result: "miss", elapsed_seconds: 120 })
    expect(screen.getByText("Run abandoned")).toBeInTheDocument()
  })

  it("a reason-less miss at the deadline reads as the timeout", () => {
    judgedMiss({ result: "miss", elapsed_seconds: 600 })
    expect(screen.getByText("Out of time")).toBeInTheDocument()
  })

  it("a reason-less miss on an open clock is a give-up — beat-best can't time out", () => {
    // beat_best legs run planned_seconds 0: an unjudgable miss must read
    // "abandon", never "Out of time".
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "abandoned",
          ended_at: iso(T0 + 120_000),
          speedrun: { type: "beat_best", result: "miss", elapsed_seconds: 120 },
        },
        phase: { status: "abandoned", planned_seconds: 0 },
      })
    )
    render(<FocusPage />)
    expect(screen.getByText("Run abandoned")).toBeInTheDocument()
    expect(screen.queryByText("Out of time")).not.toBeInTheDocument()
  })

  it("an unjudged end shows neutral copy — no HP claim without a verdict", () => {
    runtime = makeRuntime(
      speedrunSession({
        session: {
          status: "ended",
          ended_at: iso(T0 + 300_000),
          speedrun: { type: "time_boxed" },
        },
        phase: { status: "completed" },
      })
    )
    render(<FocusPage />)
    expect(screen.getByText("Run ended")).toBeInTheDocument()
    expect(screen.queryByText(/HP lost/)).not.toBeInTheDocument()
    expect(screen.queryByText("Session abandoned")).not.toBeInTheDocument()
  })
})
