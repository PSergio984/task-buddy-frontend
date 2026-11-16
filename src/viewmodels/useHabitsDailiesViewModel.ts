/**
 * Habits & Dailies ViewModel
 * Encapsulates reactive queries, mutation states, idempotency generation,
 * offline gating, and action handlers for HabitsPage.
 */
import { useMutationState } from "@tanstack/react-query"
import { useIsOnline } from "@/hooks/useIsOnline"
import { createIdempotencyKey } from "@/lib/api"
import {
  HABIT_CLICK_MUTATION_KEY,
  useClickHabit,
  useCreateHabit,
  useDeleteHabit,
  useHabits,
  useUpdateHabit,
} from "@/hooks/useHabits"
import {
  DAILY_CHECK_MUTATION_KEY,
  useCheckDaily,
  useCreateDaily,
  useDailies,
  useDeleteDaily,
  useUpdateDaily,
} from "@/hooks/useDailies"
import type {
  HabitClickDirection,
  HabitInput,
  HabitPatch,
} from "@/models/habit.model"
import type {
  DailyCheckInput,
  DailyInput,
  DailyPatch,
} from "@/models/daily.model"

export function useHabitsDailiesViewModel() {
  const isOnline = useIsOnline()

  // Queries
  const habitsQuery = useHabits()
  const dailiesQuery = useDailies()

  // Mutations
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()
  const clickHabit = useClickHabit()

  const createDaily = useCreateDaily()
  const updateDaily = useUpdateDaily()
  const deleteDaily = useDeleteDaily()
  const checkDaily = useCheckDaily()

  // In-flight mutation tracking
  const pendingClickIds = useMutationState({
    filters: { mutationKey: HABIT_CLICK_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { id: number }).id,
  })
  const pendingCheckIds = useMutationState({
    filters: { mutationKey: DAILY_CHECK_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { id: number }).id,
  })

  // Computed state
  const writesDisabled = !isOnline
  const habitsBusy =
    createHabit.isPending || updateHabit.isPending || deleteHabit.isPending
  const dailiesBusy =
    createDaily.isPending || updateDaily.isPending || deleteDaily.isPending

  // Action handlers
  const handleCreateHabit = (input: HabitInput) => createHabit.mutateAsync(input)
  const handleUpdateHabit = (id: number, patch: HabitPatch) =>
    updateHabit.mutateAsync({ id, patch })
  const handleDeleteHabit = (id: number) => deleteHabit.mutate(id)
  const handleClickHabit = (id: number, direction: HabitClickDirection) => {
    clickHabit.mutate({
      id,
      direction,
      clientEventId: createIdempotencyKey(),
    })
  }
  const handleRetryHabits = () => {
    void habitsQuery.refetch()
  }

  const handleCreateDaily = (input: DailyInput) => createDaily.mutateAsync(input)
  const handleUpdateDaily = (id: number, patch: DailyPatch) =>
    updateDaily.mutateAsync({ id, patch })
  const handleDeleteDaily = (id: number) => deleteDaily.mutate(id)
  const handleCheckDaily = (id: number, input: DailyCheckInput) => {
    checkDaily.mutate({
      id,
      input,
      clientEventId: createIdempotencyKey(),
    })
  }
  const handleRetryDailies = () => {
    void dailiesQuery.refetch()
  }

  return {
    // Habits state
    habits: habitsQuery.data,
    isHabitsPending: habitsQuery.isPending,
    isHabitsError: habitsQuery.isError,
    habitsBusy,
    clickingIds: new Set(pendingClickIds),

    // Dailies state
    dailies: dailiesQuery.data,
    isDailiesPending: dailiesQuery.isPending,
    isDailiesError: dailiesQuery.isError,
    dailiesBusy,
    checkingIds: new Set(pendingCheckIds),

    // Connectivity state
    isOnline,
    writesDisabled,

    // Habits actions
    handleCreateHabit,
    handleUpdateHabit,
    handleDeleteHabit,
    handleClickHabit,
    handleRetryHabits,

    // Dailies actions
    handleCreateDaily,
    handleUpdateDaily,
    handleDeleteDaily,
    handleCheckDaily,
    handleRetryDailies,
  }
}
