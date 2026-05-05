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
      <Card className="border-base-300 bg-base-100 p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold tracking-widest text-base-content/60 uppercase">
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
            <p className="text-5xl font-bold text-base-content">
              {completionPercentage}%
            </p>
            <p className="mt-2 text-sm text-base-content/50">
              {completedCount} of {tasks.length} tasks completed
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <progress 
                className="progress progress-primary h-3 w-full" 
                value={completionPercentage} 
                max={100} 
              />
            </motion.div>
            <p className="text-xs text-base-content/50">
              Progress: {completedCount} completed
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-lg bg-base-200 p-3 text-center"
            >
              <p className="text-2xl font-bold text-base-content">
                {tasks.length}
              </p>
              <p className="text-xs text-base-content/50">Total Tasks</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="rounded-lg bg-success/10 p-3 text-center"
            >
              <p className="text-2xl font-bold text-success">
                {completedCount}
              </p>
              <p className="text-xs text-success">Completed</p>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
