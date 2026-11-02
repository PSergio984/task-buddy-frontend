import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import { makeWrapper, profile, SERVER_TIME } from "./game-hook-test-utils"
import {
  useAllocateStats,
  useBuyGear,
  useEquipGear,
  useSelectClass,
} from "./useGameCharacter"
import { characterApi, gearApi, type GearItem } from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gearApi: { ...mod.gearApi, buy: vi.fn(), equip: vi.fn() },
    characterApi: {
      ...mod.characterApi,
      allocate: vi.fn(),
      selectClass: vi.fn(),
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
})
