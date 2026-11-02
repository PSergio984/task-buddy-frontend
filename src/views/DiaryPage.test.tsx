import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { DiaryPage } from "./DiaryPage"
import type { DiaryEntry } from "@/lib/api"
import { todayUtcDay } from "@/lib/diary"

const TODAY = todayUtcDay()

const updateMutate = vi.fn()
const createMutate = vi.fn()
const deleteMutate = vi.fn()
const retentionMutate = vi.fn()

function entry(id: number, date: string): DiaryEntry {
  return {
    id,
    kind: "freeform",
    entry_date: date,
    good: null,
    bad: null,
    next: null,
    freeform: `note ${id}`,
    created_at: `${date}T10:00:00Z`,
    updated_at: `${date}T10:00:00Z`,
  }
}

vi.mock("@/hooks/useDiary", () => ({
  // Every day serves one freeform entry (a different id per day).
  useDiaryEntries: (day: string) => ({
    data: { entries: [entry(day === TODAY ? 7 : 9, day)] },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCreateDiaryEntry: () => ({ mutate: createMutate, isPending: false }),
  useUpdateDiaryEntry: () => ({
    mutateAsync: updateMutate,
    isPending: false,
  }),
  useDeleteDiaryEntry: () => ({ mutate: deleteMutate, isPending: false }),
  useUpdateRetention: () => ({ mutate: retentionMutate, isPending: false }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({ data: { retention: "forever" } }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

describe("DiaryPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateMutate.mockResolvedValue({})
  })

  it("resets edit state on day navigation — one day's edit can't soft-lock the next", () => {
    render(<DiaryPage />)
    fireEvent.click(screen.getByRole("button", { name: /edit entry/i }))
    expect(screen.getByLabelText("Edit diary entry")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /previous day/i }))

    // The new day's panel mounted fresh: its row actions aren't gated by
    // the previous day's stale editingId.
    expect(
      screen.getByRole("button", { name: /edit entry/i })
    ).toBeInTheDocument()
    expect(screen.queryByLabelText("Edit diary entry")).not.toBeInTheDocument()
  })

  it("trims a freeform edit before PATCHing, like the create path", async () => {
    render(<DiaryPage />)
    fireEvent.click(screen.getByRole("button", { name: /edit entry/i }))
    fireEvent.change(screen.getByLabelText("Edit diary entry"), {
      target: { value: "  trimmed note  " },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))
    await waitFor(() =>
      expect(updateMutate).toHaveBeenCalledWith({
        id: 7,
        patch: { freeform: "trimmed note" },
      })
    )
  })

  it("disables entry creation on a future day — a stand-up for tomorrow is meaningless", () => {
    render(<DiaryPage />)
    fireEvent.click(screen.getByRole("button", { name: /next day/i }))
    expect(screen.getByText(/hasn't started yet \(UTC\)/i)).toBeInTheDocument()
    expect(screen.queryByTestId("standup-form")).not.toBeInTheDocument()
    expect(screen.queryByTestId("freeform-form")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /edit entry/i })
    ).not.toBeInTheDocument()
  })
})
