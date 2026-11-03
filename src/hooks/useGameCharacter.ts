import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query"
import {
  activityApi,
  achievementsApi,
  characterApi,
  gearApi,
  type GameClass,
  type GearListResponse,
  type StatKey,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { useUtcDayRollover } from "@/hooks/useUtcDayRollover"
import { getErrorMessage } from "@/lib/errors"

/** Lets `useMutationState` find in-flight buys/equips for pending-key sets. */
export const GEAR_BUY_MUTATION_KEY = ["gear-buy"] as const
export const GEAR_EQUIP_MUTATION_KEY = ["gear-equip"] as const
/** Same convention — no pending-key consumer yet, kept for consistency. */
export const GEAR_COSTUME_MUTATION_KEY = ["gear-costume"] as const

/**
 * Settle-time resync shared by every gear-affecting write. Unconditional:
 * a stale fold can cancel a fresher write's spawned refetch even when that
 * write already settled — the isMutating()>1 guard missed that interleave.
 * The catalog is small, so re-pulling on every settle is cheap insurance.
 */
const resyncGear = (queryClient: QueryClient) => () =>
  void queryClient.invalidateQueries({ queryKey: ["game-gear"] })

/**
 * Shared success path for the three catalog writes (buy, equip, costume
 * toggle) — fold the merged GearListResponse into the gear + profile
 * caches instead of a refetch. The cancelQueries ordering guard stops a
 * racing list GET from folding a stale response over the newer rows.
 */
function useFoldGearResponse() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  // The write's owner — onMutate returns it as per-mutation context, so a
  // logout→login mid-flight still folds under the account that fired the
  // write (the onSuccess closure would otherwise see the new user). Same
  // guard as GameContext's userIdRef.
  const stampOwner = () => user?.id
  const foldGear = async (
    res: GearListResponse,
    userId: string | undefined
  ) => {
    try {
      await queryClient.cancelQueries({ queryKey: ["game-gear", { userId }] })
    } catch {
      // Cancellation is best-effort — the write below still lands.
    }
    if (userId !== undefined) {
      queryClient.setQueryData(["game-gear", { userId }], res.items)
      await setGameProfileCache(res.profile, userId, res.profile.server_time)
    }
  }
  return { foldGear, stampOwner }
}

/**
 * Character-sheet queries/mutations (gear, achievements, stat/class writes).
 * Same convention as the habits/dailies domain — writes go straight to the
 * API (no offline queue: the server owns gold/stat arithmetic) and a failed
 * write resyncs + toasts; reads render the persisted cache offline.
 */
export function useGear(enabled = true) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["game-gear", { userId: user?.id }],
    queryFn: gearApi.list,
    enabled: !!user && enabled,
  })
}

export function useAchievements() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["game-achievements", { userId: user?.id }],
    queryFn: achievementsApi.list,
    enabled: !!user,
  })
}

export function useActivityGrid() {
  const { user } = useAuth()
  // The grid is a fixed trailing-day window — roll it at the UTC boundary.
  useUtcDayRollover("game-activity-grid")
  return useQuery({
    queryKey: ["game-activity-grid", { userId: user?.id }],
    queryFn: () => activityApi.grid(),
    enabled: !!user,
  })
}

export function useActivityStats() {
  const { user } = useAuth()
  useUtcDayRollover("game-activity-stats")
  return useQuery({
    queryKey: ["game-activity-stats", { userId: user?.id }],
    queryFn: () => activityApi.stats(),
    enabled: !!user,
  })
}

export function useBuyGear() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { foldGear, stampOwner } = useFoldGearResponse()
  return useMutation({
    mutationKey: GEAR_BUY_MUTATION_KEY,
    mutationFn: (key: string) => gearApi.buy(key),
    onMutate: stampOwner,
    onSuccess: async (res, _key, userId) => {
      await foldGear(res, userId)
      // 'first-gear' can grant on the buy — resync the badge list.
      void queryClient.invalidateQueries({ queryKey: ["game-achievements"] })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't buy item",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: resyncGear(queryClient),
  })
}

