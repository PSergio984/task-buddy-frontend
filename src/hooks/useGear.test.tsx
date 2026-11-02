import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  gameApi,
  type GameProfile,
  type GearItem,
  type GearListResponse,
} from "@/lib/api"
import { queryClient } from "@/lib/query-client"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gameApi: { ...mod.gameApi, listGear: vi.fn(), toggleGearCostume: vi.fn() },
  }
})
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1" } }),
}))
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

import { useToggleGearCostume } from "./useGear"

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

const PROFILE: GameProfile = {
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
  class_unlocked: false,
  auto_allocate: false,
  avatar_config: {},
  xp_today: 10,
  gold_today: 5,
  retention: "forever",
}

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
    queryClient.clear()
    queryClient.setQueryData(["game-profile", { userId: "u1" }], PROFILE)
    queryClient.setQueryData(["gear", { userId: "u1" }], [SWORD])
  })

  it("writes the response catalog and profile into their caches", async () => {
    const res: GearListResponse = {
      items: [{ ...SWORD, costume: true }],
      profile: { ...PROFILE, gold: 42 },
    }
    vi.mocked(gameApi.toggleGearCostume).mockResolvedValue(res)

    const { result } = renderHook(() => useToggleGearCostume(), { wrapper })
    result.current.mutate({ key: "warrior-weapon-1", costume: true })
    await waitFor(() => expect(queryClient.isMutating()).toBe(0))

    expect(
      queryClient.getQueryData<GearItem[]>(["gear", { userId: "u1" }])
    ).toEqual(res.items)
    expect(
      queryClient.getQueryData<GameProfile>(["game-profile", { userId: "u1" }])
        ?.gold
    ).toBe(42)
  })
})
