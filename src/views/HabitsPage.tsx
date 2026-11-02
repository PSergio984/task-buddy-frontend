import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { HabitsColumn } from "@/components/habits/habits-column"
import { DailiesColumn } from "@/components/dailies/dailies-column"
import { useIsOnline } from "@/hooks/useIsOnline"
import {
  useClickHabit,
  useCreateHabit,
  useDeleteHabit,
  useHabits,
  useUpdateHabit,
} from "@/hooks/useHabits"
import {
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
          clickingId={
            clickHabit.isPending ? (clickHabit.variables?.id ?? null) : null
          }
          busy={
            createHabit.isPending ||
            updateHabit.isPending ||
            deleteHabit.isPending
          }
          onRetry={() => void habitsQuery.refetch()}
          onCreate={(input) => createHabit.mutateAsync(input)}
          onUpdate={(id, patch) => updateHabit.mutateAsync({ id, patch })}
          onDelete={(id) => deleteHabit.mutate(id)}
          onClick={(id, direction) => clickHabit.mutate({ id, direction })}
        />
        <DailiesColumn
          dailies={dailiesQuery.data}
          isPending={dailiesQuery.isPending}
          isError={dailiesQuery.isError}
          isOnline={isOnline}
          writesDisabled={writesDisabled}
          checkingId={
            checkDaily.isPending ? (checkDaily.variables?.id ?? null) : null
          }
          busy={
            createDaily.isPending ||
            updateDaily.isPending ||
            deleteDaily.isPending
          }
          onRetry={() => void dailiesQuery.refetch()}
          onCreate={(input) => createDaily.mutateAsync(input)}
          onUpdate={(id, patch) => updateDaily.mutateAsync({ id, patch })}
          onDelete={(id) => deleteDaily.mutate(id)}
          onCheck={(id, input) => checkDaily.mutate({ id, input })}
        />
      </div>
    </motion.div>
  )
}
