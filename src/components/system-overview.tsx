import { motion } from "framer-motion"
import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PieChart, Target, Zap, TrendingUp, CheckCircle2 } from "lucide-react"
import type { StatsOverview, Task } from "@/lib/api"

export function SystemOverview({
  stats,
  loading,
  timeframeTasks,
  timeframeLabel,
}: Readonly<{
  stats: StatsOverview | null | undefined
  loading: boolean
  timeframeTasks?: readonly Task[]
  timeframeLabel?: string
}>) {
  const timeframeStats = useMemo(() => {
    if (!timeframeTasks) return null
    
    const total = timeframeTasks.length
    const completed = timeframeTasks.filter(t => t.completed).length
    const pending = total - completed
    const percentage = total > 0 ? (completed / total) * 100 : 0

    // Calculate tag distribution from timeframeTasks
    const tagMap: Record<string, number> = {}
    timeframeTasks.forEach(task => {
      task.tags?.forEach(tag => {
        tagMap[tag.name] = (tagMap[tag.name] || 0) + 1
      })
    })
    
    const distribution = Object.entries(tagMap)
      .map(([name, count]) => ({ tag_name: name, task_count: count }))
      .sort((a, b) => b.task_count - a.task_count)

    return { total, completed, pending, percentage, distribution }
  }, [timeframeTasks])

  if (loading || !stats) {
    return (
      <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem]">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-5" />
        </div>
        <div className="space-y-8">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-16 w-32 rounded-2xl" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-2 w-16" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      </Card>
    )
  }

  const { task_stats, tag_distribution } = stats

  // Local calculation for timeframe-specific stats

  const displayPercentage = timeframeStats ? timeframeStats.percentage : task_stats.completion_percentage
  const displayCompleted = timeframeStats ? timeframeStats.completed : task_stats.completed_tasks
  const displayTotal = timeframeStats ? timeframeStats.total : task_stats.total_tasks
  const displayPending = timeframeStats ? timeframeStats.pending : task_stats.pending_tasks
  const displayDistribution = timeframeStats ? timeframeStats.distribution : tag_distribution

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem]">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Target className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold tracking-[0.2em] text-foreground uppercase">
              Status
            </h3>
          </div>
          <TrendingUp className="h-5 w-5 text-accent/50" />
        </div>

        <div className="space-y-8">
          {/* Percentage Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center relative"
          >
             <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
             <div className="relative">
              <p className="font-heading text-6xl font-bold tracking-tighter text-foreground">
                {Math.round(displayPercentage)}%
              </p>
              <p className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                Completion Rate
              </p>
             </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</span>
               <span className="text-[10px] font-bold text-primary">{displayCompleted} / {displayTotal}</span>
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-3 w-full overflow-hidden rounded-full bg-muted/30 p-0.5 border border-border/50"
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-shimmer"
                initial={{ width: 0 }}
                animate={{ width: `${displayPercentage}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] as const }}
              />
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-4 transition-all hover:bg-card">
              <p className="text-2xl font-bold text-foreground">
                {displayPending}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Remaining{timeframeLabel && timeframeLabel !== "All Time" ? ` · ${timeframeLabel}` : ""}
              </p>
              <Zap className="absolute -right-2 -bottom-2 h-12 w-12 text-primary/5 transition-transform group-hover:scale-110" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/5 p-4 transition-all hover:bg-accent/10">
              <p className="text-2xl font-bold text-accent">
                {displayCompleted}
              </p>
              <p className="text-[10px] font-bold text-accent/60 uppercase tracking-wider">
                Achieved{timeframeLabel && timeframeLabel !== "All Time" ? ` · ${timeframeLabel}` : ""}
              </p>
               <CheckCircle2 className="absolute -right-2 -bottom-2 h-12 w-12 text-accent/10 transition-transform group-hover:scale-110" />
            </div>
          </div>

          {/* Tag Distribution */}
          {displayDistribution.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Tag Usage</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {displayDistribution.slice(0, 3).map((tag: { tag_name: string; task_count: number }, idx: number) => (
                  <motion.div 
                    key={tag.tag_name} 
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/80">{tag.tag_name}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">{tag.task_count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${displayTotal > 0 ? (tag.task_count / displayTotal) * 100 : 0}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + idx * 0.1 }}
                        className="h-full bg-primary/40 rounded-full" 
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
