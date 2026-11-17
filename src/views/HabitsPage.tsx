import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { HabitsColumn } from "@/components/habits/habits-column"
import { DailiesColumn } from "@/components/dailies/dailies-column"
import { useHabitsDailiesViewModel } from "@/viewmodels/useHabitsDailiesViewModel"

export function HabitsPage() {
  const vm = useHabitsDailiesViewModel()

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

      {vm.writesDisabled && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          You're offline — lists can be read from cache but not changed.
        </p>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        <HabitsColumn
          habits={vm.habits}
          isPending={vm.isHabitsPending}
          isError={vm.isHabitsError}
          isOnline={vm.isOnline}
          writesDisabled={vm.writesDisabled}
          clickingIds={vm.clickingIds}
          busy={vm.habitsBusy}
          onRetry={vm.handleRetryHabits}
          onCreate={vm.handleCreateHabit}
          onUpdate={vm.handleUpdateHabit}
          onDelete={vm.handleDeleteHabit}
          onClick={vm.handleClickHabit}
        />
        <DailiesColumn
          dailies={vm.dailies}
          isPending={vm.isDailiesPending}
          isError={vm.isDailiesError}
          isOnline={vm.isOnline}
          writesDisabled={vm.writesDisabled}
          checkingIds={vm.checkingIds}
          busy={vm.dailiesBusy}
          onRetry={vm.handleRetryDailies}
          onCreate={vm.handleCreateDaily}
          onUpdate={vm.handleUpdateDaily}
          onDelete={vm.handleDeleteDaily}
          onCheck={vm.handleCheckDaily}
        />
      </div>
    </motion.div>
  )
}
