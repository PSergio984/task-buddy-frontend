import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  diaryApi,
  gameApi,
  timelineApi,
  type DiaryEntryInput,
  type DiaryEntryPatch,
  type RetentionPreference,
} from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { getErrorMessage } from "@/lib/errors"
import type { UtcDay } from "@/lib/diary"

/**
 * Diary + timeline queries/mutations. Unlike tasks these write straight to
 * the API — there is no offline write-queue for the diary domain, so a
 * failed mutation surfaces an error toast instead of a queued optimistic
 * row. Reads still benefit from the persisted query cache when offline.
 */

function useDiaryInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    // Diary rows render on both /diary and the /timeline merged day view.
    void queryClient.invalidateQueries({ queryKey: ["diary"] })
    void queryClient.invalidateQueries({ queryKey: ["timeline"] })
  }
}

/** A day past the retention horizon is filtered server-side — skip the fetch. */
export function useDiaryEntries(day: UtcDay, beyondHorizon = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["diary", { userId: user?.id, date: day }],
    queryFn: () => diaryApi.list(day),
    enabled: !!user && !beyondHorizon,
  })
}

export function useTimelineDay(day: UtcDay, beyondHorizon = false) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["timeline", { userId: user?.id, date: day }],
    queryFn: () => timelineApi.day(day),
    enabled: !!user && !beyondHorizon,
  })
}

export function useCreateDiaryEntry() {
  const { toast } = useToast()
  const invalidate = useDiaryInvalidate()
  return useMutation({
    mutationFn: (input: DiaryEntryInput) => diaryApi.create(input),
    onSuccess: invalidate,
    onError: (err) => {
      // Resync on failure too — a 409 means another writer already owns the
      // day's stand-up; the UI must load that row instead of 409-retrying
      // its own copy forever.
      invalidate()
      toast({
        title: "Couldn't save entry",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateDiaryEntry() {
  const { toast } = useToast()
  const invalidate = useDiaryInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: DiaryEntryPatch }) =>
      diaryApi.update(id, patch),
    onSuccess: invalidate,
    onError: (err) => {
      toast({
        title: "Couldn't update entry",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useDeleteDiaryEntry() {
  const { toast } = useToast()
  const invalidate = useDiaryInvalidate()
  return useMutation({
    mutationFn: (id: number) => diaryApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => {
      toast({
        title: "Couldn't delete entry",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}

export function useUpdateRetention() {
  const { user } = useAuth()
  const { toast } = useToast()
  const invalidate = useDiaryInvalidate()
  return useMutation({
    mutationFn: (retention: RetentionPreference) =>
      gameApi.updateRetention(retention),
    // Stamp the write's owner at mutate() time — a pending mutation's options
    // swap onto the latest render, so the onSuccess closure would read the NEW
    // user after a mid-flight auth swap (same guard as the gear fold).
    onMutate: () => user?.id,
    onSuccess: async (profile, _retention, userId) => {
      // The PATCH returns the authoritative profile — write it into the HUD
      // cache under its own stamp, then re-read the day views under the new
      // horizon. An absent server_time keeps the always-apply path; a present
      // one advances the high-water mark so a later stale-stamped write is
      // dropped instead of regressing this snapshot.
      if (userId !== undefined)
        await setGameProfileCache(profile, userId, profile.server_time)
      invalidate()
    },
    onError: (err) => {
      // Resync on failure too — a timeout after commit leaves the horizon
      // changed server-side while the day views render the old cutoff.
      invalidate()
      toast({
        title: "Couldn't update retention",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
