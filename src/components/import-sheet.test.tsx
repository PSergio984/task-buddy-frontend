import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { ImportSheet } from "./import-sheet"
import { importApi } from "@/lib/api"

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

vi.mock("@/hooks/useProjects", () => ({
  useProjects: () => ({ data: [{ id: 1, name: "General" }] }),
}))

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api")
  return {
    ...actual,
    importApi: {
      extract: vi.fn(),
    },
  }
})

describe("ImportSheet per-card regenerate and refine control", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const initialProposals = [
    {
      title: "Email Sarah about venue",
      description: null,
      proposed_deadline: "2026-11-20",
      priority: "HIGH" as const,
      suggested_project_id: null,
      subtasks: [],
    },
    {
      title: "Book dentist",
      description: null,
      proposed_deadline: null,
      priority: "MEDIUM" as const,
      suggested_project_id: null,
      subtasks: [],
    },
  ]

  async function renderSheetAndExtractNotes(
    notes = "Email Sarah; Book dentist"
  ) {
    render(<ImportSheet isOpen={true} onClose={vi.fn()} />)
    const textarea = screen.getByPlaceholderText(/Paste your notes/i)
    fireEvent.change(textarea, { target: { value: notes } })
    fireEvent.click(screen.getByRole("button", { name: /extract tasks/i }))
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Regenerate task 1" })
      ).toBeInTheDocument()
    })
  }

  function submitRefineCommand(prompt: string) {
    const input = document.getElementById(
      "import-refine-input"
    ) as HTMLInputElement
    fireEvent.change(input, { target: { value: prompt } })
    fireEvent.submit(input.closest("form")!)
  }

  it("renders regenerate button on each card and refine input in review footer", async () => {
    vi.mocked(importApi.extract).mockResolvedValueOnce({
      proposals: initialProposals,
      reason: null,
    })

    await renderSheetAndExtractNotes()

    expect(
      screen.getByRole("button", { name: "Regenerate task 2" })
    ).toBeInTheDocument()

    const refineInput = document.getElementById("import-refine-input")
    expect(refineInput).toBeInTheDocument()
    expect(refineInput).toHaveAttribute(
      "placeholder",
      'Refine, e.g. "split #2 more"'
    )
  })

  it("triggers targeted re-extraction when clicking per-card regenerate button", async () => {
    vi.mocked(importApi.extract)
      .mockResolvedValueOnce({
        proposals: initialProposals,
        reason: null,
      })
      .mockResolvedValueOnce({
        proposals: [
          {
            title: "Email Sarah venue contract",
            description: "Follow up urgently",
            proposed_deadline: "2026-11-20",
            priority: "HIGH" as const,
            suggested_project_id: null,
            subtasks: [],
          },
        ],
        reason: null,
      })

    await renderSheetAndExtractNotes()

    // Click regenerate on card 1
    const regenBtn = screen.getByRole("button", { name: "Regenerate task 1" })
    fireEvent.click(regenBtn)

    await waitFor(() => {
      expect(importApi.extract).toHaveBeenCalledTimes(2)
      expect(importApi.extract).toHaveBeenLastCalledWith(
        "Email Sarah; Book dentist",
        expect.objectContaining({
          focusTaskNumber: 1,
          focusTaskTitle: "Email Sarah about venue",
        })
      )
    })

    // Card 1 is updated, Card 2 is untouched
    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Email Sarah venue contract")
      ).toBeInTheDocument()
      expect(screen.getByDisplayValue("Book dentist")).toBeInTheDocument()
    })
  })

  it("triggers targeted refine when submitting refine input with #2", async () => {
    vi.mocked(importApi.extract)
      .mockResolvedValueOnce({
        proposals: initialProposals,
        reason: null,
      })
      .mockResolvedValueOnce({
        proposals: [
          {
            title: "Call dentist office",
            description: null,
            proposed_deadline: null,
            priority: "LOW" as const,
            suggested_project_id: null,
            subtasks: [],
          },
        ],
        reason: null,
      })

    await renderSheetAndExtractNotes()
    submitRefineCommand("split #2 more")

    await waitFor(() => {
      expect(importApi.extract).toHaveBeenCalledTimes(2)
      expect(importApi.extract).toHaveBeenLastCalledWith(
        "Email Sarah; Book dentist",
        expect.objectContaining({
          focusTaskNumber: 2,
          focusTaskTitle: "Book dentist",
        })
      )
    })

    await waitFor(() => {
      expect(
        screen.getByDisplayValue("Call dentist office")
      ).toBeInTheDocument()
      expect(
        screen.getByDisplayValue("Email Sarah about venue")
      ).toBeInTheDocument()
    })
  })

  it("preserves existing draft cards when targeted regeneration fails", async () => {
    vi.mocked(importApi.extract)
      .mockResolvedValueOnce({
        proposals: initialProposals,
        reason: null,
      })
      .mockRejectedValueOnce({
        response: { status: 500, data: { detail: "Internal Server Error" } },
      })

    await renderSheetAndExtractNotes()

    fireEvent.click(screen.getByRole("button", { name: "Regenerate task 1" }))

    await waitFor(() => {
      expect(importApi.extract).toHaveBeenCalledTimes(2)
    })

    // Both original cards are preserved
    expect(
      screen.getByDisplayValue("Email Sarah about venue")
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("Book dentist")).toBeInTheDocument()
    // Error banner is displayed
    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeInTheDocument()
  })

  it("preserves existing draft cards when targeted refine returns empty proposals", async () => {
    vi.mocked(importApi.extract)
      .mockResolvedValueOnce({
        proposals: initialProposals,
        reason: null,
      })
      .mockResolvedValueOnce({
        proposals: [],
        reason: null,
      })

    await renderSheetAndExtractNotes()
    submitRefineCommand("split #2 more")

    await waitFor(() => {
      expect(importApi.extract).toHaveBeenCalledTimes(2)
    })

    // Both original cards are preserved
    expect(
      screen.getByDisplayValue("Email Sarah about venue")
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue("Book dentist")).toBeInTheDocument()
    // Empty notice is displayed
    expect(
      screen.getByText(/couldn't find any tasks in those notes/i)
    ).toBeInTheDocument()
  })

  it("does not trigger extract when refining non-existent or invalid card numbers", async () => {
    vi.mocked(importApi.extract).mockResolvedValueOnce({
      proposals: initialProposals,
      reason: null,
    })

    await renderSheetAndExtractNotes()
    submitRefineCommand("split #99 more")

    // Should NOT have made another extract call for #99
    expect(importApi.extract).toHaveBeenCalledTimes(1)
  })
})
