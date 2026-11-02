import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { HabitsColumn } from "./habits-column"
import type { Habit } from "@/lib/api"

function habit(id: number, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    title: `habit ${id}`,
    notes: null,
    direction: "both",
    difficulty: "easy",
    value: 0,
    counter: 0,
    bind_focus: false,
    reminder_times: [],
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    ...overrides,
  }
}

function renderColumn(habits: Habit[], onClick = vi.fn()) {
  render(
    <HabitsColumn
      habits={habits}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      onClick={onClick}
    />
  )
  return onClick
}

describe("HabitsColumn", () => {
  it("renders only the click buttons the habit's direction accepts", () => {
    renderColumn([
      habit(1, { direction: "positive" }),
      habit(2, { direction: "negative" }),
      habit(3, { direction: "both" }),
    ])

    expect(screen.getByLabelText("+click habit 1")).toBeInTheDocument()
    expect(screen.queryByLabelText("−click habit 1")).not.toBeInTheDocument()

    expect(screen.getByLabelText("−click habit 2")).toBeInTheDocument()
    expect(screen.queryByLabelText("+click habit 2")).not.toBeInTheDocument()

    expect(screen.getByLabelText("+click habit 3")).toBeInTheDocument()
    expect(screen.getByLabelText("−click habit 3")).toBeInTheDocument()
  })

  it("sends the click direction to onClick", () => {
    const onClick = renderColumn([habit(1)])
    fireEvent.click(screen.getByLabelText("+click habit 1"))
    expect(onClick).toHaveBeenCalledWith(1, "positive")
    fireEvent.click(screen.getByLabelText("−click habit 1"))
    expect(onClick).toHaveBeenCalledWith(1, "negative")
  })

  it("disables clicks while offline instead of pretending to queue them", () => {
    render(
      <HabitsColumn
        habits={[habit(1)]}
        isPending={false}
        isError={false}
        isOnline={false}
        writesDisabled
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByLabelText("+click habit 1")).toBeDisabled()
    expect(
      screen.queryByRole("button", { name: /edit habit 1/i })
    ).not.toBeInTheDocument()
  })
})
