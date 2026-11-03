import {
  useMutation,
  useQueryClient,
  type MutationKey,
} from "@tanstack/react-query"
import type { GameProfile } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { setGameProfileCache } from "@/hooks/useGameProfile"
import { getErrorMessage } from "@/lib/errors"

/**
 * Shared write-path for the scored list writes (habit click, daily
 * check). The response carries the scored row plus authoritative profile
 * totals — fold both into their caches instead of a refetch — and the
 * write lands a ledger row the timeline renders, so the timeline and
 * achievement list resync beside it (every scored write runs the
 * server's achievement evaluation). `pickRow` lifts the domain row out
 * of the response (res.habit / res.daily).
 */
export function useScoredListWrite<
  Res extends { profile: GameProfile; server_time: string },
  Row extends { id: number },
  Vars,
>(opts: {
  mutationKey: MutationKey
  mutationFn: (vars: Vars) => Promise<Res>
  /** First segment of the user-scoped list query key. */
  listKey: string
  errorTitle: string
  pickRow: (res: Res) => Row
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { mutationKey, mutationFn, listKey, errorTitle, pickRow } = opts

  return useMutation({
    mutationKey,
    mutationFn,
    // Stamp the write's owner at mutate() time — a pending mutation's
    // options swap onto the latest render, so the onSuccess closure would
    // read the NEW user after a mid-flight auth swap (same guard as the
    // gear fold).
    onMutate: () => user?.id,
    onSuccess: async (res, _vars, userId) => {
      try {
        // Cancel a racing list refetch so it can't fold a stale GET over
        // the newer row — same ordering guard as the game-profile write.
        await queryClient.cancelQueries({ queryKey: [listKey, { userId }] })
      } catch {
        // Cancellation is best-effort — the write below still lands.
      }
      const row = pickRow(res)
      queryClient.setQueryData<Row[]>([listKey, { userId }], (old) =>
        old?.map((r) => (r.id === row.id ? row : r))
      )
      if (userId !== undefined)
        await setGameProfileCache(res.profile, userId, res.server_time)
      void queryClient.invalidateQueries({ queryKey: ["timeline"] })
      // Every scored write runs the server's achievement evaluation —
      // resync the badge list beside the totals.
      void queryClient.invalidateQueries({ queryKey: ["game-achievements"] })
    },
    onError: (err) => {
      // Resync on failure — a rejected write must reload the stored list,
      // not keep a stale row (same contract as the other list writes).
      void queryClient.invalidateQueries({ queryKey: [listKey] })
      toast({
        title: errorTitle,
        description: getErrorMessage(err),
        variant: "destructive",
      })
    },
    onSettled: () => {
      // Unconditional, same as the gear resync — a stale fold can cancel a
      // fresher write's spawned refetch even when that write already
      // settled, and the isMutating()>1 guard missed that interleave.
      void queryClient.invalidateQueries({ queryKey: [listKey] })
    },
  })
}
