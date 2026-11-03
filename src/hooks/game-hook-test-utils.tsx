import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { expect, vi } from "vitest"
import type { GameProfile } from "@/lib/api"

// Shared scaffolding for the game-column hook tests. The mocks register at
// import time, so test files must import this module before the hook under
// test (whose own imports pull in the mocked modules).
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

export function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

export const profile: GameProfile = {
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

export const SERVER_TIME = "2025-11-01T10:00:00Z"

/**
 * A promise with its resolve function pried out — hand `deferred.promise` to
 * a mocked API call and the mutation parks in flight until the test resolves
 * it. Pair with `mockResolvedValue` for the calls that should land instantly.
 */
export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

// The slice of useMutation's result the settle-resync scenario drives.
type MutationSlice<V> = {
  mutate: (vars: V) => void
  isPending: boolean
  isSuccess: boolean
}

/**
 * The "settles while another write is in flight" scenario shared by the
 * mutation hooks: hold one mutation in flight on a deferred API call, fire a
 * second mutation that resolves immediately, and verify the settling write's
 * guard re-invalidated the list query — its success path cancelled the
 * refetch the held write relies on, so without the restart the held write's
 * rows never appear. Releases the held write before returning.
 */
export async function expectSettleResync<HoldVars, SettleVars>(opts: {
  queryClient: QueryClient
  useMutations: () => {
    hold: MutationSlice<HoldVars>
    settle: MutationSlice<SettleVars>
  }
  holdVars: NoInfer<HoldVars>
  settleVars: NoInfer<SettleVars>
  listQueryKey: string
  releaseHold: () => void
}) {
  const invalidate = vi.spyOn(opts.queryClient, "invalidateQueries")
  const { result } = renderHook(opts.useMutations, {
    wrapper: makeWrapper(opts.queryClient),
  })

  act(() => {
    result.current.hold.mutate(opts.holdVars)
  })
  await waitFor(() => expect(result.current.hold.isPending).toBe(true))
  act(() => {
    result.current.settle.mutate(opts.settleVars)
  })
  await waitFor(() => expect(result.current.settle.isSuccess).toBe(true))

  expect(invalidate).toHaveBeenCalledWith({ queryKey: [opts.listQueryKey] })

  await act(async () => {
    opts.releaseHold()
  })
}
