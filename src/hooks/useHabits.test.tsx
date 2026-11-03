import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import {
  authUser,
  deferred,
  expectSettleResync,
  makeWrapper,
  profile,
  SERVER_TIME,
} from "./game-hook-test-utils"
import { useClickHabit, useCreateHabit } from "./useHabits"
import { habitsApi, type Habit, type HabitClickResponse } from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    habitsApi: { ...mod.habitsApi, click: vi.fn(), create: vi.fn() },
  }
})

function habit(id: number, overrides: Partial<Habit> = {}): Habit {
  return {
    id,
    title: `habit ${id}`,
    notes: null,
    direction: "both",
    difficulty: "easy",
    value: 0,
    counter: 0,
    bind_focus: false,
    reminder_times: [],
    created_at: "2025-11-01T10:00:00Z",
    updated_at: "2025-11-01T10:00:00Z",
    ...overrides,
  }
}

describe("useClickHabit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("folds the clicked habit + profile into caches and resyncs the timeline", async () => {
    const scored = habit(1, { counter: 1, value: 0.9 })
    vi.mocked(habitsApi.click).mockResolvedValue({
      habit: scored,
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["habits", { userId: 1 }], [habit(1), habit(2)])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useClickHabit(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        direction: "positive",
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(habitsApi.click).toHaveBeenCalledWith(1, "positive", "eid-1")
    expect(
      queryClient.getQueryData<Habit[]>(["habits", { userId: 1 }])
    ).toEqual([scored, habit(2)])
    expect(setGameProfileCache).toHaveBeenCalledWith(profile, 1, SERVER_TIME)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["timeline"] })
    // A scored write re-runs achievement evaluation server-side.
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-achievements"],
    })
    // The settle-time resync is unconditional — same contract as gear.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["habits"] })
  })

  it("folds under the account that fired the write when auth swaps mid-flight", async () => {
    // React Query swaps a pending mutation's options onto the latest render,
    // so the success path sees the NEW user — the owner must come from the
    // onMutate context captured at mutate() time.
    const held = deferred<HabitClickResponse>()
    vi.mocked(habitsApi.click).mockImplementation(() => held.promise)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["habits", { userId: 1 }], [habit(1)])
    const { result, rerender } = renderHook(() => useClickHabit(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        direction: "positive",
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    try {
      // Logout → login as another account while the write is in flight.
      authUser.id = 2
      rerender()
      const scored = habit(1, { counter: 1 })
      await act(async () => {
        held.resolve({
          habit: scored,
          profile,
          status: "applied",
          server_time: SERVER_TIME,
        })
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(
        queryClient.getQueryData<Habit[]>(["habits", { userId: 1 }])
      ).toEqual([scored])
      expect(
        queryClient.getQueryData(["habits", { userId: 2 }])
      ).toBeUndefined()
      expect(setGameProfileCache).toHaveBeenCalledWith(profile, 1, SERVER_TIME)
    } finally {
      authUser.id = 1
    }
  })

  it("resyncs the habits cache when a click fails", async () => {
    vi.mocked(habitsApi.click).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useClickHabit(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({
        id: 1,
        direction: "positive",
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["habits"] })
  })

  it("resyncs the list when the click settles while a create is still in flight", async () => {
    // The click's success path cancels the list refetch the create's own
    // invalidation kicked off — the settle-time guard must restart it or
    // the created row never appears.
    const created = deferred<Habit>()
    vi.mocked(habitsApi.create).mockImplementation(() => created.promise)
    vi.mocked(habitsApi.click).mockResolvedValue({
      habit: habit(1, { counter: 1 }),
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["habits", { userId: 1 }], [habit(1)])

    await expectSettleResync({
      queryClient,
      useMutations: () => ({ hold: useCreateHabit(), settle: useClickHabit() }),
      holdVars: { title: "new habit" },
      settleVars: { id: 1, direction: "positive", clientEventId: "eid-1" },
      listQueryKey: "habits",
      releaseHold: () => created.resolve(habit(2)),
    })
  })
})
