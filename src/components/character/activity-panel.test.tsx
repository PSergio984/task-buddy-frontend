import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ActivityPanel } from "./activity-panel"
import type { ActivityDay, ActivityGrid, ActivityStats } from "@/lib/api"

// jsdom lacks ResizeObserver, which the Radix tooltip popper measures with.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)

function day(date: string, overrides: Partial<ActivityDay> = {}): ActivityDay {
  return {
    date,
    score: 0,
    focus_minutes: 0,
    events: {},
    tier: 0,
    ...overrides,
  }
}

function grid(days: ActivityDay[]): ActivityGrid {
  return {
    start: days[0]?.date ?? "2025-11-01",
    end: days[days.length - 1]?.date ?? "2025-11-01",
    days,
    tier_thresholds: [1, 15, 35, 60],
    server_time: "2025-11-08T10:00:00Z",
  }
}

function stats(overrides: Partial<ActivityStats> = {}): ActivityStats {
  return {
    start: "2025-11-01",
    end: "2025-11-08",
    avg_hours_per_day: 1.5,
    total_hours: 12,
    current_streak: 3,
    longest_streak: 9,
    best_day: { date: "2025-11-05", score: 80 },
    weekly_total: 42,
    speedrun_pbs: null,
    server_time: "2025-11-08T10:00:00Z",
    ...overrides,
  }
}

function renderPanel(
  g: ActivityGrid | undefined,
  s: ActivityStats | undefined,
  props: Record<string, unknown> = {}
) {
  return render(
    <TooltipProvider delayDuration={0}>
      <ActivityPanel
        grid={g}
        stats={s}
        gridIsPending={false}
        gridIsError={false}
        statsIsPending={false}
        statsIsError={false}
        isOnline
        onGridRetry={vi.fn()}
        onStatsRetry={vi.fn()}
        {...props}
      />
    </TooltipProvider>
  )
}

describe("ActivityPanel", () => {
  it("colors cells by the tier the score reaches via tier_thresholds", () => {
    const { container } = renderPanel(
      grid([day("2025-11-01", { score: 0 }), day("2025-11-02", { score: 40 })]),
      undefined
    )
    const cells = container.querySelectorAll("button.h-3\\.5")
    // tier 0 → muted swatch; score 40 ≥ 35 → tier 3 → emerald-600.
    expect(cells[0].className).toContain("bg-white/5")
    expect(cells[1].className).toContain("bg-emerald-600")
  })

  it("shows date, focus minutes and event counts in the day tooltip", async () => {
    renderPanel(
      grid([
        day("2025-11-03", {
          score: 20,
          focus_minutes: 45,
          events: { habit_click: 3, daily_check: 1 },
        }),
      ]),
      undefined
    )

    fireEvent.focus(screen.getByLabelText("Mon, Nov 3: 20 pts, 45m focus"))
    const tooltip = await screen.findByRole("tooltip")
    expect(tooltip).toHaveTextContent("Mon, Nov 3 — 20 pts")
    expect(tooltip).toHaveTextContent("45m focus")
    expect(tooltip).toHaveTextContent("habit click ×3")
    expect(tooltip).toHaveTextContent("daily check ×1")
  })

  it("renders the stat row from the stats payload", () => {
    renderPanel(grid([day("2025-11-01")]), stats())
    expect(screen.getByText("Avg / day")).toBeInTheDocument()
    expect(screen.getByText("1.5h")).toBeInTheDocument()
    expect(screen.getByText("3d")).toBeInTheDocument()
    expect(screen.getByText("9d")).toBeInTheDocument()
    expect(screen.getByText(/Nov 5 · 80/)).toBeInTheDocument()
    expect(screen.getByText("42 pts")).toBeInTheDocument()
  })

  it("keeps the grid visible and retries only the failed stats section", () => {
    const onStatsRetry = vi.fn()
    renderPanel(grid([day("2025-11-01")]), undefined, {
      statsIsError: true,
      onStatsRetry,
    })

    expect(screen.getByText("Activity")).toBeInTheDocument()
    expect(
      screen.getByText(/Couldn't load your activity stats/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }))
    expect(onStatsRetry).toHaveBeenCalled()
  })

  it("keeps the stat chips visible and retries only the failed grid section", () => {
    const onGridRetry = vi.fn()
    renderPanel(undefined, stats(), {
      gridIsError: true,
      onGridRetry,
    })

    expect(screen.getByText("Avg / day")).toBeInTheDocument()
    expect(
      screen.getByText(/Couldn't load the activity grid/)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }))
    expect(onGridRetry).toHaveBeenCalled()
  })

  it("explains the missing cache on an offline cold-open", () => {
    renderPanel(undefined, undefined, {
      gridIsPending: true,
      statsIsPending: true,
      isOnline: false,
    })
    expect(
      screen.getByText(/activity stats aren't in the local cache/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/activity grid isn't in the local cache/)
    ).toBeInTheDocument()
  })
})
