import { useState } from "react"
import { useGameProfile } from "@/hooks/useGameProfile"
import { useIsOnline } from "@/hooks/useIsOnline"
import {
  useCreateDiaryEntry,
  useDeleteDiaryEntry,
  useDiaryEntries,
  useUpdateDiaryEntry,
  useUpdateRetention,
} from "@/hooks/useDiary"
import {
  getDiaryDisabledReason,
  retentionCutoffDay,
  todayUtcDay,
  trimPatch,
  type DiaryEntry,
  type DiaryEntryPatch,
  type RetentionPreference,
  type UtcDay,
} from "@/models/diary.model"

export interface StandupFields {
  good: string
  bad: string
  next: string
}

export function useDiaryViewModel() {
  const [day, setDay] = useState<UtcDay>(todayUtcDay)
  const isOnline = useIsOnline()

  const { data: profile } = useGameProfile()
  const retention = profile?.retention ?? "forever"
  const cutoff = retentionCutoffDay(profile?.retention, todayUtcDay())
  const beyondHorizon = cutoff !== null && day < cutoff
  const futureDay = day > todayUtcDay()

  const entriesQuery = useDiaryEntries(day, beyondHorizon)
  const createEntry = useCreateDiaryEntry()
  const updateEntry = useUpdateDiaryEntry()
  const deleteEntry = useDeleteDiaryEntry()
  const updateRetention = useUpdateRetention()

  const busy =
    createEntry.isPending || updateEntry.isPending || deleteEntry.isPending

  const writesDisabled = !isOnline || beyondHorizon || futureDay
  const disabledReason = getDiaryDisabledReason({
    isOnline,
    beyondHorizon,
    cutoff,
    futureDay,
    retention,
  })

  const entries: DiaryEntry[] = beyondHorizon
    ? []
    : (entriesQuery.data?.entries ?? [])

  const handleCreateStandup = (fields: StandupFields) => {
    createEntry.mutate({
      kind: "standup",
      entry_date: day,
      good: fields.good.trim(),
      bad: fields.bad.trim(),
      next: fields.next.trim(),
    })
  }

  const handleCreateFreeform = (freeform: string) => {
    createEntry.mutate({
      kind: "freeform",
      entry_date: day,
      freeform: freeform.trim(),
    })
  }

  const handleUpdateEntry = (id: number, patch: DiaryEntryPatch) => {
    return updateEntry.mutateAsync({ id, patch: trimPatch(patch) })
  }

  const handleDeleteEntry = (id: number) => {
    deleteEntry.mutate(id)
  }

  const handleChangeRetention = (value: RetentionPreference) => {
    updateRetention.mutate(value)
  }

  return {
    day,
    setDay,
    isOnline,
    profile,
    retention,
    cutoff,
    beyondHorizon,
    futureDay,
    busy,
    writesDisabled,
    disabledReason,
    isPending: !beyondHorizon && entriesQuery.isPending,
    isError: !beyondHorizon && entriesQuery.isError,
    entries,
    retentionPending: updateRetention.isPending,
    createStandup: handleCreateStandup,
    createFreeform: handleCreateFreeform,
    updateEntry: handleUpdateEntry,
    deleteEntry: handleDeleteEntry,
    changeRetention: handleChangeRetention,
    refetch: () => entriesQuery.refetch(),
  }
}

export type DiaryViewModel = ReturnType<typeof useDiaryViewModel>
