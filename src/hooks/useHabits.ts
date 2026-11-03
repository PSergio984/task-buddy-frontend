import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  habitsApi,
  type Habit,
  type HabitClickDirection,
  type HabitInput,
  type HabitPatch,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
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
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  return useMutation({
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
    // Stamp the write's owner at mutate() time — a pending mutation's options
    // swap onto the latest render, so the onSuccess closure would read the NEW
    // user after a mid-flight auth swap (same guard as the gear fold).
    onMutate: () => user?.id,
    onSuccess: async (res, _vars, userId) => {
      // The response carries the post-click habit plus authoritative totals —
      // fold both into their caches instead of a refetch round trip. The click
      // also lands a habit_click row in the ledger → the timeline's markers.
      try {
        // An in-flight list refetch resolving after this write would fold
        // the stale GET over the newer row — cancel it so the write wins.
        await queryClient.cancelQueries({ queryKey: ["habits", { userId }] })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      queryClient.setQueryData<Habit[]>(["habits", { userId }], (old) =>
        old?.map((h) => (h.id === res.habit.id ? res.habit : h))
      )
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.server_time)
      void queryClient.invalidateQueries({ queryKey: ["timeline"] })
      // Every scored write runs the server's achievement evaluation — the
      // badge list is as stale as the totals after a click.
      void queryClient.invalidateQueries({ queryKey: ["game-achievements"] })
    },
    onError: (err) => {
      // Resync on failure — a rejected click (e.g. direction PATCHed
      // mid-flight on another device) must reload the stored row.
      void queryClient.invalidateQueries({ queryKey: ["habits"] })
      toast({
        title: "Couldn't record click",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: () => {
      // Unconditional, same as the gear resync — a stale fold can cancel a
      // fresher write's spawned refetch even when that write already
      // settled, and the isMutating()>1 guard missed that interleave.
      void queryClient.invalidateQueries({ queryKey: ["habits"] })
    },
  })
}
