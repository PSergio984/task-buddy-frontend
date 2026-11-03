import { useEffect } from "react"
import { render, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GameProvider, useGame } from "./GameContext"
import type { GameSyncResponse } from "@/lib/api"

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" }, loading: false }),
}))

const flushQueueMock = vi.fn()
vi.mock("@/lib/game-event-queue", () => ({
  enqueueGameEvent: vi.fn(() => Promise.resolve()),
  pendingGameEventCount: vi.fn(() => Promise.resolve(1)),
  flushGameEventQueue: (...args: unknown[]) => flushQueueMock(...args),
}))

vi.mock("@/lib/focus-probe-gate", () => ({
  probeGate: vi.fn(() => Promise.resolve()),
}))

const invalidateSpy = vi.fn((..._args: unknown[]) => Promise.resolve())
vi.mock("@/lib/query-client", () => ({
  queryClient: {
    invalidateQueries: (...args: unknown[]) => invalidateSpy(...args),
  },
}))

vi.mock("@/hooks/useGameProfile", () => ({
  setGameProfileCache: vi.fn(() => Promise.resolve()),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gameApi: { ...mod.gameApi, postEvents: vi.fn() },
  }
})

let ctx: ReturnType<typeof useGame> | null = null
function Probe() {
  const value = useGame()
  // Module-scope capture must run in an effect — a render-phase write is a
  // react-hooks/globals violation.
  useEffect(() => {
    ctx = value
  }, [value])
  return null
}

describe("GameContext flushEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ctx = null
  })

  it("invalidates affected keys when a flush fails after partial success", async () => {
    // Earlier chunks applied + dequeued before a later chunk threw —
    // the catch must still refresh what the landed writes touched.
    flushQueueMock.mockRejectedValueOnce(new Error("network down"))
    render(
      <GameProvider>
        <Probe />
      </GameProvider>
    )
    await act(async () => {
      await ctx?.flushEvents()
    })
    const keys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey
    )
    expect(keys).toContainEqual(["habits"])
    expect(keys).toContainEqual(["game-achievements"])
  })

  it("invalidates habits and achievements after a successful flush", async () => {
    flushQueueMock.mockResolvedValueOnce({
      profile: {},
      results: [],
      applied: 0,
      duplicates: 0,
      server_time: "2026-11-01T10:05:00Z",
    } as unknown as GameSyncResponse)
    render(
      <GameProvider>
        <Probe />
      </GameProvider>
    )
    await act(async () => {
      await ctx?.flushEvents()
    })
    const keys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey
    )
    expect(keys).toContainEqual(["habits"])
    expect(keys).toContainEqual(["game-achievements"])
  })
})
