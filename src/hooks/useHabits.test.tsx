import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import type { ReactNode } from "react"
import { useClickHabit } from "./useHabits"
import { habitsApi, type GameProfile, type Habit } from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: vi.fn(),
  setGameProfileCache: vi.fn(),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    habitsApi: { ...mod.habitsApi, click: vi.fn() },
  }
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

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

const profile: GameProfile = {
  level: 1,
  xp: 10,
  xp_to_next_level: 100,
  hp: 50,
  max_hp: 50,
  gold: 5,
  str_stat: 0,
  int_stat: 0,
  con_stat: 0,
  per_stat: 0,
  unspent_stat_points: 0,
  game_class: null,
  avatar_config: {},
  xp_today: 10,
  gold_today: 5,
  retention: "forever",
}

const SERVER_TIME = "2025-11-01T10:00:00Z"

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
    expect(setGameProfileCache).toHaveBeenCalledWith(
      profile,
      1,
      SERVER_TIME
    )
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["timeline"] })
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
})
