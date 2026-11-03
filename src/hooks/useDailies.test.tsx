import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { afterEach, describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import {
  authUser,
  deferred,
  expectSettleResync,
  makeWrapper,
  profile,
  SERVER_TIME,
} from "./game-hook-test-utils"
import { useCheckDaily, useCreateDaily, useDailies } from "./useDailies"
import { dailiesApi, type Daily, type DailyCheckResponse } from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    dailiesApi: {
      ...mod.dailiesApi,
      check: vi.fn(),
      create: vi.fn(),
      list: vi.fn(),
    },
  }
})

function daily(id: number, overrides: Partial<Daily> = {}): Daily {
  return {
    id,
    title: `daily ${id}`,
    notes: null,
    difficulty: "easy",
    recurrence: { kind: "daily" },
    streak: 0,
    active: true,
    reminder_times: [],
    items: [],
    completed_today: false,
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    ...overrides,
  }
}

describe("useDailies", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(dailiesApi.list).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("invalidates the dailies query at the next UTC midnight", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-01T10:00:00Z"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    renderHook(() => useDailies(), { wrapper: makeWrapper(queryClient) })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 60 * 1000)
    })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dailies"] })
  })

  it("invalidates the dailies query when the tab becomes visible again", () => {
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible")
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    renderHook(() => useDailies(), { wrapper: makeWrapper(queryClient) })

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dailies"] })
    visibility.mockRestore()
  })
})

describe("useCheckDaily", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("folds the checked daily + profile into caches and resyncs the timeline", async () => {
    const checked = daily(1, { completed_today: true, streak: 1 })
    vi.mocked(dailiesApi.check).mockResolvedValue({
      daily: checked,
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["dailies", { userId: 1 }], [daily(1), daily(2)])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCheckDaily(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        input: { done: true },
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(dailiesApi.check).toHaveBeenCalledWith(1, { done: true }, "eid-1")
    expect(
      queryClient.getQueryData<Daily[]>(["dailies", { userId: 1 }])
    ).toEqual([checked, daily(2)])
    expect(setGameProfileCache).toHaveBeenCalledWith(profile, 1, SERVER_TIME)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["timeline"] })
    // A scored write re-runs achievement evaluation server-side.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-achievements"],
    })
    // The settle-time resync is unconditional — same contract as gear.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dailies"] })
  })

  it("folds under the account that fired the write when auth swaps mid-flight", async () => {
    // React Query swaps a pending mutation's options onto the latest render,
    // so the success path sees the NEW user — the owner must come from the
    // onMutate context captured at mutate() time.
    const held = deferred<DailyCheckResponse>()
    vi.mocked(dailiesApi.check).mockImplementation(() => held.promise)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["dailies", { userId: 1 }], [daily(1)])
    const { result, rerender } = renderHook(() => useCheckDaily(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        input: { done: true },
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    try {
      // Logout → login as another account while the write is in flight.
      authUser.id = 2
      rerender()
      const checked = daily(1, { completed_today: true })
      await act(async () => {
        held.resolve({
          daily: checked,
          profile,
          status: "applied",
          server_time: SERVER_TIME,
        })
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(
        queryClient.getQueryData<Daily[]>(["dailies", { userId: 1 }])
      ).toEqual([checked])
      expect(
        queryClient.getQueryData(["dailies", { userId: 2 }])
      ).toBeUndefined()
      expect(setGameProfileCache).toHaveBeenCalledWith(profile, 1, SERVER_TIME)
    } finally {
      authUser.id = 1
    }
  })

  it("resyncs the dailies cache when a check fails", async () => {
    vi.mocked(dailiesApi.check).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCheckDaily(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        input: { done: true },
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["dailies"] })
  })

  it("resyncs the list when the check settles while a create is still in flight", async () => {
    // Same race as the habit click — the check's success path cancels the
    // list refetch the create's invalidation kicked off.
    const queryClient = new QueryClient()
    queryClient.setQueryData(["dailies", { userId: 1 }], [daily(1)])
    const checked = daily(1, { completed_today: true })
    const created = deferred<Daily>()
    vi.mocked(dailiesApi.create).mockImplementation(() => created.promise)
    vi.mocked(dailiesApi.check).mockResolvedValue({
      daily: checked,
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })

    await expectSettleResync({
      useMutations: () => ({ hold: useCreateDaily(), settle: useCheckDaily() }),
      holdVars: { title: "new daily" },
      settleVars: { id: 1, input: { done: true }, clientEventId: "eid-1" },
      queryClient,
      listQueryKey: "dailies",
      releaseHold: () => created.resolve(daily(2)),
    })
  })
})
