import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { DiaryDayPanel } from "./diary-day-panel"
import type { DiaryEntry } from "@/lib/api"

function entry(overrides: Partial<DiaryEntry> = {}): DiaryEntry {
  return {
    id: 1,
    kind: "freeform",
    entry_date: "2025-11-01",
    good: null,
    bad: null,
    next: null,
    freeform: "a note",
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    ...overrides,
  }
}

const standup = () =>
  entry({
    id: 10,
    kind: "standup",
    good: "shipped the fix",
    bad: "two meetings ran long",
    next: "write tests",
    freeform: null,
  })

describe("DiaryDayPanel stand-up uniqueness", () => {
  it("shows the stand-up form while the day has no stand-up", () => {
    render(<DiaryDayPanel entries={[]} onCreateStandup={vi.fn()} />)
    expect(screen.getByTestId("standup-form")).toBeInTheDocument()
  })

  it("renders the stand-up read-only card instead of a second form once one exists", () => {
    render(<DiaryDayPanel entries={[standup()]} />)
    expect(screen.queryByTestId("standup-form")).not.toBeInTheDocument()
    expect(screen.getByText("shipped the fix")).toBeInTheDocument()
    expect(screen.getByText("write tests")).toBeInTheDocument()
  })

  it("disables save until at least one field has content (backend's non-empty rule)", () => {
    render(<DiaryDayPanel entries={[]} onCreateStandup={vi.fn()} />)
    const save = screen.getByRole("button", { name: /save stand-up/i })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText("Went well"), {
      target: { value: "  " },
    })
    expect(save).toBeDisabled()
  })

  it("submits the good/bad/next fields to the create callback", () => {
    const onCreateStandup = vi.fn()
    render(<DiaryDayPanel entries={[]} onCreateStandup={onCreateStandup} />)
    fireEvent.change(screen.getByLabelText("Went well"), {
      target: { value: "shipped it" },
    })
    fireEvent.change(screen.getByLabelText("Up next"), {
      target: { value: "rest" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save stand-up/i }))
    expect(onCreateStandup).toHaveBeenCalledWith({
      good: "shipped it",
      bad: "",
      next: "rest",
    })
  })
})

describe("DiaryDayPanel freeform entries", () => {
  it("always offers the add form — entries are unlimited, even with a stand-up", () => {
    render(
      <DiaryDayPanel
        entries={[standup(), entry({ id: 2, freeform: "first" })]}
        onCreateFreeform={vi.fn()}
      />
    )
    expect(screen.getByTestId("freeform-form")).toBeInTheDocument()
    expect(screen.getByText("first")).toBeInTheDocument()
  })

  it("passes the freeform text to the create callback", () => {
    const onCreateFreeform = vi.fn()
    render(<DiaryDayPanel entries={[]} onCreateFreeform={onCreateFreeform} />)
    fireEvent.change(screen.getByLabelText("New diary entry"), {
      target: { value: "idea: batch the sync flush" },
    })
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }))
    expect(onCreateFreeform).toHaveBeenCalledWith("idea: batch the sync flush")
  })

  it("confirms before deleting an entry", () => {
    const onDeleteEntry = vi.fn()
    render(
      <DiaryDayPanel
        entries={[entry({ id: 7 })]}
        onDeleteEntry={onDeleteEntry}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /delete entry/i }))
    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }))
    expect(onDeleteEntry).toHaveBeenCalledWith(7)
  })

  it("edits an entry through the update callback", async () => {
    const onUpdateEntry = vi.fn().mockResolvedValue(undefined)
    render(
      <DiaryDayPanel
        entries={[entry({ id: 7, freeform: "old text" })]}
        onUpdateEntry={onUpdateEntry}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /edit entry/i }))
    fireEvent.change(screen.getByLabelText("Edit diary entry"), {
      target: { value: "new text" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    expect(onUpdateEntry).toHaveBeenCalledWith(7, { freeform: "new text" })
    // The editor closes once the PATCH resolves.
    await waitFor(() =>
      expect(
        screen.queryByLabelText("Edit diary entry")
      ).not.toBeInTheDocument()
    )
  })

  it("keeps the editor open with the draft when the update fails", async () => {
    const onUpdateEntry = vi.fn().mockRejectedValue(new Error("500"))
    render(
      <DiaryDayPanel
        entries={[entry({ id: 7, freeform: "old text" })]}
        onUpdateEntry={onUpdateEntry}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /edit entry/i }))
    fireEvent.change(screen.getByLabelText("Edit diary entry"), {
      target: { value: "new text" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    await waitFor(() => expect(onUpdateEntry).toHaveBeenCalled())
    // Draft preserved for retry — the edit form is still mounted.
    expect(screen.getByLabelText("Edit diary entry")).toHaveValue("new text")
  })
})

