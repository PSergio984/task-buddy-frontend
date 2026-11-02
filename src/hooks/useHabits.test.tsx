import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import { makeWrapper, profile, SERVER_TIME } from "./game-hook-test-utils"
import { useClickHabit, useCreateHabit } from "./useHabits"
import { habitsApi, type Habit } from "@/lib/api"
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
    // No other write in flight — the settle-time resync must not fire.
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["habits"] })
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
    let resolveCreate!: (created: Habit) => void
    vi.mocked(habitsApi.create).mockImplementation(
      () => new Promise<Habit>((resolve) => (resolveCreate = resolve))
    )
    vi.mocked(habitsApi.click).mockResolvedValue({
      habit: habit(1, { counter: 1 }),
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["habits", { userId: 1 }], [habit(1)])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(
      () => ({ create: useCreateHabit(), click: useClickHabit() }),
      { wrapper: makeWrapper(queryClient) }
    )

    act(() => {
      result.current.create.mutate({ title: "new habit" })
    })
    await waitFor(() => expect(result.current.create.isPending).toBe(true))
    act(() => {
      result.current.click.mutate({
        id: 1,
        direction: "positive",
        clientEventId: "eid-1",
      })
    })
    await waitFor(() => expect(result.current.click.isSuccess).toBe(true))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["habits"] })

    await act(async () => {
      resolveCreate(habit(2))
    })
  })
})
