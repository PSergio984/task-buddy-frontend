import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AxiosError } from "axios"
import {
  authUser,
  deferred,
  expectSettleResync,
  makeWrapper,
  profile,
  SERVER_TIME,
} from "./game-hook-test-utils"
import {
  useActivityGrid,
  useActivityStats,
  useAllocateStats,
  useBuyGear,
  useEquipGear,
  useRespec,
  useSelectClass,
  useToggleGearCostume,
  useUpdateCharacter,
} from "./useGameCharacter"
import {
  activityApi,
  characterApi,
  gearApi,
  type GearItem,
  type GearListResponse,
} from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gearApi: {
      ...mod.gearApi,
      buy: vi.fn(),
      equip: vi.fn(),
      toggleCostume: vi.fn(),
    },
    activityApi: { ...mod.activityApi, grid: vi.fn(), stats: vi.fn() },
    characterApi: {
      ...mod.characterApi,
      allocate: vi.fn(),
      respec: vi.fn(),
      selectClass: vi.fn(),
      update: vi.fn(),
    },
  }
})

const stampedProfile = { ...profile, server_time: SERVER_TIME }

function gear(overrides: Partial<GearItem> = {}): GearItem {
  return {
    key: "warrior-weapon-1",
    name: "Training Sword",
    slot: "weapon",
    klass: "warrior",
    tier: 1,
    stats: { str: 3 },
    cost: 100,
    losable: true,
    owned: true,
    equipped: false,
    ...overrides,
  }
}

describe("activity day-boundary resync", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(activityApi.grid).mockResolvedValue({
      start: "2025-11-01",
      end: "2025-11-01",
      days: [],
      tier_thresholds: [],
      server_time: SERVER_TIME,
    })
    vi.mocked(activityApi.stats).mockResolvedValue({
      start: "2025-11-01",
      end: "2025-11-01",
      avg_hours_per_day: 0,
      total_hours: 0,
      current_streak: 0,
      longest_streak: 0,
      best_day: null,
      weekly_total: 0,
      speedrun_pbs: [],
      server_time: SERVER_TIME,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("invalidates the activity queries at the next UTC midnight", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-11-01T10:00:00Z"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    renderHook(() => ({ grid: useActivityGrid(), stats: useActivityStats() }), {
      wrapper: makeWrapper(queryClient),
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(14 * 60 * 60 * 1000)
    })

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-activity-grid"],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-activity-stats"],
    })
  })

  it("invalidates the activity queries when the tab becomes visible again", () => {
    const visibility = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible")
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    renderHook(() => ({ grid: useActivityGrid(), stats: useActivityStats() }), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"))
    })

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-activity-grid"],
    })
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-activity-stats"],
    })
    visibility.mockRestore()
  })
})

describe("useBuyGear", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("folds the post-buy catalog + profile into caches and resyncs achievements", async () => {
    const items = [gear()]
    vi.mocked(gearApi.buy).mockResolvedValue({
      items,
      profile: stampedProfile,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["game-gear", { userId: 1 }], [])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useBuyGear(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate("warrior-weapon-1")
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(gearApi.buy).toHaveBeenCalledWith("warrior-weapon-1")
    expect(
      queryClient.getQueryData<GearItem[]>(["game-gear", { userId: 1 }])
    ).toEqual(items)
    // server_time rides on the embedded profile — forwards like the avatar write.
    expect(setGameProfileCache).toHaveBeenCalledWith(
      stampedProfile,
      1,
      SERVER_TIME
    )
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-achievements"],
    })
    // The settle-time gear resync is unconditional.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })
  })

  it("resyncs the gear cache when a buy fails", async () => {
    vi.mocked(gearApi.buy).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useBuyGear(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate("warrior-weapon-1")
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })
  })

  it("resyncs the gear cache when the buy settles while an equip is still in flight", async () => {
    // The buy's success path cancels the gear refetch the equip's own
    // resync kicked off — the settle-time guard must restart it or the
    // equip's updated rows never appear.
    let resolveEquip!: (res: GearListResponse) => void
    vi.mocked(gearApi.equip).mockImplementation(
      () => new Promise<GearListResponse>((resolve) => (resolveEquip = resolve))
    )
    vi.mocked(gearApi.buy).mockResolvedValue({
      items: [gear()],
      profile: stampedProfile,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["game-gear", { userId: 1 }], [gear()])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(
      () => ({ buy: useBuyGear(), equip: useEquipGear() }),
      { wrapper: makeWrapper(queryClient) }
    )

    act(() => {
      result.current.equip.mutate({ key: "warrior-weapon-1", equipped: true })
    })
    await waitFor(() => expect(result.current.equip.isPending).toBe(true))
    act(() => {
      result.current.buy.mutate("warrior-weapon-1")
    })
    await waitFor(() => expect(result.current.buy.isSuccess).toBe(true))

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })

    await act(async () => {
      resolveEquip({ items: [gear()], profile: stampedProfile })
    })
  })
})