/**
 * Toggle one owned item's costume flag (#65). The response carries the
 * merged catalog plus authoritative profile totals — fold both into their
 * caches instead of refetching, same write convention as the equip.
 */
export function useToggleGearCostume() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { foldGear, stampOwner } = useFoldGearResponse()
  return useMutation({
    mutationKey: GEAR_COSTUME_MUTATION_KEY,
    mutationFn: (input: { key: string; costume: boolean }) =>
      gearApi.toggleCostume(input),
    onMutate: stampOwner,
    onSuccess: (res, _input, userId) => foldGear(res, userId),
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't update worn gear",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: resyncGear(queryClient),
  })
}

export function useEquipGear() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { foldGear, stampOwner } = useFoldGearResponse()
  return useMutation({
    mutationKey: GEAR_EQUIP_MUTATION_KEY,
    mutationFn: ({ key, equipped }: { key: string; equipped: boolean }) =>
      gearApi.equip(key, equipped),
    onMutate: stampOwner,
    onSuccess: (res, _vars, userId) => foldGear(res, userId),
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't change equipment",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: resyncGear(queryClient),
  })
}

/**
 * Shared success path for the character writes that return GameProfileRead
 * — push authoritative totals into the HUD cache (server_time-ordered).
 */
function useProfileCacheWrite() {
  const { user } = useAuth()
  // Same cross-account guard as the gear fold — the profile cache key is
  // user-scoped too.
  const stampOwner = () => user?.id
  const applyProfile = async (
    profile: Parameters<typeof setGameProfileCache>[0],
    userId: string | undefined
  ) => {
    if (userId !== undefined)
      await setGameProfileCache(profile, userId, profile.server_time)
  }
  return { applyProfile, stampOwner }
}

export function useAllocateStats() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { applyProfile, stampOwner } = useProfileCacheWrite()
  return useMutation({
    mutationFn: (points: Partial<Record<StatKey, number>>) =>
      characterApi.allocate(points),
    onMutate: stampOwner,
    onSuccess: (profile, _points, userId) => applyProfile(profile, userId),
    onError: (err) => {
      // Resync on failure — the cached profile keeps stale totals
      // otherwise (same contract as the habit click).
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] })
      toast({
        title: "Couldn't allocate points",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateCharacter() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { applyProfile, stampOwner } = useProfileCacheWrite()
  return useMutation({
    mutationFn: (autoAllocate: boolean) => characterApi.update(autoAllocate),
    onMutate: stampOwner,
    onSuccess: (profile, _enabled, userId) => applyProfile(profile, userId),
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] })
      toast({
        title: "Couldn't update character",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useSelectClass() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { applyProfile, stampOwner } = useProfileCacheWrite()
  return useMutation({
    mutationFn: (gameClass: GameClass) => characterApi.selectClass(gameClass),
    onMutate: stampOwner,
    onSuccess: async (profile, _gameClass, userId) => {
      await applyProfile(profile, userId)
      // The pick runs achievements.evaluate ('class-picked') and strips
      // equipped cross-class gear — resync both beside the HUD totals.
      void queryClient.invalidateQueries({ queryKey: ["game-achievements"] })
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] })
      toast({
        title: "Couldn't pick class",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: resyncGear(queryClient),
  })
}

export function useRespec() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { applyProfile, stampOwner } = useProfileCacheWrite()
  return useMutation({
    mutationFn: () => characterApi.respec(),
    onMutate: stampOwner,
    onSuccess: async (profile, _vars, userId) => {
      await applyProfile(profile, userId)
      // Respec strips every equipped class piece (unequip_mismatched).
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-profile"] })
      toast({
        title: "Couldn't respec",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: resyncGear(queryClient),
  })
}
