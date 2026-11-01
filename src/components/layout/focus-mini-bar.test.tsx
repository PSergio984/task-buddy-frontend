import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { MemoryRouter } from "react-router-dom"

import type { FocusSession, SessionPhaseOut } from "@/lib/api"
import type { SessionView } from "@/lib/focus-session"

const mockRuntime = {
  session: null as FocusSession | null,
  view: null as SessionView | null,
  isLocal: false,
  mirrored: false,
}

vi.mock("@/contexts/FocusSessionContext", () => ({
  useFocusSession: () => mockRuntime,
}))

import { FocusMiniBar } from "./focus-mini-bar"

const phase = (over: Partial<SessionPhaseOut> = {}): SessionPhaseOut => ({
  seq: 0,
  kind: "focus",
  status: "active",
  planned_seconds: 1500,
  actual_seconds: null,
  pause_count: 0,
  paused_seconds: 0,
  pause_started_at: null,
  started_at: "2026-11-01T10:00:00Z",
  ended_at: null,
  ...over,
})

const session: FocusSession = {
  id: 7,
  mode: "timer",
  status: "active",
  task_id: null,
  activity_label: null,
  preset: null,
  pause_budget_count: 3,
  pause_budget_seconds: 300,
  started_at: "2026-11-01T10:00:00Z",
  ended_at: null,
  phases: [phase()],
}

const view = (over: Partial<SessionView> = {}): SessionView => ({
  status: "running",
  live: phase(),
  pending: null,
  clockSeconds: 24 * 60 + 57,
  progress: 0.5,
  kindLabel: "Focus · phase 1/4",
  focusDone: 0,
  focusTotal: 4,
  pausesLeft: 2,
  pauseUsedSec: 0,
  pauseBudgetSec: 300,
  graceEndsInSec: null,
  nextDeadlineMs: null,
  ...over,
})

function renderBar(path = "/tasks") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FocusMiniBar />
    </MemoryRouter>
  )
}

describe("FocusMiniBar", () => {
  beforeEach(() => {
    mockRuntime.session = session
    mockRuntime.view = view()
    mockRuntime.isLocal = false
    mockRuntime.mirrored = false
  })

  it("renders phase label and countdown while a session runs", () => {
    renderBar()
    const chip = screen.getByRole("button", { name: /focus session/i })
    expect(chip).toHaveTextContent("Focus · phase 1/4")
    expect(chip).toHaveTextContent("24:57")
  })

  it("renders nothing when there is no session", () => {
    mockRuntime.session = null
    mockRuntime.view = null
    const { container } = renderBar()
    expect(container).toBeEmptyDOMElement()
  })

  it("hides on /focus (the page already shows the readout)", () => {
    const { container } = renderBar("/focus")
    expect(container).toBeEmptyDOMElement()
  })

  it("hides once the session reaches a terminal state", () => {
    mockRuntime.view = view({ status: "ended" })
    const { container } = renderBar()
    expect(container).toBeEmptyDOMElement()
  })

  it("shows paused styling while paused", () => {
    mockRuntime.view = view({ status: "paused" })
    renderBar()
    expect(screen.getByRole("button", { name: /focus session/i }))
      .toBeInTheDocument()
  })
})
