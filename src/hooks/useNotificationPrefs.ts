import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { notificationPrefsApi, type NotificationPrefs } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

export function useNotificationPrefs() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["notification-prefs", { userId: user?.id }],
    queryFn: notificationPrefsApi.get,
    enabled: !!user,
  })
}

/**
 * Whole-object PUT — every save sends prefs + quiet_hours together, so the
 * optimistic write can apply the caller's object verbatim. The response is
 * the server's authoritative copy; a failed write rolls the cache back (and
 * resyncs — a timeout could still have committed server-side).
 *
 * Owner is stamped at mutate() time like the other game writes: a pending
 * mutation's options swap onto the latest render, so reading the user in
 * onSuccess could fold under the wrong account after a mid-flight auth swap.
 */
export function useUpdateNotificationPrefs() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => notificationPrefsApi.put(prefs),
    onMutate: async (next) => {
      const userId = user?.id
      const key = ["notification-prefs", { userId }]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<NotificationPrefs>(key)
      queryClient.setQueryData(key, next)
      return { userId, previous }
    },
    onSuccess: (saved, _next, context) => {
      queryClient.setQueryData(
        ["notification-prefs", { userId: context?.userId }],
        saved
      )
    },
    onError: (err, _next, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          ["notification-prefs", { userId: context.userId }],
          context.previous
        )
      } else {
        void queryClient.invalidateQueries({
          queryKey: ["notification-prefs"],
        })
      }
      toast({
        title: "Couldn't save notification preferences",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    // Settle-time resync is unconditional — a rapid second PUT can land an
    // older response over a newer optimistic state.
    onSettled: (_data, _err, _next, context) => {
      void queryClient.invalidateQueries({
        queryKey: ["notification-prefs", { userId: context?.userId }],
      })
    },
  })
}
