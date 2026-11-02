import { useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DayNavigator } from "@/components/day-navigator"
import { DiaryDayPanel } from "@/components/diary/diary-day-panel"
import { RetentionSelector } from "@/components/diary/retention-selector"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useIsOnline } from "@/hooks/useIsOnline"
import {
  useCreateDiaryEntry,
  useDeleteDiaryEntry,
  useDiaryEntries,
  useUpdateDiaryEntry,
  useUpdateRetention,
} from "@/hooks/useDiary"
import type { DiaryEntryPatch } from "@/lib/api"
import {
  retentionCutoffDay,
  todayUtcDay,
  utcDayLabel,
  type UtcDay,
} from "@/lib/diary"

/** PATCH fields are strings-or-null: trim strings, preserve null clears. */
const trimPatch = (patch: DiaryEntryPatch): DiaryEntryPatch =>
  Object.fromEntries(
    Object.entries(patch).map(([k, v]) => [
      k,
      typeof v === "string" ? v.trim() : v,
    ])
  ) as DiaryEntryPatch

export function DiaryPage() {
  const [day, setDay] = useState<UtcDay>(todayUtcDay)
  const isOnline = useIsOnline()

  const { data: profile } = useGameProfile()
  const retention = profile?.retention ?? "forever"
  const cutoff = retentionCutoffDay(profile?.retention, todayUtcDay())
  const beyondHorizon = cutoff !== null && day < cutoff
  // A stand-up for tomorrow is meaningless — the backend takes any
  // entry_date >= cutoff, so the client adds the forward bound.
  const futureDay = day > todayUtcDay()

  const entriesQuery = useDiaryEntries(day, beyondHorizon)
  const createEntry = useCreateDiaryEntry()
  const updateEntry = useUpdateDiaryEntry()
  const deleteEntry = useDeleteDiaryEntry()
  const updateRetention = useUpdateRetention()
  const busy =
    createEntry.isPending || updateEntry.isPending || deleteEntry.isPending

  // No offline write-queue for the diary domain — writes disable with an
  // honest reason; reads still render the persisted query cache.
  const writesDisabled = !isOnline || beyondHorizon || futureDay
  const disabledReason =
    beyondHorizon && cutoff !== null
      ? `Entries before ${utcDayLabel(cutoff)} are hidden by your ${
          retention === "90d" ? "90-day" : "1-year"
        } retention setting.`
      : futureDay
        ? "You can't write entries for a day that hasn't started yet (UTC)."
        : !isOnline
          ? "You're offline — entries can be read from cache but not changed."
          : null

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
        <DayNavigator day={day} onChange={setDay} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            Keep
          </span>
          <RetentionSelector
            value={retention}
            onChange={(v) => updateRetention.mutate(v)}
            disabled={updateRetention.isPending || profile === undefined}
          />
        </div>
      </div>

      {!beyondHorizon && entriesQuery.isPending ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        </div>
      ) : !beyondHorizon && entriesQuery.isError ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          {!isOnline && <WifiOff className="h-8 w-8 text-amber-400" />}
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? "Couldn't load this day's entries."
              : "You're offline and this day isn't in the local cache."}
          </p>
          <Button
            variant="outline"
            onClick={() => void entriesQuery.refetch()}
            className="h-10 gap-2 rounded-2xl border-white/15 px-5 font-bold"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : (
        // Keyed on the day: edit/delete-draft state belongs to the day it
        // was started on — a stale editingId can't soft-lock another day's
        // row actions.
        <DiaryDayPanel
          key={day}
          entries={beyondHorizon ? [] : (entriesQuery.data?.entries ?? [])}
          writesDisabled={writesDisabled}
          disabledReason={disabledReason}
          busy={busy}
          onCreateStandup={(fields) =>
            createEntry.mutate({
              kind: "standup",
              entry_date: day,
              good: fields.good.trim(),
              bad: fields.bad.trim(),
              next: fields.next.trim(),
            })
          }
          onCreateFreeform={(freeform) =>
            createEntry.mutate({
              kind: "freeform",
              entry_date: day,
              freeform: freeform.trim(),
            })
          }
          onUpdateEntry={(id, patch) =>
            updateEntry.mutateAsync({ id, patch: trimPatch(patch) })
          }
          onDeleteEntry={(id) => deleteEntry.mutate(id)}
        />
      )}
    </motion.div>
  )
}
