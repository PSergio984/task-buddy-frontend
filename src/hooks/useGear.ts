import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { gameApi, type GearItem } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { getErrorMessage } from "@/lib/errors"

/**
 * Gear queries/mutations (#65). The list doubles as the avatar overlay's
 * worn-gear source — owned items carry the equipped/costume flags.
 */
export function useGear() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["gear", { userId: user?.id }],
    queryFn: gameApi.listGear,
    enabled: !!user,
  })
}

/**
 * Toggle one owned item's costume flag. The response carries the merged
 * catalog plus authoritative profile totals — fold both into their caches
 * instead of refetching, same write convention as the daily check.
 */
export function useToggleGearCostume() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { key: string; costume: boolean }) =>
      gameApi.toggleGearCostume(input),
    onSuccess: async (res) => {
      const userId = user?.id
      try {
        // Cancel a racing list refetch so it can't fold a stale GET over
        // the newer rows — same ordering guard as the game-profile write.
        await queryClient.cancelQueries({ queryKey: ["gear", { userId }] })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      queryClient.setQueryData<GearItem[]>(["gear", { userId }], res.items)
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.profile.server_time)
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["gear"] })
      toast({
        title: "Couldn't update worn gear",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
