import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"

/**
 * Re-invalidates a day-windowed query at each UTC midnight and when a
 * suspended tab returns to visible. The app disables
 * refetchOnWindowFocus, so without these triggers an overnight tab keeps
 * rendering yesterday's window (dailies' completed_today, the activity
 * grid's trailing-day span).
 */
export function useUtcDayRollover(key: string) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (typeof window === "undefined") return
    const resync = () => void queryClient.invalidateQueries({ queryKey: [key] })
    let timer: ReturnType<typeof setTimeout>
    const armRollover = () => {
      const midnight = new Date()
      midnight.setUTCHours(24, 0, 0, 0)
      timer = setTimeout(() => {
        resync()
        armRollover()
      }, midnight.getTime() - Date.now())
    }
    armRollover()
    // A suspended tab wakes to visibilitychange, not a window-focus refetch
    // — same staleness hole after a sleep-overnight.
    const onVisible = () => {
      if (document.visibilityState === "visible") resync()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [queryClient, key])
}
