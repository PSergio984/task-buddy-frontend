import { QueryClient } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  deferred,
  expectSettleResync,
  makeWrapper,
  profile,
} from "./game-hook-test-utils"
import { useToggleGearCostume } from "./useGear"
import { gameApi, type GearItem, type GearListResponse } from "@/lib/api"
import { setGameProfileCache } from "@/hooks/useGameProfile"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gameApi: { ...mod.gameApi, listGear: vi.fn(), toggleGearCostume: vi.fn() },
  }
})

const SWORD: GearItem = {
  key: "warrior-weapon-1",
  name: "Training Sword",
  slot: "weapon",
  klass: "warrior",
  tier: 1,
  stats: { str: 3 },
  cost: 100,
  losable: true,
  owned: true,
  equipped: true,
  costume: false,
}

describe("useToggleGearCostume", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes the response catalog into the gear cache and syncs the profile", async () => {
    const res: GearListResponse = {
      items: [{ ...SWORD, costume: true }],
      profile: { ...profile, gold: 42 },
    }
    vi.mocked(gameApi.toggleGearCostume).mockResolvedValue(res)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["gear", { userId: 1 }], [SWORD])
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useToggleGearCostume(), {
      wrapper: makeWrapper(queryClient),
    })

    result.current.mutate({ key: "warrior-weapon-1", costume: true })
    await waitFor(() => expect(queryClient.isMutating()).toBe(0))

    expect(
      queryClient.getQueryData<GearItem[]>(["gear", { userId: 1 }])
    ).toEqual(res.items)
    expect(setGameProfileCache).toHaveBeenCalledWith(
      res.profile,
      1,
      res.profile.server_time
    )
    // No other write in flight — the settle-time resync must not fire.
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ["gear"] })
  })

  it("resyncs the list when a toggle settles while another write is in flight", async () => {
    // The settled toggle's success path cancels the list refetch the other
    // write's own invalidation kicked off — the settle-time guard must
    // restart it or that write's rows never appear.
    const res: GearListResponse = {
      items: [{ ...SWORD, costume: true }],
      profile: { ...profile, gold: 42 },
    }
    const held = deferred<GearListResponse>()
    vi.mocked(gameApi.toggleGearCostume)
      .mockImplementationOnce(() => held.promise)
      .mockResolvedValue(res)
    const queryClient = new QueryClient()
    queryClient.setQueryData(["gear", { userId: 1 }], [SWORD])

    await expectSettleResync({
      queryClient,
      useMutations: () => ({
        hold: useToggleGearCostume(),
        settle: useToggleGearCostume(),
      }),
      holdVars: { key: "warrior-weapon-1", costume: true },
      settleVars: { key: "warrior-weapon-1", costume: false },
      listQueryKey: "gear",
      releaseHold: () => held.resolve(res),
    })
  })
})
