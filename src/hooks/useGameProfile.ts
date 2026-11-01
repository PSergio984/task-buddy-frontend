import { useQuery } from "@tanstack/react-query"
import { gameApi, type GameProfile } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { queryClient } from "@/lib/query-client"

export function useGameProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["game-profile", { userId: user?.id }],
    queryFn: gameApi.getProfile,
    enabled: !!user,
  })
}

/**
 * Push authoritative totals into every game-profile cache entry. Session
 * actions and /game/events responses already carry the profile — writing it
 * into the cache keeps the HUD current without an extra round trip.
 */
export function setGameProfileCache(profile: GameProfile) {
  queryClient.setQueriesData<GameProfile>(
    { queryKey: ["game-profile"] },
    profile
  )
}
