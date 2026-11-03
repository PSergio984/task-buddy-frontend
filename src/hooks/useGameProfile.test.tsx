import type { ReactNode } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { gameApi, type GameProfile } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    gameApi: { ...mod.gameApi, updateAvatarConfig: vi.fn() },
  }
})
// Mutable so a test can swap accounts while a write is in flight — the
// mutation's owner must be captured at mutate() time, not re-read off the
// post-switch render (same convention as game-hook-test-utils' authUser;
// shared utils aren't imported here because this file needs the real
// setGameProfileCache).
const authUser = vi.hoisted(() => ({ id: "u1" }))
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: authUser.id } }),
}))
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

// Real setGameProfileCache — its server_time ordering is the thing under test.
import { setGameProfileCache, useUpdateAvatarConfig } from "./useGameProfile"

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

const cached = () =>
  queryClient.getQueryData<GameProfile>(["game-profile", { userId: "u1" }])

describe("setGameProfileCache", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    // setQueriesData only touches existing entries — materialize u2's.
    queryClient.setQueryData(["game-profile", { userId: "u2" }], PROFILE)
  })

  it("drops a stale-stamped write without cancelling a fresher in-flight GET", async () => {
    // A newer stamped write already owns the cache + the high-water mark.
    await setGameProfileCache(
      { ...PROFILE, xp: 999 },
      "u2",
      "2025-12-01T00:00:00Z"
    )

    // Park a profile GET in flight — its snapshot is fresher than the
    // stale-stamped response arriving next.
    let resolveGet: ((p: GameProfile) => void) | undefined
    const fetching = queryClient.fetchQuery({
      queryKey: ["game-profile", { userId: "u2" }],
      queryFn: () =>
        new Promise<GameProfile>((resolve) => (resolveGet = resolve)),
      // The shared client's 5-min staleTime would skip this fetch — the
      // just-seeded cache looks fresh.
      staleTime: 0,
    })
    // The retryer invokes the queryFn on a later tick — wait for it.
    await waitFor(() => expect(resolveGet).toBeDefined())
    const cancel = vi.spyOn(queryClient, "cancelQueries")

    await setGameProfileCache(
      { ...PROFILE, xp: 1 },
      "u2",
      "2025-01-01T10:00:00Z"
    )

    // The dropped write must not kill the GET — its fresher snapshot lands.
    expect(cancel).not.toHaveBeenCalled()
    resolveGet?.({ ...PROFILE, xp: 777 })
    await fetching
    expect(
      queryClient.getQueryData<GameProfile>(["game-profile", { userId: "u2" }])
        ?.xp
    ).toBe(777)
  })
})

describe("useUpdateAvatarConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    // setQueriesData only touches existing entries — the live app always has
    // one via useGameProfile; materialize it here.
    queryClient.setQueryData(["game-profile", { userId: "u1" }], PROFILE)
  })

  it("forwards server_time so a stale-stamped response is dropped", async () => {
    // A newer stamped write already owns the cache.
    await setGameProfileCache(
      { ...PROFILE, xp: 999 },
      "u1",
      "2025-12-01T00:00:00Z"
    )
    vi.mocked(gameApi.updateAvatarConfig).mockResolvedValue({
      ...PROFILE,
      server_time: "2025-01-01T10:00:00Z",
    })

    const { result } = renderHook(() => useUpdateAvatarConfig(), { wrapper })
    result.current.mutate({ seed: "kiki" })
    await waitFor(() => expect(queryClient.isMutating()).toBe(0))

    // The avatar response carried an older stamp → cache keeps newer totals.
    expect(cached()?.xp).toBe(999)
  })

  it("still applies responses that carry no server_time", async () => {
    vi.mocked(gameApi.updateAvatarConfig).mockResolvedValue({ ...PROFILE })

    const { result } = renderHook(() => useUpdateAvatarConfig(), { wrapper })
    result.current.mutate({ seed: "kiki" })
    await waitFor(() => expect(queryClient.isMutating()).toBe(0))

    expect(cached()?.xp).toBe(10)
  })

  it("folds under the account that fired the write when auth swaps mid-flight", async () => {
    // React Query swaps a pending mutation's options onto the latest render,
    // so the success path sees the NEW user — the owner must come from the
    // onMutate context captured at mutate() time.
    let resolvePatch: ((p: GameProfile) => void) | undefined
    vi.mocked(gameApi.updateAvatarConfig).mockImplementation(
      () =>
        new Promise<GameProfile>((resolve) => {
          resolvePatch = resolve
        })
    )
    // setQueriesData only writes existing entries — materialize u2's so a
    // fold under the wrong owner is visible instead of silently dropped.
    queryClient.setQueryData(["game-profile", { userId: "u2" }], PROFILE)

    const { result, rerender } = renderHook(() => useUpdateAvatarConfig(), {
      wrapper,
    })
    result.current.mutate({ seed: "kiki" })
    await waitFor(() => expect(queryClient.isMutating()).toBe(1))

    try {
      // Logout → login as another account while the write is in flight.
      authUser.id = "u2"
      rerender()
      await act(async () => {
        // No server_time → the always-apply path, so the write can't be
        // shadowed by the watermark an earlier test left behind.
        resolvePatch?.({ ...PROFILE, xp: 555 })
      })
      await waitFor(() => expect(queryClient.isMutating()).toBe(0))

      // The profile fold lands under the account that fired the write.
      expect(cached()?.xp).toBe(555)
      expect(
        queryClient.getQueryData<GameProfile>([
          "game-profile",
          { userId: "u2" },
        ])?.xp
      ).toBe(10)
    } finally {
      authUser.id = "u1"
    }
  })
})
