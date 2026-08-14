import { CloudOff, Loader2, AlertTriangle, Cloud } from "lucide-react"

interface SyncStatusPillProps {
  readonly isOnline: boolean
  readonly isSyncing: boolean
  readonly pendingCount: number
  readonly conflictCount: number
}

export function SyncStatusPill({
  isOnline,
  isSyncing,
  pendingCount,
  conflictCount,
}: Readonly<SyncStatusPillProps>) {
  if (!isOnline) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-3 text-xs font-bold text-destructive">
        <CloudOff className="h-3.5 w-3.5" />
        Offline
      </span>
    )
  }

  if (isSyncing) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Syncing…
      </span>
    )
  }

  if (pendingCount > 0) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary">
        <Cloud className="h-3.5 w-3.5" />
        {pendingCount} pending
      </span>
    )
  }

  if (conflictCount > 0) {
    return (
      <span className="flex h-8 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-bold text-amber-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        {conflictCount} {conflictCount === 1 ? "conflict" : "conflicts"}
      </span>
    )
  }

  return null
}
