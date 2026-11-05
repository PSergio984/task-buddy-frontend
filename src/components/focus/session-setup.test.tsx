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
let statsLoaded = true
let statsFailed = false
let statsEnabledArg: boolean | undefined
vi.mock("@/hooks/useGameCharacter", () => ({
  useActivityStats: (enabled?: boolean) => {
    statsEnabledArg = enabled
    return {
      data: statsLoaded ? { speedrun_pbs: pbs } : undefined,
      isPending: !statsLoaded && !statsFailed,
      isError: statsFailed,
    }
  },
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
    statsLoaded = true
    statsFailed = false
    statsEnabledArg = undefined
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

    // A text input with a datalist is ARIA-combobox, not textbox.
    const input = screen.getByRole("combobox", { name: /Activity label/ })
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

  it("fetches the PB table only for a beat-best run", () => {
    renderSetup({ ...DEFAULT_FOCUS_SETTINGS })
    expect(statsEnabledArg).toBe(false)

    // Time-boxed never reads the record table — no record to chase.
    renderSetup(speedrunSettings({ speedrunKind: "time_boxed" }))
    expect(statsEnabledArg).toBe(false)

    renderSetup(speedrunSettings({ speedrunKind: "beat_best" }))
    expect(statsEnabledArg).toBe(true)
  })

  it.each([
    [9999, 600],
    [0, 1],
  ])(
    "a blurred out-of-range budget (%i) writes back clamped (NumberField precedent)",
    (typed, clamped) => {
      const onChange = vi.fn()
      renderSetup(speedrunSettings({ speedrunBudgetMin: typed }), onChange)
      fireEvent.blur(screen.getByRole("spinbutton", { name: /Budget/ }))
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ speedrunBudgetMin: clamped })
      )
    }
  )

  it("an empty blurred budget stays untouched (revert, not clamp-to-min)", () => {
    const onChange = vi.fn()
    renderSetup(speedrunSettings({ speedrunBudgetMin: Number.NaN }), onChange)
    fireEvent.blur(screen.getByRole("spinbutton", { name: /Budget/ }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it("caps the activity label at the backend's 200 chars", () => {
    renderSetup(speedrunSettings({ speedrunKind: "beat_best" }))
    expect(
      screen.getByRole("combobox", { name: /Activity label/ })
    ).toHaveAttribute("maxLength", "200")
  })

  it("shows a neutral line while the record table is still loading", () => {
    statsLoaded = false
    renderSetup(
      speedrunSettings({
        speedrunKind: "beat_best",
        activityLabel: "Deep work",
      })
    )
    expect(screen.getByText(/Checking your record/)).toBeInTheDocument()
    expect(
      screen.queryByText(/First run sets the record/)
    ).not.toBeInTheDocument()
  })

  it("a failed record lookup says so without blocking the run", () => {
    statsLoaded = false
    statsFailed = true
    renderSetup(
      speedrunSettings({
        speedrunKind: "beat_best",
        activityLabel: "Deep work",
      })
    )
    expect(
      screen.getByText(/Couldn't load your record — the run still counts/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/Checking your record/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Start session/ })).toBeEnabled()
  })

  it("offers the known PB labels as datalist options", () => {
    pbs = [
      {
        activity_label: "Deep work",
        best_seconds: 300,
        attempts: 3,
        set_at: "2025-11-01T09:00:00Z",
      },
      {
        activity_label: "Inbox zero",
        best_seconds: 320,
        attempts: 1,
        set_at: "2025-11-02T09:00:00Z",
      },
    ]
    renderSetup(speedrunSettings({ speedrunKind: "beat_best" }))
    const input = screen.getByRole("combobox", { name: /Activity label/ })
    expect(input).toHaveAttribute("list", "speedrun-label-options")
    const options = document
      .getElementById("speedrun-label-options")
      ?.querySelectorAll("option")
    expect(options).toHaveLength(2)
    expect(options?.[0]).toHaveAttribute("value", "Deep work")
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
    // The seconds render in their own mono span — assert the whole line's
    // textContent, and the tabular styling on the number.
    expect(screen.getByRole("status").textContent).toBe(
      "Record to beat: 5:00 · 3 attempts"
    )
    expect(screen.getByText("5:00")).toHaveClass("font-mono", "tabular-nums")

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
