import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DailiesColumn } from "./dailies-column"
import type { Daily } from "@/lib/api"

function daily(id: number, overrides: Partial<Daily> = {}): Daily {
  return {
    id,
    title: `daily ${id}`,
    notes: null,
    difficulty: "easy",
    recurrence: { kind: "daily" },
    streak: 0,
    active: true,
    reminder_times: [],
    items: [],
    completed_today: false,
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    ...overrides,
  }
}

function renderColumn(dailies: Daily[], onCheck = vi.fn()) {
  render(
    <DailiesColumn
      dailies={dailies}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      onCheck={onCheck}
    />
  )
  return onCheck
}

describe("DailiesColumn", () => {
  it("checks the whole daily with done=true, unchecks with done=false", () => {
    const onCheck = renderColumn([
      daily(1),
      daily(2, { completed_today: true }),
    ])

    fireEvent.click(screen.getByLabelText("Check daily 1"))
    expect(onCheck).toHaveBeenCalledWith(1, { done: true })

    fireEvent.click(screen.getByLabelText("Check daily 2"))
    expect(onCheck).toHaveBeenCalledWith(2, { done: false })
  })

  it("checks a sub-item by id — the proportional share stays server-side", () => {
    const onCheck = renderColumn([
      daily(1, {
        items: [
          { id: 11, title: "sit", position: 0, done_today: false },
          { id: 12, title: "journal", position: 1, done_today: true },
        ],
      }),
    ])

    fireEvent.click(screen.getByLabelText("Check sit"))
    expect(onCheck).toHaveBeenCalledWith(1, {
      daily_item_id: 11,
      done: true,
    })

    // Unchecking a done item is still allowed — it un-completes the day.
    fireEvent.click(screen.getByLabelText("Check journal"))
    expect(onCheck).toHaveBeenCalledWith(1, {
      daily_item_id: 12,
      done: false,
    })
  })

  it("keeps a still-open item disabled once the day is complete (already_checked)", () => {
    renderColumn([
      daily(1, {
        completed_today: true,
        items: [{ id: 11, title: "sit", position: 0, done_today: false }],
      }),
    ])
    expect(screen.getByLabelText("Check sit")).toBeDisabled()
  })

  it("disables checks on a paused (inactive) daily", () => {
    renderColumn([daily(1, { active: false })])
    expect(screen.getByLabelText("Check daily 1")).toBeDisabled()
    expect(screen.getByText("Paused")).toBeInTheDocument()
  })
})
