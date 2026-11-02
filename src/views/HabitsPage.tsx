import { motion } from "framer-motion"
import { useMutationState } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { HabitsColumn } from "@/components/habits/habits-column"
import { DailiesColumn } from "@/components/dailies/dailies-column"
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

export function HabitsPage() {
  const isOnline = useIsOnline()

  const habitsQuery = useHabits()
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()
  const deleteHabit = useDeleteHabit()
  const clickHabit = useClickHabit()

  const dailiesQuery = useDailies()
  const createDaily = useCreateDaily()
  const updateDaily = useUpdateDaily()
  const deleteDaily = useDeleteDaily()
  const checkDaily = useCheckDaily()

  // Pending click/check ids as a SET — mutation.variables tracks only the
  // latest call, so earlier in-flight rows would re-enable and allow a
  // double-submit (habits double-score server-side). Per-row granularity.
  const pendingClickIds = useMutationState({
    filters: { mutationKey: HABIT_CLICK_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { id: number }).id,
  })
  const pendingCheckIds = useMutationState({
    filters: { mutationKey: DAILY_CHECK_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { id: number }).id,
  })

  // No offline write-queue for habits/dailies yet: a click/check needs the
  // server's drifted value or streak back to render honestly (unlike
  // fire-and-forget focus-session claims). Same convention as the diary
  // domain — writes disable offline; reads render the persisted cache.
  const writesDisabled = !isOnline

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col gap-8 bg-background/20 p-4 backdrop-blur-3xl md:p-8 lg:p-12"
    >
      <header className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
        >
          Game routines
        </Badge>
        <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
          Habits &amp; Dailies
        </h1>
      </header>

      {writesDisabled && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          You're offline — lists can be read from cache but not changed.
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <HabitsColumn
          habits={habitsQuery.data}
          isPending={habitsQuery.isPending}
          isError={habitsQuery.isError}
          isOnline={isOnline}
          writesDisabled={writesDisabled}
          clickingIds={new Set(pendingClickIds)}
          busy={
            createHabit.isPending ||
            updateHabit.isPending ||
            deleteHabit.isPending
          }
          onRetry={() => void habitsQuery.refetch()}
          onCreate={(input) => createHabit.mutateAsync(input)}
          onUpdate={(id, patch) => updateHabit.mutateAsync({ id, patch })}
          onDelete={(id) => deleteHabit.mutate(id)}
          onClick={(id, direction) =>
            // One client_event_id per gesture — a refired call reuses it so
            // the server-side dedupe can engage.
            clickHabit.mutate({
              id,
              direction,
              clientEventId: createIdempotencyKey(),
            })
          }
        />
        <DailiesColumn
          dailies={dailiesQuery.data}
          isPending={dailiesQuery.isPending}
          isError={dailiesQuery.isError}
          isOnline={isOnline}
          writesDisabled={writesDisabled}
          checkingIds={new Set(pendingCheckIds)}
          busy={
            createDaily.isPending ||
            updateDaily.isPending ||
            deleteDaily.isPending
          }
          onRetry={() => void dailiesQuery.refetch()}
          onCreate={(input) => createDaily.mutateAsync(input)}
          onUpdate={(id, patch) => updateDaily.mutateAsync({ id, patch })}
          onDelete={(id) => deleteDaily.mutate(id)}
          onCheck={(id, input) =>
            checkDaily.mutate({
              id,
              input,
              clientEventId: createIdempotencyKey(),
            })
          }
        />
      </div>
    </motion.div>
  )
}
