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
    mutationFn: ({
      id,
      direction,
    }: {
      id: number
      direction: HabitClickDirection
    }) => habitsApi.click(id, direction),
    onSuccess: async (res) => {
      // The response carries the post-click habit plus authoritative totals —
      // fold both into their caches instead of a refetch round trip. The click
      // also lands a habit_click row in the ledger → the timeline's markers.
      const userId = user?.id
      queryClient.setQueryData<Habit[]>(["habits", { userId }], (old) =>
        old?.map((h) => (h.id === res.habit.id ? res.habit : h))
      )
      if (userId !== undefined) await setGameProfileCache(res.profile, userId)
      void queryClient.invalidateQueries({ queryKey: ["timeline"] })
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
  })
}
