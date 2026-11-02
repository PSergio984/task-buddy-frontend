import { useMutation, useQuery } from "@tanstack/react-query"
import { gameApi, type GameProfile } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { queryClient } from "@/lib/query-client"
import { getErrorMessage } from "@/lib/errors"
import { ms } from "@/lib/focus-session"

export function useGameProfile() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["game-profile", { userId: user?.id }],
    queryFn: gameApi.getProfile,
    enabled: !!user,
  })
}

// High-water mark of the newest server_time applied per user. Scoring
// responses carry their own server_time — a late-arriving response (e.g. a
// slower parallel POST resolving after a newer one) holds an older profile
// snapshot and must not regress the HUD totals.
const maxServerTime = new Map<string, number>()

/**
 * Push authoritative totals into this user's game-profile cache entry. Session
 * actions and /game/events responses already carry the profile — writing it
 * into the cache keeps the HUD current without an extra round trip. Scoped to
 * the owner's key so a cached profile can't bleed across accounts.
 *
 * An in-flight GET could resolve AFTER this write and overwrite the newer
 * authoritative totals with its older snapshot — cancel it first so the
 * write always wins the ordering.
 *
 * `serverTime` orders competing writes: a response stamped older than the
 * newest applied write is dropped. Callers without a server_time in their
 * response leave it undefined — absent means always-apply.
 */
export async function setGameProfileCache(
  profile: GameProfile,
  userId: string,
  serverTime?: string
): Promise<void> {
  try {
    await queryClient.cancelQueries({
      queryKey: ["game-profile", { userId }],
    })
  } catch {
    // Cancellation is best-effort — the write below still lands.
  }
  if (serverTime !== undefined) {
    const at = ms(serverTime)
    if (at !== null && Number.isFinite(at)) {
      const seen = maxServerTime.get(userId)
      if (seen !== undefined && at < seen) return
      maxServerTime.set(userId, at)
    }
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
