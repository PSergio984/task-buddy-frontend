import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { 
  Search, AlertCircle, ChevronDown, Activity, Sparkles, Shield, Clock, ExternalLink
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  type AuditEntry, describeAction, getAuditIcon 
} from "@/lib/audit-trail-helpers"
import { useAuditTrail } from "@/hooks/useAuditTrail"
import { useSettings } from "@/contexts/SettingsContext"

interface AuditTrailProps {
  readonly limit?: number
  readonly hideCard?: boolean
  readonly className?: string
}

export function AuditTrail({ 
  limit = 5, 
  hideCard = false, 
  className 
}: AuditTrailProps) {
  const {
    loading, error, search, setSearch,
    currentLimit, setCurrentLimit,
    filteredLogs, groupedLogs, fetchAuditLog
  } = useAuditTrail({ limit })

  if (loading && groupedLogs.length === 0) {
    return <AuditSkeleton limit={limit} className={className} />
  }

  const content = (
    <div className={cn("flex flex-col h-full", !hideCard && "p-8")}>
      <AuditHeader search={search} onSearchChange={setSearch} />

      {error ? (
        <AuditError error={error} onRetry={() => fetchAuditLog()} />
      ) : (
        <AuditContent 
          groupedLogs={groupedLogs} 
          filteredLogs={filteredLogs}
          currentLimit={currentLimit}
          setCurrentLimit={setCurrentLimit}
          search={search}
          loading={loading}
        />
      )}
    </div>
  )

  if (hideCard) return <div className={cn("h-full", className)}>{content}</div>

  return (
    <Card className={cn("overflow-hidden border bg-background/50 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem] h-full flex flex-col", className)}>
      {content}
    </Card>
  )
}

function AuditContent({ 
  groupedLogs, filteredLogs, currentLimit, setCurrentLimit, search, loading 
}: { 
  readonly groupedLogs: readonly { readonly label: string; readonly entries: readonly AuditEntry[] }[]; 
  readonly filteredLogs: readonly AuditEntry[];
  readonly currentLimit: number;
  readonly setCurrentLimit: (v: number | ((p: number) => number)) => void;
  readonly search: string;
  readonly loading: boolean;
}) {
  return (
    <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
          {groupedLogs.length > 0 ? (
            <>
              {groupedLogs.map(({ label, entries }, groupIdx) => (
                <AuditGroup key={label} label={label} entries={entries} groupIdx={groupIdx} />
              ))}
              
              {filteredLogs.length >= currentLimit && !search && (
                <LoadMoreButton onClick={() => setCurrentLimit(prev => prev + 10)} />
              )}
            </>
          ) : (
            <AuditEmpty loading={loading} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}


function AuditHeader({ search, onSearchChange }: Readonly<{ search: string; onSearchChange: (v: string) => void }>) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
          <Activity className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-foreground">Timeline</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            Activity History
          </p>
        </div>
      </div>
      
      <div className="relative w-full sm:max-w-[240px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
        <Input 
          placeholder="Filter history..." 
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-11 pl-11 rounded-xl bg-background/50 border-border focus-visible:ring-accent/30 placeholder:text-muted-foreground/50 transition-all hover:bg-background/80"
        />
      </div>
    </div>
  )
}

function AuditError({ error, onRetry }: Readonly<{ error: string; onRetry: () => void }>) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-destructive/20 bg-destructive/5 p-12 text-center backdrop-blur-sm">
      <div className="space-y-4 max-w-xs mx-auto">
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <Button 
          variant="outline" 
          onClick={onRetry}
          className="w-full rounded-xl border-destructive/20 text-destructive hover:bg-destructive/10"
        >
          Try Again
        </Button>
      </div>
    </div>
  )
}

function AuditEmpty({ loading }: Readonly<{ loading: boolean }>) {
  return (
    <div className="flex flex-col h-48 items-center justify-center text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30">
        <Sparkles className="h-8 w-8 text-muted-foreground/30" />
      </div>
      <p className="text-sm text-muted-foreground font-medium italic">
        {loading ? "Discovering history..." : "Silence. No activity logged yet."}
      </p>
    </div>
  )
}

function LoadMoreButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 flex justify-center">
      <Button 
        variant="ghost" 
        onClick={onClick}
        className="h-10 px-6 rounded-full font-bold uppercase tracking-[0.2em] text-xs text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
      >
        <ChevronDown className="mr-2 h-4 w-4 animate-bounce" />
        Load More
      </Button>
    </motion.div>
  )
}

function AuditSkeleton({ limit, className }: Readonly<{ limit: number; className?: string }>) {
  const skeletonIds = Array.from({ length: limit }, (_, i) => `audit-skeleton-${i}`)
  return (
    <Card className={cn("overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem] h-full flex flex-col", className)}>
      <div className="flex items-center gap-4 mb-8">
         <div className="h-12 w-12 bg-muted rounded-2xl animate-pulse" />
         <div className="space-y-2">
           <div className="h-5 w-32 bg-muted rounded animate-pulse" />
           <div className="h-3 w-24 bg-muted rounded animate-pulse" />
         </div>
      </div>
      <div className="space-y-8 flex-1">
        {skeletonIds.map((id) => (
          <div key={id} className="flex gap-6">
            <div className="h-12 w-12 bg-muted rounded-2xl animate-pulse" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 w-1/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AuditGroup({ label, entries, groupIdx }: Readonly<{ label: string; entries: readonly AuditEntry[]; groupIdx: number }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: groupIdx * 0.04 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/60">{label}</span>
        <div className="flex-1 h-px bg-border/50" />
      </div>

      {entries.map((log, index) => (
        <AuditItem 
          key={log.id} 
          log={log} 
          index={index} 
          isLast={index === entries.length - 1} 
        />
      ))}
    </motion.div>
  )
}

function AuditItem({ log, index, isLast }: Readonly<{ log: AuditEntry; index: number; isLast: boolean }>) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === '12h'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className="group relative flex gap-6"
    >
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-[-20px] w-[2px] bg-gradient-to-b from-border/80 via-border/30 to-transparent" />
      )}
      
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm transition-all group-hover:scale-110 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/5">
        {getAuditIcon(log.action, log.target_type)}
      </div>
      
      <div className="flex flex-col gap-1.5 py-1 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <Clock className="h-3 w-3" />
              {new Date(log.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: is12h
              })}
            </span>
          </div>
          {log.target_id && log.target_type === 'TASK' && (
            <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-sm leading-relaxed text-foreground font-semibold group-hover:text-primary transition-colors">
          {describeAction(log.action, log.details, log.target_type, log.target_id)}
        </p>
      </div>
    </motion.div>
  )
}

