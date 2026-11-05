import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { SessionSettingsSheet } from "./session-settings-sheet"
import { DEFAULT_FOCUS_SETTINGS, type FocusSettings } from "@/lib/focus-session"

const settings = { ...DEFAULT_FOCUS_SETTINGS }

function renderSheet(
  onChange: (s: FocusSettings) => void,
  overrides: Partial<FocusSettings> = {}
) {
  return render(
    <SessionSettingsSheet
      open
      onOpenChange={() => {}}
      settings={{ ...settings, ...overrides }}
      onChange={onChange}
    />
  )
}

describe("SessionSettingsSheet NumberField", () => {
  it("lets the user type a multi-digit value; commits clamped on blur", () => {
    const onChange = vi.fn()
    renderSheet(onChange)
    const input = screen.getByLabelText("Total seconds")
    fireEvent.focus(input)
    // Every keystroke must NOT clamp mid-type — "1" alone would snap to 60.
    fireEvent.change(input, { target: { value: "1" } })
    expect(input).toHaveValue(1)
    fireEvent.change(input, { target: { value: "12" } })
    fireEvent.change(input, { target: { value: "120" } })
    expect(input).toHaveValue(120)
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pauseSeconds: 120 })
    )
  })

  it("an empty or invalid field reverts to the last valid value on blur", () => {
    const onChange = vi.fn()
    renderSheet(onChange)
    const input = screen.getByLabelText("Total seconds")
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "" } })
    expect((input as HTMLInputElement).value).toBe("")
    fireEvent.blur(input)
    expect(onChange).not.toHaveBeenCalled()
    expect(input).toHaveValue(settings.pauseSeconds)
  })

  it("commits on Enter and clamps an out-of-range value", () => {
    const onChange = vi.fn()
    renderSheet(onChange)
    const input = screen.getByLabelText("Total seconds")
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: "99999" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ pauseSeconds: 3600 })
    )
  })
})

describe("SessionSettingsSheet mode gating (#69)", () => {
  it("hides auto-start and pause budget in speedrun mode — the start request drops them", () => {
    renderSheet(vi.fn(), { mode: "speedrun" })
    expect(screen.queryByText("Auto-start")).not.toBeInTheDocument()
    expect(screen.queryByText(/Pause budget/)).not.toBeInTheDocument()
  })

  it("keeps both sections for the modes that send them", () => {
    renderSheet(vi.fn(), { mode: "stopwatch" })
    expect(screen.getByText("Auto-start")).toBeInTheDocument()
    expect(screen.getByText(/Pause budget/)).toBeInTheDocument()
  })
})
