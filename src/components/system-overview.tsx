import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { LayoutGrid, PieChart } from "lucide-react"
import type { StatsOverview } from "@/hooks/useApi"

export function SystemOverview({ stats, loading }: Readonly<{ stats: StatsOverview | null, loading: boolean }>) {
  if (loading || !stats) {
    return (
      <Card className="border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-6" />
        <div className="space-y-6">
          <div className="h-12 w-24 bg-muted rounded mx-auto" />
          <div className="h-3 w-full bg-muted rounded-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
          </div>
        </div>
      </Card>
    )
  }

  const { task_stats, tag_distribution } = stats

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-border bg-card p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-[0.22em] text-foreground uppercase">
            System Overview
          </h3>
          <LayoutGrid className="h-4 w-4 text-foreground/30" />
        </div>

        <div className="space-y-6">
          {/* Percentage Display */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-5xl font-bold text-foreground">
              {Math.round(task_stats.completion_percentage)}%
            </p>
            <p className="mt-2 text-xs text-muted-foreground font-medium">
              {task_stats.completed_tasks} of {task_stats.total_tasks} tasks completed
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
            >
              <motion.div
                className="h-full bg-accent"
                initial={{ width: 0 }}
                animate={{ width: `${task_stats.completion_percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </motion.div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {task_stats.pending_tasks} tasks remaining
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3 text-center border border-border">
              <p className="text-2xl font-bold text-foreground">
                {task_stats.total_tasks}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-3 text-center border border-green-500/20">
              <p className="text-2xl font-bold text-green-500">
                {task_stats.completed_tasks}
              </p>
              <p className="text-[10px] font-bold text-green-500 uppercase">Done</p>
            </div>
          </div>

          {/* Tag Distribution */}
          {tag_distribution.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <PieChart className="h-3 w-3" />
                <span>Categories</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {tag_distribution.slice(0, 4).map((tag) => (
                  <div key={tag.tag_name} className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-foreground/70">{tag.tag_name}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-accent/40" 
                          style={{ 
                            width: `${task_stats.total_tasks > 0 ? (tag.task_count / task_stats.total_tasks) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">{tag.task_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
