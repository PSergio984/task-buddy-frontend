import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  dailiesApi,
  type Daily,
  type DailyCheckInput,
  type DailyInput,
  type DailyPatch,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { getErrorMessage } from "@/lib/errors"

/** Lets `useMutationState` find in-flight checks for the pending-id set. */
export const DAILY_CHECK_MUTATION_KEY = ["daily-check"] as const

/**
 * Daily queries/mutations. Same write convention as the habits column —
 * checks write straight to the API (no offline queue yet) and failures
 * resync + toast; reads render the persisted query cache when offline.
 */
export function useDailies() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // completed_today is server-computed per UTC day, and the app disables
  // refetchOnWindowFocus — without these triggers an overnight tab keeps
  // rendering (and un-marking) yesterday's checks.
  useEffect(() => {
    if (typeof window === "undefined") return
    const resync = () =>
      void queryClient.invalidateQueries({ queryKey: ["dailies"] })
    let timer: ReturnType<typeof setTimeout>
    const armRollover = () => {
      const midnight = new Date()
      midnight.setUTCHours(24, 0, 0, 0)
      timer = setTimeout(() => {
        resync()
        armRollover()
      }, midnight.getTime() - Date.now())
    }
    armRollover()
    // A suspended tab wakes to visibilitychange, not a window-focus refetch
    // — same staleness hole after a sleep-overnight.
    const onVisible = () => {
      if (document.visibilityState === "visible") resync()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ["dailies", { userId: user?.id }],
    queryFn: dailiesApi.list,
    enabled: !!user,
  })
}

function useDailiesInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["dailies"] })
}

export function useCreateDaily() {
  const { toast } = useToast()
  const invalidate = useDailiesInvalidate()
  return useMutation({
    mutationFn: (input: DailyInput) => dailiesApi.create(input),
    onSuccess: invalidate,
    onError: (err) => {
      toast({
        title: "Couldn't create daily",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateDaily() {
  const { toast } = useToast()
  const invalidate = useDailiesInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: DailyPatch }) =>
      dailiesApi.update(id, patch),
    onSuccess: invalidate,
    onError: (err) => {
      // Resync on failure too — same contract as the update-habit hook.
      void invalidate()
      toast({
        title: "Couldn't update daily",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteDaily() {
  const { toast } = useToast()
  const invalidate = useDailiesInvalidate()
  return useMutation({
    mutationFn: (id: number) => dailiesApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => {
      void invalidate()
      toast({
        title: "Couldn't delete daily",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useCheckDaily() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: DAILY_CHECK_MUTATION_KEY,
    mutationFn: ({
      id,
      input,
      clientEventId,
    }: {
      id: number
      input: DailyCheckInput
      clientEventId: string
    }) => dailiesApi.check(id, input, clientEventId),
    onSuccess: async (res) => {
      // The response carries the daily with today's marks plus authoritative
      // totals — fold both into their caches instead of a refetch. The check
      // also lands a daily_check row in the ledger → the timeline's markers.
      const userId = user?.id
      try {
        // Cancel a racing list refetch so it can't fold a stale GET over
        // the newer row — same ordering guard as the game-profile write.
        await queryClient.cancelQueries({ queryKey: ["dailies", { userId }] })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      queryClient.setQueryData<Daily[]>(["dailies", { userId }], (old) =>
        old?.map((d) => (d.id === res.daily.id ? res.daily : d))
      )
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.server_time)
      void queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["dailies"] })
      toast({
        title: "Couldn't record check",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: () => {
      // Settling while another write is still running means the success
      // path above cancelled the list refetch that write relies on — a
      // created/edited row would never appear. Resync in that case only;
      // isMutating counts this still-callback-running mutation, hence > 1.
      if (queryClient.isMutating() > 1)
        void queryClient.invalidateQueries({ queryKey: ["dailies"] })
    },
  })
}
