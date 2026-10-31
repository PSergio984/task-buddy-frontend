import { createIdempotencyKey } from "@/lib/api"
import type { KnowledgeCitation } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"

export type KnowledgeAskRelevance =
  | "RELEVANT"
  | "PARTLY_RELEVANT"
  | "NON_RELEVANT"

export type KnowledgeAskStreamDone = {
  answer_id: number
  task_id: number
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  cost_usd: number
  response_time_ms: number
}

export type KnowledgeAskStreamEvent =
  | { readonly type: "citations"; readonly citations: KnowledgeCitation[] }
  | { readonly type: "token"; readonly text: string }
  | {
      readonly type: "verdict"
      readonly relevance: KnowledgeAskRelevance
      readonly explanation: string
    }
  | { readonly type: "done"; readonly done: KnowledgeAskStreamDone }
  | { readonly type: "error"; readonly code: string; readonly message: string }

export class KnowledgeStreamError extends Error {
  readonly code: string | null
  readonly status: number | null

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message)
    this.name = "KnowledgeStreamError"
    this.code = options?.code ?? null
    this.status = options?.status ?? null
  }
}

const isRelevance = (value: unknown): value is KnowledgeAskRelevance =>
  value === "RELEVANT" ||
  value === "PARTLY_RELEVANT" ||
  value === "NON_RELEVANT"

// SSE field values drop exactly one leading space after the colon.
const fieldValue = (line: string, field: string): string => {
  const raw = line.slice(field.length + 1)
  return raw.startsWith(" ") ? raw.slice(1) : raw
}

function parseStreamEvent(frame: string): KnowledgeAskStreamEvent | null {
  let eventName = ""
  const dataLines: string[] = []
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith("event:")) {
      eventName = fieldValue(line, "event")
    } else if (line.startsWith("data:")) {
      dataLines.push(fieldValue(line, "data"))
    }
    // Comment/keepalive (`:` lines) and id:/retry: fields are ignored.
  }
  if (eventName === "" || dataLines.length === 0) return null

  let data: Record<string, unknown>
  try {
    data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>
  } catch {
    throw new KnowledgeStreamError("Received a malformed stream event")
  }

  switch (eventName) {
    case "citations":
      return {
        type: "citations",
        citations: Array.isArray(data.citations)
          ? (data.citations as KnowledgeCitation[])
          : [],
      }
    case "token":
      return {
        type: "token",
        text: typeof data.text === "string" ? data.text : "",
      }
    case "verdict":
      return {
        type: "verdict",
        relevance: isRelevance(data.relevance)
          ? data.relevance
          : "PARTLY_RELEVANT",
        explanation:
          typeof data.explanation === "string" ? data.explanation : "",
      }
    case "done":
      // Coerce the ids the feedback flow builds URLs from; a malformed done
      // must not emit undefined ids (other fields pass through for display).
      return {
        type: "done",
        done: {
          ...(data as unknown as KnowledgeAskStreamDone),
          answer_id: Number(data.answer_id),
          task_id: Number(data.task_id),
        },
      }
    case "error":
      return {
        type: "error",
        code: typeof data.code === "string" ? data.code : "stream_error",
        message:
          typeof data.message === "string" ? data.message : "Stream failed",
      }
    default:
      // Unknown events are ignored for forward compatibility.
      return null
  }
}

async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body = (await response.json()) as { detail?: unknown }
    const detail = body?.detail
    if (typeof detail === "string") return detail
    if (Array.isArray(detail)) {
      const messages = detail
        .map((entry) => (entry as { msg?: unknown })?.msg)
        .filter((msg): msg is string => typeof msg === "string")
      if (messages.length > 0) return messages.join(", ")
    }
  } catch {
    // Non-JSON error body — fall back to a status-based message.
  }
  return null
}

// Frames are separated by a blank line; tolerate both LF and CRLF servers.
const FRAME_END = /\r?\n\r?\n/g

/**
 * POST /tasks/{taskId}/knowledge/ask/stream and deliver each SSE event to
 * `onEvent` in order. Resolves after the terminal `done` event; throws
 * KnowledgeStreamError on the `error` event, pre-stream HTTP failures, or a
 * stream that closes without a terminal event. Abort `signal` to cancel.
 */
export async function streamKnowledgeAsk(
  taskId: number,
  query: string | undefined,
  onEvent: (event: KnowledgeAskStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/tasks/${taskId}/knowledge/ask/stream`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-Idempotency-Key": createIdempotencyKey(),
      },
      body: JSON.stringify(query ? { query } : {}),
      signal: signal ?? null,
    }
  )

  if (!response.ok) {
    // Raw fetch bypasses the axios interceptor — keep the app's 401 → logout
    // convention (api.ts response interceptor, AuthContext listener).
    if (response.status === 401) {
      globalThis.dispatchEvent(new CustomEvent("auth:unauthorized"))
    }
    const detail = await readErrorDetail(response)
    throw new KnowledgeStreamError(
      detail ?? `Ask failed (${response.status})`,
      { status: response.status }
    )
  }

  if (response.body === null) {
    throw new KnowledgeStreamError("Streaming is not supported by this client")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let finished = false
  // FRAME_END is a module-level /g regex — reset lastIndex so a prior stream's
  // mid-loop throw can't leave it pointing past a frame boundary.
  FRAME_END.lastIndex = 0

  const emit = (frame: string) => {
    const event = parseStreamEvent(frame)
    if (event === null) return
    onEvent(event)
    if (event.type === "done") {
      finished = true
    } else if (event.type === "error") {
      finished = true
      throw new KnowledgeStreamError(event.message, { code: event.code })
    }
  }

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const frames: string[] = []
      let consumed = 0
      let match: RegExpExecArray | null
      while ((match = FRAME_END.exec(buffer)) !== null) {
        frames.push(buffer.slice(consumed, match.index))
        consumed = match.index + match[0].length
      }
      buffer = buffer.slice(consumed)
      for (const frame of frames) emit(frame)
    }
    buffer += decoder.decode()
    if (buffer.trim() !== "") emit(buffer)
  } finally {
    reader.releaseLock()
  }

  if (!finished) {
    throw new KnowledgeStreamError("Stream ended before the answer completed")
  }
}
