import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"

import { SyncProvider, useSync } from "./SyncContext"
import type { FlushResult } from "@/lib/sync-flush"

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 }, loading: false }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/sync-queue", () => ({
  enqueueMutation: vi.fn(),
  pendingMutationCount: vi.fn(),
}))

vi.mock("@/lib/sync-flush", () => ({
  flushSync: vi.fn(),
}))

vi.mock("@/lib/query-client", () => ({
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
    getQueriesData: vi.fn(() => []),
  },
}))

vi.mock("@/lib/api", () => ({
  api: { post: vi.fn() },
}))

import { pendingMutationCount } from "@/lib/sync-queue"
import { flushSync } from "@/lib/sync-flush"

const EMPTY_RESULT: FlushResult = {
  conflicts: [],
  notFound: [],
  delta: { tasks: [], subtasks: [], projects: [] },
  conflictCount: 0,
  retryAfterSec: null,
  since: "s1",
}

describe("SyncProvider triggerFlush", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(pendingMutationCount).mockResolvedValue(0)
    vi.mocked(flushSync).mockResolvedValue(EMPTY_RESULT)
  })

  function renderWithProvider() {
    return renderHook(() => useSync(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SyncProvider>{children}</SyncProvider>
      ),
    })
  }

  it("drops nothing: a trigger during an in-flight flush runs a trailing flush", async () => {
    let resolveFirst!: (value: FlushResult) => void
    vi.mocked(flushSync)
      .mockImplementationOnce(
        () =>
          new Promise<FlushResult>((resolve) => {
            resolveFirst = resolve
          })
      )
      .mockResolvedValueOnce(EMPTY_RESULT)
    // Call order: userId effect, mount flush, refreshPendingCount, trailing
    // triggerFlush, final refreshPendingCount. Queue stays non-empty until the
    // trailing flush's own count check has consumed a value.
    let countCalls = 0
    vi.mocked(pendingMutationCount).mockImplementation(async () => {
      countCalls += 1
      return countCalls <= 4 ? 1 : 0
    })

    const { result } = renderWithProvider()

    await act(async () => {
      // Let the mount flush start (it holds the deferred flushSync).
      await new Promise((r) => setTimeout(r, 0))
      void result.current.triggerFlush()
      await new Promise((r) => setTimeout(r, 0))
      // Second trigger lands while flush #1 is in flight.
      await result.current.triggerFlush()
      resolveFirst(EMPTY_RESULT)
    })

    await vi.waitFor(() => {
      expect(flushSync).toHaveBeenCalledTimes(2)
    })
    await vi.waitFor(() => {
      expect(result.current.pendingCount).toBe(0)
    })
  })

  it("skips flushing when the queue is empty", async () => {
    vi.mocked(pendingMutationCount).mockResolvedValue(0)
    const { result } = renderWithProvider()

    await act(async () => {
      await result.current.triggerFlush()
    })

    expect(flushSync).not.toHaveBeenCalled()
  })
})
