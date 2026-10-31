import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { KnowledgeSection } from "./KnowledgeSection"
import { knowledgeApi, type KnowledgeCitation } from "@/lib/api"
import {
  KnowledgeStreamError,
  streamKnowledgeAsk,
  type KnowledgeAskStreamEvent,
} from "@/lib/knowledge-stream"

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

vi.mock("@/lib/knowledge-stream", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/knowledge-stream")>()
  return { ...actual, streamKnowledgeAsk: vi.fn() }
})

const toastMock = vi.fn()

const DONE = {
  answer_id: 7,
  task_id: 42,
  model: "gpt-4o-mini",
  prompt_tokens: 100,
  completion_tokens: 20,
  total_tokens: 120,
  cost_usd: 0.00057,
  response_time_ms: 400,
}

function askEvents(
  answerText: string,
  citations: KnowledgeCitation[] = [],
  answerId = 7
): KnowledgeAskStreamEvent[] {
  return [
    ...(citations.length > 0
      ? ([{ type: "citations", citations }] as const)
      : []),
    { type: "token", text: answerText },
    {
      type: "verdict",
      relevance: "RELEVANT",
      explanation: "Covers the rubric.",
    },
    { type: "done", done: { ...DONE, answer_id: answerId } },
  ]
}

function mockAskStream(events: KnowledgeAskStreamEvent[]) {
  vi.mocked(streamKnowledgeAsk).mockImplementation(
    async (_taskId, _query, onEvent) => {
      for (const event of events) onEvent(event)
    }
  )
}

/** Mock a stream that stays open; emit() drives it, release() closes it. */
function captureStream() {
  let emit: (event: KnowledgeAskStreamEvent) => void = () => {}
  let release: () => void = () => {}
  vi.mocked(streamKnowledgeAsk).mockImplementation(
    async (_taskId, _query, onEvent) => {
      emit = onEvent
      await new Promise<void>((resolve) => {
        release = resolve
      })
    }
  )
  return {
    emit: (event: KnowledgeAskStreamEvent) => emit(event),
    release: () => release(),
  }
}

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
    mockAskStream(
      askEvents("You need the rubric: ER diagram, 3NF, 20 test queries.", [
        { knowledge_id: 1, chunk_text: "rubric excerpt", rrf_score: 0.5 },
      ])
    )

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )

    await waitFor(() => {
      expect(streamKnowledgeAsk).toHaveBeenCalledWith(
        42,
        undefined,
        expect.any(Function),
        expect.any(AbortSignal)
      )
    })
    const answerPanel = await screen.findByTestId("knowledge-answer")
    expect(
      within(answerPanel).getByText(
        "You need the rubric: ER diagram, 3NF, 20 test queries."
      )
    ).toBeInTheDocument()
    expect(within(answerPanel).getByText("rubric excerpt")).toBeInTheDocument()
  })

  it("shows a thinking indicator until the first token arrives", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    const stream = captureStream()

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )

    const answerPanel = await screen.findByTestId("knowledge-answer")
    expect(within(answerPanel).getByText("Thinking…")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /what do i need/i })
    ).toBeDisabled()

    await act(async () => {
      stream.emit({ type: "token", text: "You need" })
    })

    expect(within(answerPanel).queryByText("Thinking…")).not.toBeInTheDocument()
    expect(within(answerPanel).getByText("You need")).toBeInTheDocument()
    await act(async () => {
      stream.release()
    })
  })

  it("renders streamed tokens incrementally", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    const stream = captureStream()

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )
    await screen.findByTestId("knowledge-answer")

    await act(async () => {
      stream.emit({ type: "token", text: "You need" })
    })
    expect(screen.getByText("You need")).toBeInTheDocument()

    await act(async () => {
      stream.emit({ type: "token", text: " the rubric." })
    })
    expect(screen.getByText("You need the rubric.")).toBeInTheDocument()
    await act(async () => {
      stream.release()
    })
  })

  it("renders citations that arrive before the first token", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    const stream = captureStream()

    renderSection()
    await waitFor(() => {
      expect(knowledgeApi.list).toHaveBeenCalled()
    })

    await userEvent.click(
      screen.getByRole("button", { name: /what do i need/i })
    )
    const answerPanel = await screen.findByTestId("knowledge-answer")

    await act(async () => {
      stream.emit({
        type: "citations",
        citations: [
          { knowledge_id: 1, chunk_text: "rubric excerpt", rrf_score: 0.5 },
        ],
      })
    })

    expect(within(answerPanel).getByText("rubric excerpt")).toBeInTheDocument()
    expect(within(answerPanel).getByText("Thinking…")).toBeInTheDocument()
    await act(async () => {
      stream.release()
    })
  })

  it("shows a toast on ask failure", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(streamKnowledgeAsk).mockRejectedValue(new Error("boom"))

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

  it("toasts and clears the partial answer on a stream error event", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    vi.mocked(streamKnowledgeAsk).mockImplementation(
      async (_taskId, _query, onEvent) => {
        onEvent({ type: "token", text: "partial answer" })
        onEvent({
          type: "error",
          code: "provider_error",
          message: "AI service unavailable",
        })
        throw new KnowledgeStreamError("AI service unavailable", {
          code: "provider_error",
        })
      }
    )

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
    expect(screen.queryByTestId("knowledge-answer")).not.toBeInTheDocument()
  })

  it("sends +1 feedback via the thumbs control", async () => {
    vi.mocked(knowledgeApi.list).mockResolvedValue([])
    mockAskStream(askEvents("You need the rubric."))
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
    mockAskStream(askEvents("You need the rubric."))
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
    mockAskStream(askEvents("You need the rubric."))
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
    vi.mocked(streamKnowledgeAsk)
      .mockImplementationOnce(async (_taskId, _query, onEvent) => {
        for (const event of askEvents("First answer.", [], 7)) onEvent(event)
      })
      .mockImplementationOnce(async (_taskId, _query, onEvent) => {
        for (const event of askEvents("Second answer.", [], 8)) onEvent(event)
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
