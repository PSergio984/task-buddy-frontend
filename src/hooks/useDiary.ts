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

export function useDiaryEntries(day: UtcDay) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["diary", { userId: user?.id, date: day }],
    queryFn: () => diaryApi.list(day),
    enabled: !!user,
  })
}

export function useTimelineDay(day: UtcDay) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ["timeline", { userId: user?.id, date: day }],
    queryFn: () => timelineApi.day(day),
    enabled: !!user,
  })
}

export function useCreateDiaryEntry() {
  const { toast } = useToast()
  const invalidate = useDiaryInvalidate()
  return useMutation({
    mutationFn: (input: DiaryEntryInput) => diaryApi.create(input),
    onSuccess: invalidate,
    onError: (err) => {
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (retention: RetentionPreference) =>
      gameApi.updateRetention(retention),
    onSuccess: async (profile) => {
      // The PATCH returns the authoritative profile — write it into the HUD
      // cache, then re-read the day views under the new horizon.
      if (user?.id !== undefined) await setGameProfileCache(profile, user.id)
      void queryClient.invalidateQueries({ queryKey: ["diary"] })
      void queryClient.invalidateQueries({ queryKey: ["timeline"] })
    },
    onError: (err) => {
      toast({
        title: "Couldn't update retention",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
  })
}
