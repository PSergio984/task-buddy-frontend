import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  KnowledgeStreamError,
  streamKnowledgeAsk,
  type KnowledgeAskStreamEvent,
} from "./knowledge-stream"

const fetchMock = vi.fn()

function sseBody(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

function okResponse(chunks: string[]): Response {
  return {
    ok: true,
    status: 200,
    body: sseBody(chunks),
  } as unknown as Response
}

const DONE_FRAME = `event: done
data: {"answer_id":7,"task_id":42,"model":"gpt-4o-mini","prompt_tokens":100,"completion_tokens":20,"total_tokens":120,"cost_usd":0.00057,"response_time_ms":400}

`

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock)
  fetchMock.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("streamKnowledgeAsk", () => {
  it("posts with cookie auth, SSE accept and an idempotency key", async () => {
    fetchMock.mockResolvedValue(okResponse([DONE_FRAME]))

    await streamKnowledgeAsk(42, "what do I need?", () => {})

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/tasks/42/knowledge/ask/stream",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ query: "what do I need?" }),
        headers: expect.objectContaining({
          Accept: "text/event-stream",
          "Content-Type": "application/json",
          "X-Idempotency-Key": expect.any(String),
        }),
      })
    )
  })

  it("emits the contract events in order", async () => {
    const frames = `event: citations
data: {"citations":[{"knowledge_id":1,"chunk_text":"rubric excerpt","rrf_score":0.5}]}

event: token
data: {"text":"You need"}

event: token
data: {"text":" the rubric."}

event: verdict
data: {"relevance":"RELEVANT","explanation":"Covers the rubric."}

${DONE_FRAME}`
    fetchMock.mockResolvedValue(okResponse([frames]))

    const events: KnowledgeAskStreamEvent[] = []
    await streamKnowledgeAsk(42, undefined, (event) => events.push(event))

    expect(events.map((event) => event.type)).toEqual([
      "citations",
      "token",
      "token",
      "verdict",
      "done",
    ])
    expect(events[0]).toEqual({
      type: "citations",
      citations: [
        { knowledge_id: 1, chunk_text: "rubric excerpt", rrf_score: 0.5 },
      ],
    })
    expect(events[1]).toEqual({ type: "token", text: "You need" })
    expect(events[2]).toEqual({ type: "token", text: " the rubric." })
    expect(events[3]).toEqual({
      type: "verdict",
      relevance: "RELEVANT",
      explanation: "Covers the rubric.",
    })
    expect(events[4]).toEqual({
      type: "done",
      done: expect.objectContaining({ answer_id: 7, task_id: 42 }),
    })
  })

  it("parses frames split across network chunks", async () => {
    fetchMock.mockResolvedValue(
      okResponse([
        'event: token\ndata: {"text":"Hel',
        `lo"}\n\nevent: token\ndata: {"text":"!"}\n\n${DONE_FRAME}`,
      ])
    )

    const events: KnowledgeAskStreamEvent[] = []
    await streamKnowledgeAsk(42, undefined, (event) => events.push(event))

    expect(events.map((event) => event.type)).toEqual([
      "token",
      "token",
      "done",
    ])
    expect(events[0]).toEqual({ type: "token", text: "Hello" })
  })

  it("delivers the error event then throws KnowledgeStreamError", async () => {
    const frames = `event: token
data: {"text":"partial"}

event: error
data: {"code":"provider_error","message":"AI service unavailable"}

`
    // Fresh Response per call — a consumed body can't be re-read.
    fetchMock.mockImplementation(async () => okResponse([frames]))

    const events: KnowledgeAskStreamEvent[] = []
    await expect(
      streamKnowledgeAsk(42, undefined, (event) => events.push(event))
    ).rejects.toThrow(KnowledgeStreamError)

    await expect(
      streamKnowledgeAsk(42, undefined, () => {})
    ).rejects.toMatchObject({
      code: "provider_error",
      message: "AI service unavailable",
    })
    expect(events.at(-1)).toEqual({
      type: "error",
      code: "provider_error",
      message: "AI service unavailable",
    })
  })

  it("throws with the detail message on a pre-stream HTTP error", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: "Task not found" }),
    } as unknown as Response)

    await expect(
      streamKnowledgeAsk(42, undefined, () => {})
    ).rejects.toMatchObject({
      message: "Task not found",
      status: 404,
    })
  })

  it("throws when the stream ends without a done event", async () => {
    fetchMock.mockResolvedValue(
      okResponse(['event: token\ndata: {"text":"dangling"}\n\n'])
    )

    await expect(streamKnowledgeAsk(42, undefined, () => {})).rejects.toThrow(
      "Stream ended before the answer completed"
    )
  })

  it("forwards the abort signal to fetch", async () => {
    fetchMock.mockResolvedValue(okResponse([DONE_FRAME]))
    const controller = new AbortController()

    await streamKnowledgeAsk(42, undefined, () => {}, controller.signal)

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    )
  })
})
