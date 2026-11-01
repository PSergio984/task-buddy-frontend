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
 * Push authoritative totals into this user's game-profile cache entry. Session
 * actions and /game/events responses already carry the profile — writing it
 * into the cache keeps the HUD current without an extra round trip. Scoped to
 * the owner's key so a cached profile can't bleed across accounts.
 *
 * An in-flight GET could resolve AFTER this write and overwrite the newer
 * authoritative totals with its older snapshot — cancel it first so the
 * write always wins the ordering.
 */
export async function setGameProfileCache(
  profile: GameProfile,
  userId: string
): Promise<void> {
  try {
    await queryClient.cancelQueries({
      queryKey: ["game-profile", { userId }],
    })
  } catch {
    // Cancellation is best-effort — the write below still lands.
  }
  queryClient.setQueriesData<GameProfile>(
    { queryKey: ["game-profile", { userId }] },
    profile
  )
}
