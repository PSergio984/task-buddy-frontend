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

/**
 * Daily queries/mutations. Same write convention as the habits column —
 * checks write straight to the API (no offline queue yet) and failures
 * resync + toast; reads render the persisted query cache when offline.
 */
export function useDailies() {
  const { user } = useAuth()
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
    mutationFn: ({ id, input }: { id: number; input: DailyCheckInput }) =>
      dailiesApi.check(id, input),
    onSuccess: async (res) => {
      // The response carries the daily with today's marks plus authoritative
      // totals — fold both into their caches instead of a refetch.
      const userId = user?.id
      queryClient.setQueryData<Daily[]>(["dailies", { userId }], (old) =>
        old?.map((d) => (d.id === res.daily.id ? res.daily : d))
      )
      if (userId !== undefined) await setGameProfileCache(res.profile, userId)
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["dailies"] })
      toast({
        title: "Couldn't record check",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
