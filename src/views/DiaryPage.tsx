import { motion } from "framer-motion"
import { RefreshCw, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DayNavigator } from "@/components/day-navigator"
import { DiaryDayPanel } from "@/components/diary/diary-day-panel"
import { RetentionSelector } from "@/components/diary/retention-selector"
import { useDiaryViewModel } from "@/viewmodels/useDiaryViewModel"

export function DiaryPage() {
  const vm = useDiaryViewModel()

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
          Daily journal
        </Badge>
        <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
          Diary
        </h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <DayNavigator day={vm.day} onChange={vm.setDay} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            Keep
          </span>
          <RetentionSelector
            value={vm.retention}
            onChange={(v) => vm.changeRetention(v)}
            disabled={
              vm.retentionPending ||
              vm.profile === undefined ||
              !vm.isOnline
            }
          />
        </div>
      </div>

      {vm.isPending ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        </div>
      ) : vm.isError ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          {!vm.isOnline && <WifiOff className="h-8 w-8 text-amber-400" />}
          <p className="text-sm text-muted-foreground">
            {vm.isOnline
              ? "Couldn't load this day's entries."
              : "You're offline and this day isn't in the local cache."}
          </p>
          <Button
            variant="outline"
            onClick={() => void vm.refetch()}
            className="h-10 gap-2 rounded-2xl border-white/15 px-5 font-bold"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : (
        <DiaryDayPanel
          key={vm.day}
          entries={vm.entries}
          writesDisabled={vm.writesDisabled}
          disabledReason={vm.disabledReason}
          busy={vm.busy}
          onCreateStandup={vm.createStandup}
          onCreateFreeform={vm.createFreeform}
          onUpdateEntry={vm.updateEntry}
          onDeleteEntry={vm.deleteEntry}
        />
      )}
    </motion.div>
  )
}
