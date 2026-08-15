import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { KnowledgeSection } from "./KnowledgeSection"
import { knowledgeApi } from "@/lib/api"

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...actual,
    knowledgeApi: {
      list: vi.fn(),
      create: vi.fn(),
      ask: vi.fn(),
      feedback: vi.fn(),
    },
  }
})

const toastMock = vi.fn()

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <KnowledgeSection taskId={42} userId={1} toast={toastMock} />
    </QueryClientProvider>
  )
}

describe("KnowledgeSection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    toastMock.mockClear()
  })

  it("loads and shows existing notes", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        task_id: 42,
        source_type: "note",
        content: "Rubric requires 8 entities and 3NF.",
        created_at: "2026-08-13T00:00:00Z",
        updated_at: "2026-08-13T00:00:00Z",
      },
    ])

    renderSection()

    await waitFor(() => {
      expect(
        screen.getByText("Rubric requires 8 entities and 3NF.")
      ).toBeInTheDocument()
    })
    expect(knowledgeApi.list).toHaveBeenCalledWith(42)
  })

  it("saves a new note via the textarea", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.create).mockResolvedValue({
      id: 2,
      user_id: 1,
      task_id: 42,
      source_type: "note",
      content: "Remember to normalize to 3NF.",
      created_at: "2026-08-13T00:00:00Z",
      updated_at: "2026-08-13T00:00:00Z",
    })

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    const textarea = screen.getByLabelText("Notes")
    await userEvent.type(textarea, "Remember to normalize to 3NF.")
    await userEvent.click(screen.getByRole("button", { name: /save note/i }))

    await waitFor(() => {
      expect(knowledgeApi.create).toHaveBeenCalledWith(
        42,
        "Remember to normalize to 3NF."
      )
    })
    expect(
      screen.getByText("Remember to normalize to 3NF.")
    ).toBeInTheDocument()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" })
    )
  })

  it("shows the generated answer with citations after asking", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.ask).mockResolvedValue({
      task_id: 42,
      answer: "You need the rubric: ER diagram, 3NF, 20 test queries.",
      citations: [
        { knowledge_id: 1, chunk_text: "rubric excerpt", rrf_score: 0.5 },
      ],
      model: "gpt-4o-mini",
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
      cost_usd: 0.00057,
      response_time_ms: 400.0,
      judge_verdict: "RELEVANT",
      judge_explanation: "Covers the rubric.",
      answer_id: 7,
    })

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )

    await waitFor(() => {
      expect(knowledgeApi.ask).toHaveBeenCalledWith(42, undefined)
    })
    const answerPanel = screen.getByTestId("knowledge-answer")
    expect(
      within(answerPanel).getByText(
        "You need the rubric: ER diagram, 3NF, 20 test queries."
      )
    ).toBeInTheDocument()
    expect(within(answerPanel).getByText("rubric excerpt")).toBeInTheDocument()
  })

  it("shows a toast on ask failure", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.ask).mockRejectedValue(new Error("boom"))

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    })
  })

  it("sends +1 feedback via the thumbs control", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.ask).mockResolvedValue({
      task_id: 42,
      answer: "You need the rubric.",
      citations: [],
      model: "gpt-4o-mini",
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
      cost_usd: 0.00057,
      response_time_ms: 400.0,
      judge_verdict: "RELEVANT",
      judge_explanation: "Covers the rubric.",
      answer_id: 7,
    })
    vi.mocked(knowledgeApi.feedback).mockResolvedValue({
      id: 1,
      answer_id: 7,
      rating: 1,
      comment: null,
      created_at: "2026-08-14T00:00:00Z",
    })

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )
    await waitFor(() => {
      expect(screen.getByTestId("knowledge-answer")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: "Helpful" }))

    await waitFor(() => {
      expect(knowledgeApi.feedback).toHaveBeenCalledWith(42, 7, 1)
    })
  })

  it("sends -1 feedback via the thumbs control", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.ask).mockResolvedValue({
      task_id: 42,
      answer: "You need the rubric.",
      citations: [],
      model: "gpt-4o-mini",
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
      cost_usd: 0.00057,
      response_time_ms: 400.0,
      judge_verdict: "RELEVANT",
      judge_explanation: "Covers the rubric.",
      answer_id: 7,
    })
    vi.mocked(knowledgeApi.feedback).mockResolvedValue({
      id: 2,
      answer_id: 7,
      rating: -1,
      comment: null,
      created_at: "2026-08-14T00:00:00Z",
    })

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )
    await waitFor(() => {
      expect(screen.getByTestId("knowledge-answer")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: "Not helpful" }))

    await waitFor(() => {
      expect(knowledgeApi.feedback).toHaveBeenCalledWith(42, 7, -1)
    })
  })

  it("does not highlight the thumb and toasts when feedback is rate limited", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.ask).mockResolvedValue({
      task_id: 42,
      answer: "You need the rubric.",
      citations: [],
      model: "gpt-4o-mini",
      prompt_tokens: 100,
      completion_tokens: 20,
      total_tokens: 120,
      cost_usd: 0.00057,
      response_time_ms: 400.0,
      judge_verdict: "RELEVANT",
      judge_explanation: "Covers the rubric.",
      answer_id: 7,
    })
    const rateLimitedError = Object.assign(new Error("rate limited"), {
      response: { status: 429 },
    })
    vi.mocked(knowledgeApi.feedback).mockRejectedValue(rateLimitedError)

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )
    await waitFor(() => {
      expect(screen.getByTestId("knowledge-answer")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: "Helpful" }))

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    })
    expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })

  it("re-enables the thumbs when a new answer arrives", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(knowledgeApi.feedback).mockResolvedValue({
      id: 1,
      answer_id: 7,
      rating: 1,
      comment: null,
      created_at: "2026-08-14T00:00:00Z",
    })
    vi.mocked(knowledgeApi.ask)
      .mockResolvedValueOnce({
        task_id: 42,
        answer: "First answer.",
        citations: [],
        model: "gpt-4o-mini",
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
        cost_usd: 0.00057,
        response_time_ms: 400.0,
        judge_verdict: "RELEVANT",
        judge_explanation: "First.",
        answer_id: 7,
      })
      .mockResolvedValueOnce({
        task_id: 42,
        answer: "Second answer.",
        citations: [],
        model: "gpt-4o-mini",
        prompt_tokens: 100,
        completion_tokens: 20,
        total_tokens: 120,
        cost_usd: 0.00057,
        response_time_ms: 400.0,
        judge_verdict: "RELEVANT",
        judge_explanation: "Second.",
        answer_id: 8,
      })

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    const askButton = screen.getByRole("button", { name: /what do i need/i })
    await userEvent.click(askButton)
    await waitFor(() => {
      expect(screen.getByTestId("knowledge-answer")).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole("button", { name: "Helpful" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    })

    await userEvent.click(askButton)
    await waitFor(() => {
      expect(screen.getByText("Second answer.")).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: "Helpful" })).not.toBeDisabled()
    expect(screen.getByRole("button", { name: "Helpful" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  })
})
