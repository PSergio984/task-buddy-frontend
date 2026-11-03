import { render, screen, fireEvent, act } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DailiesColumn } from "./dailies-column"
import { offlineDraftChecks } from "../game-column-test-utils"
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

function renderEditable(row: Daily) {
  const onUpdate = vi.fn()
  render(
    <DailiesColumn
      dailies={[row]}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      onUpdate={onUpdate}
    />
  )
  fireEvent.click(screen.getByLabelText(`Edit ${row.title}`))
  expect(screen.getByTestId("daily-form")).toBeInTheDocument()
  return onUpdate
}

// A successful save closes the editor inside a promise .then — flush that
// microtask inside act or React warns about an unwrapped state update.
const submit = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Save daily" }))
  })
}

const offlineDrafts = offlineDraftChecks({
  Column: DailiesColumn,
  listProp: "dailies",
  row: daily(1),
  noun: "daily",
})

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

  it("explains the missing cache instead of loading forever on an offline cold-open", () => {
    // A paused query stays isPending — without the offline branch the
    // skeletons would render indefinitely.
    render(
      <DailiesColumn
        dailies={undefined}
        isPending
        isError={false}
        isOnline={false}
        writesDisabled
        onRetry={vi.fn()}
      />
    )
    expect(
      screen.getByText(/offline and your dailies aren't in the local cache/i)
    ).toBeInTheDocument()
  })

  it("keeps an open edit draft when the connection drops mid-edit", () => {
    offlineDrafts.edit()
  })

  it("keeps an open create draft when the connection drops mid-create", () => {
    offlineDrafts.create()
  })

  it("disables checks on a paused (inactive) daily", () => {
    renderColumn([daily(1, { active: false })])
    expect(screen.getByLabelText("Check daily 1")).toBeDisabled()
    expect(screen.getByText("Paused")).toBeInTheDocument()
  })

  it("omits items from the PATCH when the checklist text is unchanged", async () => {
    // An items PATCH full-replaces DailyItems — sending it on an unrelated
    // edit cascade-deletes today's item check marks.
    const onUpdate = renderEditable(
      daily(1, {
        items: [
          { id: 11, title: "sit", position: 0, done_today: true },
          { id: 12, title: "journal", position: 1, done_today: false },
        ],
      })
    )
    fireEvent.change(screen.getByLabelText(/^daily$/i), {
      target: { value: "renamed" },
    })
    await submit()
    const patch = onUpdate.mock.calls[0][1]
    expect(patch.title).toBe("renamed")
    expect(patch).not.toHaveProperty("items")
  })

  it("omits items when the checklist text changed only in whitespace", async () => {
    const onUpdate = renderEditable(
      daily(1, {
        items: [{ id: 11, title: "sit", position: 0, done_today: false }],
      })
    )
    fireEvent.change(screen.getByLabelText(/checklist/i), {
      target: { value: "  sit  \n\n" },
    })
    fireEvent.change(screen.getByLabelText(/^daily$/i), {
      target: { value: "renamed" },
    })
    await submit()
    expect(onUpdate.mock.calls[0][1]).not.toHaveProperty("items")
  })

  it("sends the parsed checklist only once the text changed", async () => {
    const onUpdate = renderEditable(
      daily(1, {
        items: [{ id: 11, title: "sit", position: 0, done_today: false }],
      })
    )
    fireEvent.change(screen.getByLabelText(/checklist/i), {
      target: { value: "sit\njournal" },
    })
    await submit()
    expect(onUpdate.mock.calls[0][1].items).toEqual([
      { title: "sit" },
      { title: "journal" },
    ])
  })

  it("blocks saving a checklist beyond the backend bounds", async () => {
    // DailyIn.items ≤30 rows, DailyItemIn.title ≤200 — the textarea has no
    // per-line maxlength, so the form gates the submit instead.
    const onUpdate = renderEditable(daily(1))
    fireEvent.change(screen.getByLabelText(/checklist/i), {
      target: {
        value: Array.from({ length: 31 }, (_, i) => `item ${i}`).join("\n"),
      },
    })
    expect(screen.getByRole("button", { name: "Save daily" })).toBeDisabled()
    expect(onUpdate).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText(/checklist/i), {
      target: { value: "x".repeat(201) },
    })
    expect(screen.getByRole("button", { name: "Save daily" })).toBeDisabled()

    fireEvent.change(screen.getByLabelText(/checklist/i), {
      target: { value: "ok" },
    })
    await submit()
    expect(onUpdate).toHaveBeenCalled()
  })

  it("omits reminder_times from the PATCH when the slot is unchanged", async () => {
    const onUpdate = renderEditable(
      daily(1, { reminder_times: ["07:00", "21:00"] })
    )
    await submit()
    expect(onUpdate.mock.calls[0][1]).not.toHaveProperty("reminder_times")
  })

  it("merges an edited reminder slot over the stored tail", async () => {
    const onUpdate = renderEditable(
      daily(1, { reminder_times: ["07:00", "21:00"] })
    )
    fireEvent.change(screen.getByLabelText("Reminder"), {
      target: { value: "08:30" },
    })
    await submit()
    expect(onUpdate.mock.calls[0][1].reminder_times).toEqual(["08:30", "21:00"])
  })
})
