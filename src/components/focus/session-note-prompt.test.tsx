import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError, AxiosHeaders } from "axios"
import { SessionNotePrompt } from "./session-note-prompt"
import { sessionNotesApi } from "@/lib/api"

const toastMock = vi.fn()

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    sessionNotesApi: { attach: vi.fn() },
  }
})

function noteConflict(): AxiosError {
  // The backend 409s a second note for the same session.
  const err = new AxiosError("conflict")
  err.response = {
    status: 409,
    statusText: "Conflict",
    data: { detail: "A note already exists for this session" },
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return err
}

describe("SessionNotePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("attaches the note to the session, then hides the prompt", async () => {
    vi.mocked(sessionNotesApi.attach).mockResolvedValue({
      id: 1,
      session_id: 42,
      content: "felt focused",
      created_at: "2025-11-01T10:00:00Z",
    })
    render(<SessionNotePrompt sessionId={42} />)
    fireEvent.change(screen.getByLabelText("Session note"), {
      target: { value: "  felt focused  " },
    })
    fireEvent.click(screen.getByRole("button", { name: /save note/i }))
    await waitFor(() =>
      expect(
        screen.queryByTestId("session-note-prompt")
      ).not.toBeInTheDocument()
    )
    // Trimmed content, linked to THIS session — the note linkage contract.
    expect(sessionNotesApi.attach).toHaveBeenCalledWith(42, "felt focused")
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" })
    )
  })

  it("skip hides the prompt without a request", () => {
    render(<SessionNotePrompt sessionId={42} />)
    fireEvent.click(screen.getByRole("button", { name: /skip/i }))
    expect(screen.queryByTestId("session-note-prompt")).not.toBeInTheDocument()
    expect(sessionNotesApi.attach).not.toHaveBeenCalled()
  })

  it("keeps Save disabled while the note is blank", () => {
    render(<SessionNotePrompt sessionId={42} />)
    const save = screen.getByRole("button", { name: /save note/i })
    expect(save).toBeDisabled()
    fireEvent.change(screen.getByLabelText("Session note"), {
      target: { value: "   " },
    })
    expect(save).toBeDisabled()
    expect(sessionNotesApi.attach).not.toHaveBeenCalled()
  })

  it("stays open and toasts on a save failure so the user can retry", async () => {
    vi.mocked(sessionNotesApi.attach).mockRejectedValue(
      new AxiosError("Network Error")
    )
    render(<SessionNotePrompt sessionId={42} />)
    fireEvent.change(screen.getByLabelText("Session note"), {
      target: { value: "draft" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save note/i }))
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    )
    expect(screen.getByTestId("session-note-prompt")).toBeInTheDocument()
  })

  it("treats a 409 as already-saved — closes quietly, no error toast", async () => {
    vi.mocked(sessionNotesApi.attach).mockRejectedValue(noteConflict())
    render(<SessionNotePrompt sessionId={42} />)
    fireEvent.change(screen.getByLabelText("Session note"), {
      target: { value: "draft" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save note/i }))
    await waitFor(() =>
      expect(
        screen.queryByTestId("session-note-prompt")
      ).not.toBeInTheDocument()
    )
    expect(toastMock).not.toHaveBeenCalled()
  })
})
