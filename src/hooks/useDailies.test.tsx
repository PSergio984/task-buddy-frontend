import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import type { ReactNode } from "react"
import { useCheckDaily } from "./useDailies"
import { dailiesApi, type Daily, type GameProfile } from "@/lib/api"
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
    dailiesApi: { ...mod.dailiesApi, check: vi.fn() },
  }
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

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
})
