import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { FloatingSidebar } from "../FloatingSidebar"
import { FocusStageHud } from "../FocusStageHud"

describe("FloatingSidebar", () => {
  it("renders the brand cluster with TASK BUDDY and PRO badge", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("TASK BUDDY")).toBeInTheDocument()
    expect(screen.getByText("PRO")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Toggle Sidebar" })
    ).toBeInTheDocument()
  })

  it("renders quick jump search bar", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("Quick jump...")).toBeInTheDocument()
    expect(screen.getByText("⌘K")).toBeInTheDocument()
  })

  it("renders all 4 views (Focus, Tasks, Habits, Rooms)", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("Focus")).toBeInTheDocument()
    expect(screen.getByText("Tasks")).toBeInTheDocument()
    expect(screen.getByText("Habits")).toBeInTheDocument()
    expect(screen.getByText("Rooms")).toBeInTheDocument()

    // Counts & badges
    expect(screen.getByText("NOW")).toBeInTheDocument()
    expect(screen.getByText("14")).toBeInTheDocument()
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText(/3 LIVE/)).toBeInTheDocument()
  })

  it("calls onSelectView when clicking a view item", () => {
    const handleSelectView = vi.fn()
    render(
      <FloatingSidebar activeView="focus" onSelectView={handleSelectView} />
    )

    fireEvent.click(screen.getByText("Tasks"))
    expect(handleSelectView).toHaveBeenCalledWith("tasks")

    fireEvent.click(screen.getByText("Habits"))
    expect(handleSelectView).toHaveBeenCalledWith("habits")

    fireEvent.click(screen.getByText("Rooms"))
    expect(handleSelectView).toHaveBeenCalledWith("rooms")

    fireEvent.click(screen.getByText("Focus"))
    expect(handleSelectView).toHaveBeenCalledWith("focus")
  })

  it("renders streams section with items", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("02 — Streams")).toBeInTheDocument()
    expect(screen.getByText("Design Tokens")).toBeInTheDocument()
    expect(screen.getByText("Mobile Parity")).toBeInTheDocument()
    expect(screen.getByText("Tauri Desktop")).toBeInTheDocument()
    expect(screen.getByText("P1")).toBeInTheDocument()
    expect(screen.getByText("P2")).toBeInTheDocument()
    expect(screen.getByText("P3")).toBeInTheDocument()
  })

  it("renders daily target mini-widget with progress indicator", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText(/DAILY TARGET/i)).toBeInTheDocument()
    expect(screen.getByText("3/4 SESSIONS")).toBeInTheDocument()
  })

  it("renders theme row with LIGHT and DARK options and triggers onToggleTheme", () => {
    const handleToggleTheme = vi.fn()
    render(
      <FloatingSidebar
        activeView="focus"
        theme="dark"
        onToggleTheme={handleToggleTheme}
      />
    )

    expect(screen.getByText("Theme")).toBeInTheDocument()
    expect(screen.getByText("LIGHT")).toBeInTheDocument()
    expect(screen.getByText("DARK")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Theme"))
    expect(handleToggleTheme).toHaveBeenCalledTimes(1)
  })

  it("renders audio row with animated bars and LO-FI badge", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("Audio")).toBeInTheDocument()
    expect(screen.getByText("LO-FI")).toBeInTheDocument()
  })

  it("renders settings row with shortcut chip", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("Settings")).toBeInTheDocument()
    expect(screen.getByText("⌘,")).toBeInTheDocument()
  })

  it("renders user profile row with Preston S., Studio · Pro Tier, and initials avatar", () => {
    render(<FloatingSidebar activeView="focus" />)
    expect(screen.getByText("Preston S.")).toBeInTheDocument()
    expect(screen.getByText("Studio · Pro Tier")).toBeInTheDocument()
    expect(screen.getByText("PS")).toBeInTheDocument()
  })
})

describe("FocusStageHud", () => {
  it("renders default session label, 50:00 time, and meta context", () => {
    render(<FocusStageHud />)
    expect(screen.getByText("01 — CURRENT SESSION · 1/4")).toBeInTheDocument()
    expect(screen.getByText("50:00")).toBeInTheDocument()
    expect(screen.getByText("ENGINEERING // TASK_BUDDY_L2")).toBeInTheDocument()
    expect(screen.getByText("START FOCUS")).toBeInTheDocument()
    expect(screen.getByText("RESET")).toBeInTheDocument()
  })

  it("renders custom time remaining", () => {
    render(<FocusStageHud timeRemaining="25:00" />)
    expect(screen.getByText("25:00")).toBeInTheDocument()
  })

  it("toggles between START FOCUS and PAUSE when isPlaying changes", () => {
    const { rerender } = render(<FocusStageHud isPlaying={false} />)
    expect(screen.getByText("START FOCUS")).toBeInTheDocument()

    rerender(<FocusStageHud isPlaying={true} />)
    expect(screen.getByText("PAUSE")).toBeInTheDocument()
  })

  it("handles onTogglePlay and onReset callbacks", () => {
    const onTogglePlay = vi.fn()
    const onReset = vi.fn()
    render(<FocusStageHud onTogglePlay={onTogglePlay} onReset={onReset} />)

    fireEvent.click(screen.getByRole("button", { name: /start focus/i }))
    expect(onTogglePlay).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole("button", { name: /reset timer/i }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
