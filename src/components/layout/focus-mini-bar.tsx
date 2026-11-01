import { Pause, Timer, WifiOff } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { useFocusSession } from "@/contexts/FocusSessionContext"
import { formatClock } from "@/lib/focus-session"
import { cn } from "@/lib/utils"

/**
 * App-wide session chip (spec: "a mini-timer bar persists app-wide while a
 * session runs"). Reads the shared runtime — no probe or ticker of its own —
 * and deep-links back to /focus. Hidden on /focus where the page already
 * shows the same readout, and once the session reaches a terminal state.
 */
export function FocusMiniBar() {
  const { session, view, isLocal, mirrored } = useFocusSession()
  const navigate = useNavigate()
  const location = useLocation()

  if (session === null || view === null) return null
  if (view.status === "ended" || view.status === "abandoned") return null
  if (location.pathname === "/focus") return null

  const offline = isLocal || mirrored
  const progressPct = Math.round(Math.min(1, Math.max(0, view.progress)) * 100)

  return (
    <button
      onClick={() => navigate("/focus")}
      aria-label={`Focus session: ${view.kindLabel}, ${formatClock(view.clockSeconds)} — open Focus page`}
      className={cn(
        "fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-40 -translate-x-1/2 md:bottom-6",
        "flex w-56 flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/90 shadow-xl backdrop-blur-xl",
        "transition-all hover:border-primary/40 hover:bg-background"
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5">
        {view.status === "paused" ? (
          <Pause className="h-4 w-4 shrink-0 text-amber-400" />
        ) : (
          <Timer className="h-4 w-4 shrink-0 text-primary" />
        )}
        <span className="min-w-0 flex-1 truncate text-left text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          {view.kindLabel}
        </span>
        <span className="font-mono text-sm font-black tabular-nums text-foreground">
          {formatClock(view.clockSeconds)}
        </span>
        {offline && <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
      </div>
      <div className="h-0.5 w-full bg-white/10">
        <div
          className={cn(
            "h-full transition-all duration-500",
            view.status === "paused" ? "bg-amber-400" : "bg-primary"
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </button>
  )
}
