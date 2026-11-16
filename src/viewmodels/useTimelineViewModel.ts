import { useMemo, useState } from "react"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useTimelineDay } from "@/hooks/useDiary"
import {
  buildDayTimeline,
  retentionCutoffDay,
  todayUtcDay,
  type UtcDay,
} from "@/models/diary.model"

export function useTimelineViewModel() {
  const [day, setDay] = useState<UtcDay>(todayUtcDay)
  const isOnline = useIsOnline()

  const { data: profile } = useGameProfile()
  const cutoff = retentionCutoffDay(profile?.retention, todayUtcDay())
  const beyondHorizon = cutoff !== null && day < cutoff

  const timelineQuery = useTimelineDay(day, beyondHorizon)
  const timeline = useMemo(
    () =>
      !beyondHorizon && timelineQuery.data !== undefined
        ? buildDayTimeline(timelineQuery.data)
        : null,
    [beyondHorizon, timelineQuery.data]
  )

  return {
    day,
    setDay,
    isOnline,
    cutoff,
    beyondHorizon,
    timeline,
    isPending: !beyondHorizon && timelineQuery.isPending,
    isError: !beyondHorizon && timelineQuery.isError,
    diaryEntries: timelineQuery.data?.diary ?? [],
    refetch: () => timelineQuery.refetch(),
  }
}

export type TimelineViewModel = ReturnType<typeof useTimelineViewModel>