describe("useToggleGearCostume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the response catalog into the gear cache and syncs the profile", async () => {
    const res: GearListResponse = {
      items: [gear({ costume: true })],
      profile: { ...stampedProfile, gold: 42 },
    }
    vi.mocked(gearApi.toggleCostume).mockResolvedValue(res)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["game-gear", { userId: 1 }], [gear()])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useToggleGearCostume(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ key: "warrior-weapon-1", costume: true })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(gearApi.toggleCostume).toHaveBeenCalledWith({
      key: "warrior-weapon-1",
      costume: true,
    })
    expect(
      queryClient.getQueryData<GearItem[]>(["game-gear", { userId: 1 }])
    ).toEqual(res.items)
    expect(setGameProfileCache).toHaveBeenCalledWith(
      res.profile,
      1,
      SERVER_TIME
    )
    // The settle-time gear resync is unconditional.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })
  })

  it("resyncs the list when a toggle settles while another write is in flight", async () => {
    // The settled toggle's success path cancels the list refetch the other
    // write's own invalidation kicked off — the settle-time guard must
    // restart it or that write's rows never appear.
    const res: GearListResponse = {
      items: [gear({ costume: true })],
      profile: { ...stampedProfile, gold: 42 },
    }
    const held = deferred<GearListResponse>()
    vi.mocked(gearApi.toggleCostume)
      .mockImplementationOnce(() => held.promise)
      .mockResolvedValue(res)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["game-gear", { userId: 1 }], [gear()])

    await expectSettleResync({
      queryClient,
      useMutations: () => ({
        hold: useToggleGearCostume(),
        settle: useToggleGearCostume(),
      }),
      holdVars: { key: "warrior-weapon-1", costume: true },
      settleVars: { key: "warrior-weapon-1", costume: false },
      listQueryKey: "game-gear",
      releaseHold: () => held.resolve(res),
    })
  })
})

describe("useEquipGear", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends the equipped flag and folds the returned catalog in", async () => {
    const items = [gear({ equipped: true })]
    vi.mocked(gearApi.equip).mockResolvedValue({
      items,
      profile: stampedProfile,
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(["game-gear", { userId: 1 }], [gear()])
    const { result } = renderHook(() => useEquipGear(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ key: "warrior-weapon-1", equipped: true })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(gearApi.equip).toHaveBeenCalledWith("warrior-weapon-1", true)
    expect(
      queryClient.getQueryData<GearItem[]>(["game-gear", { userId: 1 }])
    ).toEqual(items)
    expect(setGameProfileCache).toHaveBeenCalledWith(
      stampedProfile,
      1,
      SERVER_TIME
    )
  })

  it("folds under the account that fired the write when auth swaps mid-flight", async () => {
    // React Query swaps a pending mutation's options onto the latest render,
    // so the success path sees the NEW user — the owner must come from the
    // onMutate context captured at mutate() time.
    const held = deferred<GearListResponse>()
    vi.mocked(gearApi.equip).mockImplementation(() => held.promise)
    const queryClient = new QueryClient()
    const { result, rerender } = renderHook(() => useEquipGear(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ key: "warrior-weapon-1", equipped: true })
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    try {
      // Logout → login as another account while the write is in flight.
      authUser.id = 2
      rerender()
      await act(async () => {
        held.resolve({ items: [gear()], profile: stampedProfile })
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(
        queryClient.getQueryData<GearItem[]>(["game-gear", { userId: 1 }])
      ).toEqual([gear()])
      expect(
        queryClient.getQueryData(["game-gear", { userId: 2 }])
      ).toBeUndefined()
      expect(setGameProfileCache).toHaveBeenCalledWith(
        stampedProfile,
        1,
        SERVER_TIME
      )
    } finally {
      authUser.id = 1
    }
  })
})

describe("useAllocateStats", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("posts the points map and writes the returned profile into the HUD cache", async () => {
    const allocated = {
      ...stampedProfile,
      str_stat: 1,
      unspent_stat_points: 0,
    }
    vi.mocked(characterApi.allocate).mockResolvedValue(allocated)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useAllocateStats(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ str: 1 })
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(characterApi.allocate).toHaveBeenCalledWith({ str: 1 })
    expect(setGameProfileCache).toHaveBeenCalledWith(allocated, 1, SERVER_TIME)
  })

  it("resyncs the profile cache when the write fails", async () => {
    vi.mocked(characterApi.allocate).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useAllocateStats(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ str: 1 })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-profile"] })
  })
})

describe("useUpdateCharacter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the returned profile into the HUD cache", async () => {
    const updated = { ...stampedProfile, auto_allocate: true }
    vi.mocked(characterApi.update).mockResolvedValue(updated)
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate(true)
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(characterApi.update).toHaveBeenCalledWith(true)
    expect(setGameProfileCache).toHaveBeenCalledWith(updated, 1, SERVER_TIME)
  })

  it("resyncs the profile cache when the write fails", async () => {
    vi.mocked(characterApi.update).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useUpdateCharacter(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate(false)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-profile"] })
  })
})

describe("useRespec", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the returned profile into the HUD cache and resyncs stripped gear", async () => {
    const respeced = {
      ...stampedProfile,
      str_stat: 0,
      unspent_stat_points: 4,
      game_class: null,
    }
    vi.mocked(characterApi.respec).mockResolvedValue(respeced)
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useRespec(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate()
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(characterApi.respec).toHaveBeenCalled()
    expect(setGameProfileCache).toHaveBeenCalledWith(respeced, 1, SERVER_TIME)
    // Equipped class pieces were stripped — the list must reload.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })
  })

  it("resyncs the profile cache when the respec fails", async () => {
    vi.mocked(characterApi.respec).mockRejectedValue(new AxiosError("boom"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useRespec(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate()
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-profile"] })
  })
})

describe("useSelectClass", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resyncs achievements + gear — the pick can grant and strip", async () => {
    const classed = { ...stampedProfile, game_class: "warrior" }
    vi.mocked(characterApi.selectClass).mockResolvedValue(classed)
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useSelectClass(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate("warrior")
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(characterApi.selectClass).toHaveBeenCalledWith("warrior")
    expect(setGameProfileCache).toHaveBeenCalledWith(classed, 1, SERVER_TIME)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["game-achievements"],
    })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-gear"] })
  })

  it("resyncs the profile cache when the pick fails", async () => {
    vi.mocked(characterApi.selectClass).mockRejectedValue(
      new AxiosError("boom")
    )
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useSelectClass(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate("warrior")
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["game-profile"] })
  })
})
