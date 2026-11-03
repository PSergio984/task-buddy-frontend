import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  activityApi,
  achievementsApi,
  characterApi,
  gearApi,
  type GameClass,
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
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: GEAR_BUY_MUTATION_KEY,
    mutationFn: (key: string) => gearApi.buy(key),
    onSuccess: async (res) => {
      // GearListResponse carries the post-buy catalog plus authoritative
      // totals — fold both into their caches instead of a refetch. Same
      // ordering guard as the habit click: cancel a racing list GET so it
      // can't fold a stale response over the newer rows.
      const userId = user?.id
      try {
        await queryClient.cancelQueries({
          queryKey: ["game-gear", { userId }],
        })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      if (userId !== undefined) {
        queryClient.setQueryData(["game-gear", { userId }], res.items)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
      }
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
    onSettled: () => {
      // Always resync: a stale fold can cancel a fresher write's spawned
      // refetch even when that write already settled (isMutating==1 misses
      // the interleave). Cheap endpoint — re-pull after every gear write.
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
  })
}

/**
 * Toggle one owned item's costume flag (#65). The response carries the
 * merged catalog plus authoritative profile totals — fold both into their
 * caches instead of refetching, same write convention as the equip.
 */
export function useToggleGearCostume() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { key: string; costume: boolean }) =>
      gearApi.toggleCostume(input),
    onSuccess: async (res) => {
      const userId = user?.id
      try {
        // Cancel a racing list refetch so it can't fold a stale GET over
        // the newer rows — same ordering guard as the equip write.
        await queryClient.cancelQueries({
          queryKey: ["game-gear", { userId }],
        })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      if (userId !== undefined) {
        queryClient.setQueryData(["game-gear", { userId }], res.items)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
      }
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't update worn gear",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
  })
}

export function useEquipGear() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: GEAR_EQUIP_MUTATION_KEY,
    mutationFn: ({ key, equipped }: { key: string; equipped: boolean }) =>
      gearApi.equip(key, equipped),
    onSuccess: async (res) => {
      const userId = user?.id
      try {
        await queryClient.cancelQueries({
          queryKey: ["game-gear", { userId }],
        })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      if (userId !== undefined) {
        queryClient.setQueryData(["game-gear", { userId }], res.items)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
      }
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't change equipment",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
  })
}

/**
 * Shared success path for the character writes that return GameProfileRead
 * — push authoritative totals into the HUD cache (server_time-ordered).
 */
function useProfileCacheWrite() {
  const { user } = useAuth()
  return async (profile: Parameters<typeof setGameProfileCache>[0]) => {
    if (user?.id !== undefined)
      await setGameProfileCache(profile, user.id, profile.server_time)
  }
}

export function useAllocateStats() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: (points: Partial<Record<StatKey, number>>) =>
      characterApi.allocate(points),
    onSuccess: applyProfile,
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
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: (autoAllocate: boolean) => characterApi.update(autoAllocate),
    onSuccess: applyProfile,
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
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: (gameClass: GameClass) => characterApi.selectClass(gameClass),
    onSuccess: async (profile) => {
      await applyProfile(profile)
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
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
  })
}

export function useRespec() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: () => characterApi.respec(),
    onSuccess: async (profile) => {
      await applyProfile(profile)
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
    onSettled: () => {
      // Same unconditional resync as the gear writes above — this
      // mutation also touches the gear cache.
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
    },
  })
}
