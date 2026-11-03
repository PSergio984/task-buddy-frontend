import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  habitsApi,
  type HabitClickDirection,
  type HabitClickResponse,
  type HabitInput,
  type HabitPatch,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { useScoredListWrite } from "@/hooks/useScoredListWrite"
import { getErrorMessage } from "@/lib/errors"

/** Lets `useMutationState` find in-flight clicks for the pending-id set. */
export const HABIT_CLICK_MUTATION_KEY = ["habit-click"] as const

/**
 * Habit queries/mutations. Like the diary domain there is no offline
 * write-queue for these writes yet — a click needs the server's drifted
 * value back to render honestly, so a failed mutation surfaces an error
 * toast instead of a queued optimistic row. Reads still render the
 * persisted query cache when offline.
 */
export function useHabits() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["habits", { userId: user?.id }],
    queryFn: habitsApi.list,
    enabled: !!user,
  })
}

function useHabitsInvalidate() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ["habits"] })
}

export function useCreateHabit() {
  const { toast } = useToast()
  const invalidate = useHabitsInvalidate()
  return useMutation({
    mutationFn: (input: HabitInput) => habitsApi.create(input),
    onSuccess: invalidate,
    onError: (err) => {
      toast({
        title: "Couldn't create habit",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateHabit() {
  const { toast } = useToast()
  const invalidate = useHabitsInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: HabitPatch }) =>
      habitsApi.update(id, patch),
    onSuccess: invalidate,
    onError: (err) => {
      // Resync on failure too — a rejected PATCH (e.g. deleted on another
      // device mid-edit) must reload the stored list, not keep the row.
      void invalidate()
      toast({
        title: "Couldn't update habit",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteHabit() {
  const { toast } = useToast()
  const invalidate = useHabitsInvalidate()
  return useMutation({
    mutationFn: (id: number) => habitsApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => {
      void invalidate()
      toast({
        title: "Couldn't delete habit",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useClickHabit() {
  // The click also lands a habit_click row in the ledger → the timeline's
  // markers — the shared scored-write path resyncs it beside the fold.
  return useScoredListWrite({
    mutationKey: HABIT_CLICK_MUTATION_KEY,
    mutationFn: ({
      id,
      direction,
      clientEventId,
    }: {
      id: number
      direction: HabitClickDirection
      clientEventId: string
    }) => habitsApi.click(id, direction, clientEventId),
    listKey: "habits",
    errorTitle: "Couldn't record click",
    pickRow: (res: HabitClickResponse) => res.habit,
  })
}
