import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"

export function useNotifications(params?: { limit?: number; offset?: number; read?: boolean }) {
  const { toast } = useToast()
  const { user } = useAuth()
  
  const query = useQuery({
    queryKey: ["notifications", { userId: user?.id, ...params }],
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 120000, // 2 minutes
    refetchOnWindowFocus: true,
    enabled: !!user,
  })

  // Ref to track already toasted notification IDs to avoid duplicates
  // Using ref instead of state to avoid cascading renders
  const toastedIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (query.data?.items && query.data.items.length > 0) {
      // Find unread high-priority notifications that haven't been toasted yet
      const newHighPriority = query.data.items.filter(
        (n) => !n.read && n.priority >= 2 && !toastedIds.current.has(n.id)
      )

      if (newHighPriority.length > 0) {
        newHighPriority.forEach(n => {
          toast({
            title: n.title,
            description: n.body,
          })
          toastedIds.current.add(n.id)
        })
      }
    }
  }, [query.data, toast])

  // Derived state for unread count
  // Note: This only counts unread notifications in the current page/result set
  const unreadCount = query.data?.items?.filter(n => !n.read).length || 0

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

export function useRegisterPush() {
  return useMutation({
    mutationFn: (subscription: Parameters<typeof notificationsApi.registerPushSubscription>[0]) => notificationsApi.registerPushSubscription(subscription),
  })
}

export function useVapidKey() {
  return useQuery({
    queryKey: ["vapid-key"],
    queryFn: () => notificationsApi.getVapidKey(),
    staleTime: Infinity, // VAPID key rarely changes
  })
}
