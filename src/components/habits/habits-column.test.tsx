import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { HabitsColumn } from "./habits-column"
import { offlineDraftChecks } from "../game-column-test-utils"
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

function renderEditable(row: Habit) {
  const onUpdate = vi.fn()
  render(
    <HabitsColumn
      habits={[row]}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      onUpdate={onUpdate}
    />
  )
  fireEvent.click(screen.getByLabelText(`Edit ${row.title}`))
  expect(screen.getByTestId("habit-form")).toBeInTheDocument()
  return onUpdate
}

// A successful save closes the editor inside a promise .then — flush that
// microtask inside act or React warns about an unwrapped state update.
const save = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save habit" }))
  })
}

const offlineDrafts = offlineDraftChecks({
  Column: HabitsColumn,
  listProp: "habits",
  row: habit(1),
  noun: "habit",
})

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

  it("omits reminder_times from the PATCH when the slot is unchanged", async () => {
    // The field full-replaces server-side — an untouched slot must not
    // truncate the stored tail.
    const onUpdate = renderEditable(
      habit(1, { reminder_times: ["07:00", "21:00"] })
    )
    await save()
    const patch = onUpdate.mock.calls[0][1]
    expect(patch).not.toHaveProperty("reminder_times")
  })

  it("merges an edited reminder slot over the stored tail", async () => {
    const onUpdate = renderEditable(
      habit(1, { reminder_times: ["07:00", "21:00"] })
    )
    fireEvent.change(screen.getByLabelText("Reminder"), {
      target: { value: "08:30" },
    })
    await save()
    expect(onUpdate.mock.calls[0][1].reminder_times).toEqual(["08:30", "21:00"])
  })

  it("a cleared reminder slot promotes the stored tail", async () => {
    const onUpdate = renderEditable(
      habit(1, { reminder_times: ["07:00", "21:00"] })
    )
    fireEvent.change(screen.getByLabelText("Reminder"), {
      target: { value: "" },
    })
    await save()
    expect(onUpdate.mock.calls[0][1].reminder_times).toEqual(["21:00"])
  })

  it("explains the missing cache instead of loading forever on an offline cold-open", () => {
    // A paused query stays isPending — without the offline branch the
    // skeletons would render indefinitely.
    render(
      <HabitsColumn
        habits={undefined}
        isPending
        isError={false}
        isOnline={false}
        writesDisabled
        onRetry={vi.fn()}
      />
    )
    expect(
      screen.getByText(/offline and your habits aren't in the local cache/i)
    ).toBeInTheDocument()
  })

  it("keeps an open edit draft when the connection drops mid-edit", () => {
    offlineDrafts.edit()
  })

  it("keeps an open create draft when the connection drops mid-create", () => {
    offlineDrafts.create()
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
