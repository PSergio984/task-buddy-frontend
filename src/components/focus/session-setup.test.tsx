import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionSetup } from "./session-setup"
import { DEFAULT_FOCUS_SETTINGS, type FocusSettings } from "@/lib/focus-session"
import type { SpeedrunPB } from "@/lib/api"

vi.mock("@/hooks/useTasks", () => ({ useTasks: () => ({ data: [] }) }))
vi.mock("@/hooks/useTags", () => ({ useTags: () => ({ data: [] }) }))

let online = true
vi.mock("@/hooks/useIsOnline", () => ({ useIsOnline: () => online }))

let pbs: SpeedrunPB[] = []
vi.mock("@/hooks/useGameCharacter", () => ({
  useActivityStats: () => ({ data: { speedrun_pbs: pbs } }),
}))

const speedrunSettings = (
  over: Partial<FocusSettings> = {}
): FocusSettings => ({
  ...DEFAULT_FOCUS_SETTINGS,
  mode: "speedrun",
  ...over,
})

function renderSetup(
  settings: FocusSettings,
  onChange = vi.fn(),
  onStart = vi.fn()
) {
  return render(
    <SessionSetup
      settings={settings}
      onChange={onChange}
      onStart={onStart}
      onOpenSettings={vi.fn()}
      busy={false}
    />
  )
}

describe("SessionSetup speedrun (#69)", () => {
  beforeEach(() => {
    online = true
    pbs = []
    vi.clearAllMocks()
  })

  it("selecting the speedrun card opens the kind sub-panel", () => {
    const onChange = vi.fn()
    renderSetup({ ...DEFAULT_FOCUS_SETTINGS }, onChange)
    fireEvent.click(screen.getByRole("button", { name: /Speedrun/ }))
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "speedrun" })
    )

    renderSetup(speedrunSettings())
    expect(
      screen.getByRole("button", { name: /Time-boxed/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Beat your best/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("spinbutton", { name: /Budget/ })
    ).toBeInTheDocument()
    expect(screen.getByText(/Done before zero wins/)).toBeInTheDocument()
  })

  it("time-boxed start needs a positive budget", () => {
    const onStart = vi.fn()
    const { rerender } = renderSetup(
      speedrunSettings({ speedrunBudgetMin: Number.NaN }),
      vi.fn(),
      onStart
    )
    const start = screen.getByRole("button", { name: /Start session/ })
    expect(start).toBeDisabled()

    rerender(
      <SessionSetup
        settings={speedrunSettings({ speedrunBudgetMin: 15 })}
        onChange={vi.fn()}
        onStart={onStart}
        onOpenSettings={vi.fn()}
        busy={false}
      />
    )
    expect(start).toBeEnabled()
    fireEvent.click(start)
    expect(onStart).toHaveBeenCalled()
  })

  it("beat-best start needs an activity label", () => {
    const onChange = vi.fn()
    const { rerender } = renderSetup(
      speedrunSettings({ speedrunKind: "beat_best", activityLabel: "" }),
      onChange
    )
    const start = screen.getByRole("button", { name: /Start session/ })
    expect(start).toBeDisabled()

    const input = screen.getByRole("textbox", { name: /Activity label/ })
    fireEvent.change(input, { target: { value: "Deep work" } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ activityLabel: "Deep work" })
    )

    rerender(
      <SessionSetup
        settings={speedrunSettings({
          speedrunKind: "beat_best",
          activityLabel: "Deep work",
        })}
        onChange={onChange}
        onStart={vi.fn()}
        onOpenSettings={vi.fn()}
        busy={false}
      />
    )
    expect(screen.getByRole("button", { name: /Start session/ })).toBeEnabled()
  })

  it("shows the record to beat for a known label, else the first-run copy", () => {
    pbs = [
      {
        activity_label: "Deep work",
        best_seconds: 300,
        attempts: 3,
        set_at: "2025-11-01T09:00:00Z",
      },
    ]
    const { rerender } = renderSetup(
      speedrunSettings({
        speedrunKind: "beat_best",
        activityLabel: "Deep work",
      })
    )
    expect(
      screen.getByText(/Record to beat: 5:00 · 3 attempts/)
    ).toBeInTheDocument()

    rerender(
      <SessionSetup
        settings={speedrunSettings({
          speedrunKind: "beat_best",
          activityLabel: "Inbox zero",
        })}
        onChange={vi.fn()}
        onStart={vi.fn()}
        onOpenSettings={vi.fn()}
        busy={false}
      />
    )
    expect(screen.getByText(/First run sets the record/)).toBeInTheDocument()
  })

  it("disables the speedrun card while offline — records are server state", () => {
    online = false
    renderSetup({ ...DEFAULT_FOCUS_SETTINGS })
    const card = screen.getByRole("button", { name: /Speedrun/ })
    expect(card).toBeDisabled()
    expect(card).toHaveTextContent(/Needs a connection/)
  })

  it("an offline speedrun selection can't start and explains why", () => {
    online = false
    renderSetup(speedrunSettings())
    expect(screen.getByText(/speedruns need a connection/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start session/ })).toBeDisabled()
  })
})
