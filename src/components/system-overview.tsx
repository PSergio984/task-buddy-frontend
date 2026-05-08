import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { PieChart, Target, Zap, TrendingUp } from "lucide-react"
import type { StatsOverview } from "@/hooks/useApi"

export function SystemOverview({ stats, loading }: Readonly<{ stats: StatsOverview | null, loading: boolean }>) {
  if (loading || !stats) {
    return (
      <Card className="overflow-hidden border bg-background/50 p-8 shadow-2xl shadow-primary/5 backdrop-blur-xl rounded-[2.5rem] animate-pulse">
        <div className="h-5 w-32 bg-muted rounded-full mb-8" />
        <div className="space-y-8">
          <div className="h-16 w-32 bg-muted rounded-2xl mx-auto" />
          <div className="h-3 w-full bg-muted rounded-full" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-muted rounded-2xl" />
            <div className="h-20 bg-muted rounded-2xl" />
          </div>
        </div>
      </Card>
    )
  }

  const { task_stats, tag_distribution } = stats

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
              Efficiency
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
                {Math.round(task_stats.completion_percentage)}%
              </p>
              <p className="mt-2 text-xs text-muted-foreground font-semibold uppercase tracking-widest">
                Optimization Level
              </p>
             </div>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Momentum</span>
               <span className="text-[10px] font-bold text-primary">{task_stats.completed_tasks} / {task_stats.total_tasks}</span>
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
                animate={{ width: `${task_stats.completion_percentage}%` }}
                transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] as const }}
              />
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="group relative overflow-hidden rounded-2xl border bg-card/50 p-4 transition-all hover:bg-card">
              <p className="text-2xl font-bold text-foreground">
                {task_stats.pending_tasks}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Remaining</p>
              <Zap className="absolute -right-2 -bottom-2 h-12 w-12 text-primary/5 transition-transform group-hover:scale-110" />
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-accent/20 bg-accent/5 p-4 transition-all hover:bg-accent/10">
              <p className="text-2xl font-bold text-accent">
                {task_stats.completed_tasks}
              </p>
              <p className="text-[10px] font-bold text-accent/60 uppercase tracking-wider">Achieved</p>
               <CheckCircle2 className="absolute -right-2 -bottom-2 h-12 w-12 text-accent/10 transition-transform group-hover:scale-110" />
            </div>
          </div>

          {/* Tag Distribution */}
          {tag_distribution.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-border/50">
              <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <PieChart className="h-3.5 w-3.5" />
                  <span>Category Flow</span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {tag_distribution.slice(0, 3).map((tag, idx) => (
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
                        animate={{ width: `${task_stats.total_tasks > 0 ? (tag.task_count / task_stats.total_tasks) * 100 : 0}%` }}
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

import { CheckCircle2 } from "lucide-react"
