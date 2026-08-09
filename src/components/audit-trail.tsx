import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import {
  Search,
  AlertCircle,
  ChevronDown,
  Activity,
  Sparkles,
  Shield,
  Clock,
  ExternalLink,
  Plus,
  Edit3,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  type AuditEntry,
  describeAction,
  getAuditIcon,
} from "@/lib/audit-trail-helpers"
import {
  useAuditTrail,
  type ActionFilter,
  type DateFilter,
} from "@/hooks/useAuditTrail"
import { useSettings } from "@/contexts/SettingsContext"

interface AuditTrailProps {
  readonly limit?: number
  readonly hideCard?: boolean
  readonly className?: string
  readonly showFilters?: boolean
}

export function AuditTrail({
  limit = 5,
  hideCard = false,
  className,
  showFilters = false,
}: AuditTrailProps) {
  const {
    loading,
    error,
    search,
    setSearch,
    actionFilter,
    setActionFilter,
    dateFilter,
    setDateFilter,
    currentLimit,
    setCurrentLimit,
    filteredLogs,
    groupedLogs,
    fetchAuditLog,
  } = useAuditTrail({ limit })

  const isInitialLoading = loading && groupedLogs.length === 0

  const content = (
    <div className={cn("flex h-full flex-col", !hideCard && "p-8")}>
      {(!isInitialLoading || showFilters) && (
        <AuditHeader
          search={search}
          onSearchChange={setSearch}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          showFilters={showFilters}
          onRefresh={() => fetchAuditLog()}
        />
      )}

      {isInitialLoading ? (
        <div className="mt-6 flex-1 space-y-8">
          {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <div key={`audit-skeleton-${i}`} className="flex gap-5">
              <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
              <div className="flex-1 space-y-2.5 pt-1">
                <Skeleton className="h-3 w-1/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
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

  if (hideCard)
    return (
      <div className={cn("flex h-full flex-col", className)}>{content}</div>
    )

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-[2.5rem] border bg-background/50 shadow-2xl shadow-primary/5 backdrop-blur-xl",
        className
      )}
    >
      {content}
    </Card>
  )
}

// ─── Filter configs ────────────────────────────────────────────────────────
const ACTION_FILTERS: {
  value: ActionFilter
  label: string
  icon: React.ReactNode
  activeClass: string
  dotClass: string
}[] = [
  {
    value: "all",
    label: "All",
    icon: <Activity className="h-3.5 w-3.5" />,
    activeClass: "bg-primary text-primary-foreground shadow-primary/30",
    dotClass: "bg-primary",
  },
  {
    value: "create",
    label: "Create",
    icon: <Plus className="h-3.5 w-3.5" />,
    activeClass: "bg-emerald-500 text-white shadow-emerald-500/30",
    dotClass: "bg-emerald-500",
  },
  {
    value: "update",
    label: "Update",
    icon: <Edit3 className="h-3.5 w-3.5" />,
    activeClass: "bg-sky-500 text-white shadow-sky-500/30",
    dotClass: "bg-sky-500",
  },
  {
    value: "delete",
    label: "Delete",
    icon: <Trash2 className="h-3.5 w-3.5" />,
    activeClass: "bg-rose-500 text-white shadow-rose-500/30",
    dotClass: "bg-rose-500",
  },
]

const DATE_FILTERS: { value: DateFilter; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 d" },
  { value: "30d", label: "Last 30 d" },
]

// ─── Header ───────────────────────────────────────────────────────────────
function AuditHeader({
  search,
  onSearchChange,
  actionFilter,
  onActionFilterChange,
  dateFilter,
  onDateFilterChange,
  showFilters,
  onRefresh,
}: Readonly<{
  search: string
  onSearchChange: (v: string) => void
  actionFilter: ActionFilter
  onActionFilterChange: (v: ActionFilter) => void
  dateFilter: DateFilter
  onDateFilterChange: (v: DateFilter) => void
  showFilters: boolean
  onRefresh: () => void
}>) {
  const hasActiveFilter =
    actionFilter !== "all" || dateFilter !== "all" || !!search
  const clearAll = () => {
    onSearchChange("")
    onActionFilterChange("all")
    onDateFilterChange("all")
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Row 1: title + search + refresh */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-heading text-lg leading-none font-bold tracking-tight text-foreground">
              Timeline
            </h3>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
              <Shield className="h-3 w-3" />
              Activity Log
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Search history…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-xl border-border/50 bg-muted/40 pr-4 pl-10 text-sm transition-all placeholder:text-muted-foreground/40 focus-visible:ring-primary/30"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            title="Refresh"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2: unified filter bar */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex flex-wrap items-center gap-2"
        >
          {/* Action type pills */}
          <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-muted/40 p-1">
            {ACTION_FILTERS.map(({ value, label, icon, activeClass }) => (
              <motion.button
                key={value}
                onClick={() => onActionFilterChange(value)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-200 select-none",
                  actionFilter === value
                    ? cn("shadow-md", activeClass)
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden h-6 w-px bg-border/50 sm:block" />

          {/* Date range pills */}
          <div className="flex items-center gap-1 rounded-xl border border-border/40 bg-muted/40 p-1">
            {DATE_FILTERS.map(({ value, label }) => (
              <motion.button
                key={value}
                onClick={() => onDateFilterChange(value)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-all duration-200 select-none",
                  dateFilter === value
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                )}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Clear all */}
          <AnimatePresence>
            {hasActiveFilter && (
              <motion.button
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                onClick={clearAll}
                className="flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-500"
              >
                <X className="h-3 w-3" />
                Clear
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────
function AuditContent({
  groupedLogs,
  filteredLogs,
  currentLimit,
  setCurrentLimit,
  search,
  loading,
}: {
  readonly groupedLogs: readonly {
    readonly label: string
    readonly entries: readonly AuditEntry[]
  }[]
  readonly filteredLogs: readonly AuditEntry[]
  readonly currentLimit: number
  readonly setCurrentLimit: (v: number | ((p: number) => number)) => void
  readonly search: string
  readonly loading: boolean
}) {
  return (
    <div className="custom-scrollbar flex-1 overflow-auto pr-1">
      <div className="space-y-8">
        <AnimatePresence mode="sync">
          {groupedLogs.length > 0 ? (
            <div key="has-logs" className="space-y-8">
              {groupedLogs.map(({ label, entries }, groupIdx) => (
                <AuditGroup
                  key={label}
                  label={label}
                  entries={entries}
                  groupIdx={groupIdx}
                />
              ))}

              {filteredLogs.length >= currentLimit && !search && (
                <LoadMoreButton
                  onClick={() => setCurrentLimit((prev) => prev + 15)}
                />
              )}
            </div>
          ) : (
            <AuditEmpty key="empty" loading={loading} />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────
function AuditError({
  error,
  onRetry,
}: Readonly<{ error: string; onRetry: () => void }>) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-[2rem] border border-destructive/20 bg-destructive/5 p-12 text-center backdrop-blur-sm">
      <div className="mx-auto max-w-xs space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
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
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex h-64 flex-col items-center justify-center space-y-4 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30 ring-1 ring-border/30">
        <Sparkles className="h-7 w-7 text-muted-foreground/30" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-muted-foreground">
          {loading ? "Loading activity…" : "No matching events"}
        </p>
        {!loading && (
          <p className="text-xs text-muted-foreground/50">
            Try adjusting your filters or search query
          </p>
        )}
      </div>
    </motion.div>
  )
}

function LoadMoreButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center pt-2"
    >
      <Button
        variant="ghost"
        onClick={onClick}
        className="h-9 rounded-full px-6 text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all hover:bg-primary/5 hover:text-primary"
      >
        <ChevronDown className="mr-2 h-3.5 w-3.5" />
        Load more
      </Button>
    </motion.div>
  )
}

function AuditGroup({
  label,
  entries,
  groupIdx,
}: Readonly<{
  label: string
  entries: readonly AuditEntry[]
  groupIdx: number
}>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, delay: groupIdx * 0.04 }}
      className="space-y-4"
    >
      {/* Date group label */}
      <div className="sticky top-0 z-10 flex items-center gap-3 py-1">
        <span className="bg-background/80 pr-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground/50 uppercase backdrop-blur-sm">
          {label}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-border/60 to-transparent" />
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

function AuditItem({
  log,
  index,
  isLast,
}: Readonly<{ log: AuditEntry; index: number; isLast: boolean }>) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === "12h"

  // Pick accent colour based on action type
  const act = log.action?.toLowerCase() ?? ""
  const accentClass = act.includes("delete")
    ? "group-hover:border-rose-400/50 group-hover:shadow-rose-500/10"
    : act.includes("create")
      ? "group-hover:border-emerald-400/50 group-hover:shadow-emerald-500/10"
      : "group-hover:border-sky-400/50 group-hover:shadow-sky-500/10"

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2, delay: index * 0.025 }}
      className="group relative flex gap-5"
    >
      {/* Connector line */}
      {!isLast && (
        <div className="absolute top-11 bottom-[-16px] left-[22px] w-[2px] bg-gradient-to-b from-border/60 via-border/20 to-transparent" />
      )}

      {/* Icon bubble */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-card shadow-sm",
          "transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg",
          accentClass
        )}
      >
        {getAuditIcon(log.action, log.target_type)}
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-muted-foreground/60 uppercase">
          <Clock className="h-2.5 w-2.5" />
          {new Date(log.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: is12h,
          })}
          {log.target_type && (
            <>
              <span className="opacity-30">·</span>
              <span className="opacity-60">{log.target_type}</span>
            </>
          )}
        </span>

        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm leading-relaxed font-medium text-foreground transition-colors duration-150 group-hover:text-primary">
            {describeAction(
              log.action,
              log.details,
              log.target_type,
              log.target_id
            )}
          </p>
          {log.target_id && log.target_type === "TASK" && (
            <button className="mt-0.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
