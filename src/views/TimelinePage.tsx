import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, WifiOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DayNavigator } from "@/components/day-navigator"
import { DayTimeline } from "@/components/activity/day-timeline"
import { DiaryDayPanel } from "@/components/diary/diary-day-panel"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useTimelineDay } from "@/hooks/useDiary"
import {
  retentionCutoffDay,
  todayUtcDay,
  utcDayLabel,
  type UtcDay,
} from "@/lib/diary"
import { buildDayTimeline } from "@/lib/timeline"

export function TimelinePage() {
  const [day, setDay] = useState<UtcDay>(todayUtcDay)
  const isOnline = useIsOnline()

  const { data: profile } = useGameProfile()
  const cutoff = retentionCutoffDay(profile?.retention, todayUtcDay())
  const beyondHorizon = cutoff !== null && day < cutoff

  const timelineQuery = useTimelineDay(day)
  const timeline = useMemo(
    () =>
      timelineQuery.data !== undefined
        ? buildDayTimeline(timelineQuery.data)
        : null,
    [timelineQuery.data]
  )

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
          Merged day view
        </Badge>
        <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
          Timeline
        </h1>
      </header>

      <DayNavigator day={day} onChange={setDay} />

      {beyondHorizon && cutoff !== null && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          Days before {utcDayLabel(cutoff)} are hidden by your retention
          setting.
        </p>
      )}

      {timelineQuery.isPending ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-56 animate-pulse rounded-3xl bg-white/5" />
        </div>
      ) : timelineQuery.isError ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          {!isOnline && <WifiOff className="h-8 w-8 text-amber-400" />}
          <p className="text-sm text-muted-foreground">
            {isOnline
              ? "Couldn't load this day's timeline."
              : "You're offline and this day isn't in the local cache."}
          </p>
          <Button
            variant="outline"
            onClick={() => void timelineQuery.refetch()}
            className="h-10 gap-2 rounded-2xl border-white/15 px-5 font-bold"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      ) : timeline !== null ? (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <section
            aria-labelledby="timeline-axis-heading"
            className="rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2
                id="timeline-axis-heading"
                className="text-[10px] font-black tracking-[0.3em] text-primary uppercase"
              >
                Scored activity
              </h2>
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                UTC axis
              </span>
            </div>
            <DayTimeline timeline={timeline} />
          </section>

          <section aria-label="Diary for this day" className="min-w-0">
            <DiaryDayPanel entries={timelineQuery.data?.diary ?? []} readOnly />
          </section>
        </div>
      ) : null}
    </motion.div>
  )
}
