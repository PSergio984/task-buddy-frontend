import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

export function useNotifications(params?: {
  limit?: number
  offset?: number
  read?: boolean
}) {
  const { toast } = useToast()
  const { user } = useAuth()

  const query = useQuery({
    queryKey: ["notifications", { userId: user?.id, ...params }],
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    enabled: !!user,
  })

  // Ref to track already toasted notification IDs to avoid duplicates
  // Using ref instead of state to avoid cascading renders
  const toastedIds = useRef<Set<number>>(new Set())
  // Session start: only notifications created AFTER mount are toasted. Unread
  // backlog (or re-fetches after reconnect) must not re-burst old toasts
  // (audit #6 — every unread used to be toasted on load + every 30s refetch).
  const sessionStartMs = useRef<number>(0)
  useEffect(() => {
    sessionStartMs.current = Date.now()
  }, [])

  useEffect(() => {
    if (query.data?.items && query.data.items.length > 0) {
      // Find unread notifications newer than this session that haven't been
      // toasted yet
      const newHighPriority = query.data.items.filter(
        (n) =>
          !n.is_read &&
          !toastedIds.current.has(n.id) &&
          Date.parse(n.created_at) > sessionStartMs.current
      )

      if (newHighPriority.length > 0) {
        newHighPriority.forEach((n) => {
          toast({
            title: n.title,
            description: n.message,
          })
          toastedIds.current.add(n.id)
        })
      }
    }
  }, [query.data, toast])

  // Derived state for unread count
  // Note: This only counts unread notifications in the current page/result set
  const unreadCount = query.data?.items?.filter((n) => !n.is_read).length || 0

  return {
    ...query,
    notifications: query.data?.items || [],
    total: query.data?.total || 0,
    unreadCount,
  }
}

export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

export function useRegisterPush() {
  return useMutation({
    mutationFn: (
      subscription: Parameters<
        typeof notificationsApi.registerPushSubscription
      >[0]
    ) => notificationsApi.registerPushSubscription(subscription),
  })
}

export function useVapidKey() {
  return useQuery({
    queryKey: ["vapid-key"],
    queryFn: () => notificationsApi.getVapidKey(),
    staleTime: Infinity, // VAPID key rarely changes
  })
}
