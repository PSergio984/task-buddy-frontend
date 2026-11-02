import { useMutation, useQuery } from "@tanstack/react-query"
import { gameApi, type GameProfile } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { queryClient } from "@/lib/query-client"
import { getErrorMessage } from "@/lib/errors"

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

/**
 * Save the avatar picker's config blob. The PATCH returns the authoritative
 * profile — writing it into the cache refreshes the HUD without a refetch.
 */
export function useUpdateAvatarConfig() {
  const { user } = useAuth()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (avatarConfig: Record<string, unknown>) =>
      gameApi.updateAvatarConfig(avatarConfig),
    onSuccess: async (profile) => {
      if (user?.id !== undefined) await setGameProfileCache(profile, user.id)
      toast({ title: "Avatar saved", variant: "success" })
    },
    onError: (err) => {
      toast({
        title: "Couldn't save avatar",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
