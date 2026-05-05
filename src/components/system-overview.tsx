import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import type { Task } from "@/hooks/useApi"

export interface SystemOverviewProps {
  tasks: Task[]
}

export function SystemOverview({ tasks }: SystemOverviewProps) {
  const completedCount = tasks.filter((t) => t.status === "completed").length
  const completionPercentage =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-slate-200 bg-white p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold tracking-widest text-slate-600 uppercase">
            System Overview
          </h3>
        </div>

        <div className="space-y-6">
          {/* Percentage Display */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-brand-sidebar text-5xl font-bold">
              {completionPercentage}%
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="bg-brand-muted h-3 w-full overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="bg-brand-accent h-full"
              />
            </div>
            <p className="text-xs text-slate-500">
              Progress: {completedCount} completed
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-brand-bg rounded-lg p-3 text-center"
            >
              <p className="text-brand-sidebar text-2xl font-bold">
                {tasks.length}
              </p>
              <p className="text-xs text-slate-500">Total Tasks</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-lg bg-green-50 p-3 text-center"
            >
              <p className="text-2xl font-bold text-green-600">
                {completedCount}
              </p>
              <p className="text-xs text-green-600">Completed</p>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
