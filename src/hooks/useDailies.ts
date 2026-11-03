import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  dailiesApi,
  type DailyCheckInput,
  type DailyCheckResponse,
  type DailyInput,
  type DailyPatch,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useScoredListWrite } from "@/hooks/useScoredListWrite"
import { useUtcDayRollover } from "@/hooks/useUtcDayRollover"
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

  // completed_today is server-computed per UTC day — an overnight tab
  // would keep rendering (and un-marking) yesterday's checks.
  useUtcDayRollover("dailies")

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
  // The check also lands a daily_check row in the ledger → the timeline's
  // markers — the shared scored-write path resyncs it beside the fold.
  return useScoredListWrite({
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
    listKey: "dailies",
    errorTitle: "Couldn't record check",
    pickRow: (res: DailyCheckResponse) => res.daily,
  })
}