describe("DiaryDayPanel malformed timestamps", () => {
  it("renders 'time unknown' rather than NaN:NaN for a bad created_at", () => {
    render(
      <DiaryDayPanel entries={[entry({ id: 3, created_at: "not-a-date" })]} />
    )
    expect(screen.getByText("time unknown")).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })
})

describe("DiaryDayPanel gated states", () => {
  it("hides all forms and shows the reason when writes are disabled (retention horizon)", () => {
    render(
      <DiaryDayPanel
        entries={[]}
        writesDisabled
        disabledReason="Entries before Aug 3 are hidden by your 90-day retention setting."
        onCreateStandup={vi.fn()}
        onCreateFreeform={vi.fn()}
      />
    )
    expect(
      screen.getByText(/hidden by your 90-day retention setting/i)
    ).toBeInTheDocument()
    expect(screen.queryByTestId("standup-form")).not.toBeInTheDocument()
    expect(screen.queryByTestId("freeform-form")).not.toBeInTheDocument()
  })

  it("keeps an open stand-up draft when the connection drops mid-create", () => {
    const { rerender } = render(
      <DiaryDayPanel entries={[]} onCreateStandup={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText("Went well"), {
      target: { value: "draft good" },
    })

    rerender(
      <DiaryDayPanel entries={[]} writesDisabled onCreateStandup={vi.fn()} />
    )
    // Same rule as the columns — the form stays mounted, submit blocks.
    expect(screen.getByLabelText("Went well")).toHaveValue("draft good")
    expect(
      screen.getByRole("button", { name: /save stand-up/i })
    ).toBeDisabled()
  })

  it("keeps an open freeform draft when the connection drops mid-create", () => {
    const { rerender } = render(
      <DiaryDayPanel entries={[]} onCreateFreeform={vi.fn()} />
    )
    fireEvent.change(screen.getByLabelText("New diary entry"), {
      target: { value: "draft note" },
    })

    rerender(
      <DiaryDayPanel entries={[]} writesDisabled onCreateFreeform={vi.fn()} />
    )
    expect(screen.getByLabelText("New diary entry")).toHaveValue("draft note")
    expect(screen.getByRole("button", { name: /add entry/i })).toBeDisabled()
  })

  it("keeps an open edit draft when the connection drops mid-edit", () => {
    const { rerender } = render(
      <DiaryDayPanel
        entries={[entry({ id: 7, freeform: "old text" })]}
        onUpdateEntry={vi.fn()}
      />
    )
    fireEvent.click(screen.getByRole("button", { name: /edit entry/i }))
    fireEvent.change(screen.getByLabelText("Edit diary entry"), {
      target: { value: "new text" },
    })

    rerender(
      <DiaryDayPanel
        entries={[entry({ id: 7, freeform: "old text" })]}
        writesDisabled
        onUpdateEntry={vi.fn()}
      />
    )
    expect(screen.getByLabelText("Edit diary entry")).toHaveValue("new text")
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled()
  })

  it("readOnly renders entries with no forms or row actions (merged day view)", () => {
    render(<DiaryDayPanel entries={[standup(), entry({ id: 2 })]} readOnly />)
    expect(screen.getByText("shipped the fix")).toBeInTheDocument()
    expect(screen.getByText("a note")).toBeInTheDocument()
    expect(screen.queryByTestId("standup-form")).not.toBeInTheDocument()
    expect(screen.queryByTestId("freeform-form")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /edit entry/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /delete entry/i })
    ).not.toBeInTheDocument()
  })
})
