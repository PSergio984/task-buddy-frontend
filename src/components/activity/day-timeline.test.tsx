import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DayTimeline } from "./day-timeline"
import { buildDayTimeline } from "@/lib/timeline"
import type { TimelineDayResponse } from "@/lib/api"

vi.mock("@/hooks/useTasks", () => ({
  useTasks: () => ({ data: [] }),
}))

const DAY = "2025-11-01"

function response(markers: TimelineDayResponse["markers"]) {
  return {
    date: DAY,
    sessions: [],
    markers,
    diary: [],
    server_time: `${DAY}T20:00:00Z`,
  }
}

describe("DayTimeline marker edge positions", () => {
  it("keeps edge markers fully inside the clipped axis", () => {
    // frac 0 (event at 00:00Z) and frac 1 (post-midnight clamp): a centered
    // dot would lose half its width to the container's overflow clip.
    const view = buildDayTimeline(
      response([
        {
          id: 1,
          type: "session_started",
          ts: `${DAY}T00:00:00Z`,
          outcome: null,
        },
        {
          id: 2,
          type: "habit_clicked",
          ts: "2025-11-02T00:30:00Z",
          outcome: null,
        },
      ])
    )
    expect(view.markers[0].frac).toBe(0)
    expect(view.markers[1].frac).toBe(1)

    render(<DayTimeline timeline={view} />)
    const atStart = screen.getByRole("img", {
      name: /session started at 00:00 utc/i,
    })
    const atEnd = screen.getByRole("img", { name: /habit clicked at 00:30/i })
    expect(atStart.className).toContain("translate-x-0")
    expect(atEnd.className).toContain("-translate-x-full")
  })
})
