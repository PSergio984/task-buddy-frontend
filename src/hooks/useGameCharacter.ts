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
export function useGear() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["game-gear", { userId: user?.id }],
    queryFn: gearApi.list,
    enabled: !!user,
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

export function useActivityGrid(start?: string, end?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["game-activity-grid", { userId: user?.id, start, end }],
    queryFn: () => activityApi.grid(start, end),
    enabled: !!user,
  })
}

export function useActivityStats(start?: string, end?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["game-activity-stats", { userId: user?.id, start, end }],
    queryFn: () => activityApi.stats(start, end),
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
      queryClient.setQueryData(["game-gear", { userId }], res.items)
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
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
      queryClient.setQueryData(["game-gear", { userId }], res.items)
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["game-gear"] })
      toast({
        title: "Couldn't change equipment",
        description: getErrorMessage(err),
        variant: "destructive",
      })
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
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: (points: Partial<Record<StatKey, number>>) =>
      characterApi.allocate(points),
    onSuccess: applyProfile,
    onError: (err) => {
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
  const applyProfile = useProfileCacheWrite()
  return useMutation({
    mutationFn: (autoAllocate: boolean) => characterApi.update(autoAllocate),
    onSuccess: applyProfile,
    onError: (err) => {
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
      toast({
        title: "Couldn't pick class",
        description: getErrorMessage(err),
        variant: "destructive",
      })
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
      toast({
        title: "Couldn't respec",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
