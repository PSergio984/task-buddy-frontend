import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Task } from "@/hooks/useApi"
import { Trash2, Edit2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskCardProps {
  task: Task
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
}

const priorityConfig = {
  low: { label: "Low", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  high: { label: "High", color: "bg-red-100 text-red-700" },
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  work: { label: "Work", color: "bg-blue-100 text-blue-700" },
  personal: { label: "Personal", color: "bg-purple-100 text-purple-700" },
  school: { label: "School", color: "bg-indigo-100 text-indigo-700" },
  health: { label: "Health", color: "bg-orange-100 text-orange-700" },
  other: { label: "Other", color: "bg-gray-100 text-gray-700" },
}

export function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onEdit,
}: TaskCardProps) {
  const priority =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.low
  const category =
    categoryConfig[task.category as keyof typeof categoryConfig] ||
    categoryConfig.other

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "border-[#EDE9E6] bg-[#FFFFFF] transition-all",
          task.status === "completed" && "opacity-60"
        )}
      >
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex flex-1 items-start gap-3">
            {/* Checkbox */}
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="mt-1"
            >
              <Checkbox
                checked={task.status === "completed"}
                onCheckedChange={() => onToggleComplete(task.id)}
              />
            </motion.div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-medium text-[#0F172A]",
                  task.status === "completed" && "text-[#0F172A]/50 line-through"
                )}
              >
                {task.title}
              </p>

              {task.description && (
                <p className="mt-1 line-clamp-2 text-sm text-[#0F172A]/65">
                  {task.description}
                </p>
              )}

              {/* Tags and Metadata */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium",
                    category.color
                  )}
                >
                  {category.label}
                </span>
                <span
                  className={cn(
                    "rounded px-2 py-1 text-xs font-medium",
                    priority.color
                  )}
                >
                  {priority.label}
                </span>

                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-[#0F172A]/50">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="h-8 w-8 p-0 text-[#0F172A]/35 hover:bg-[#F1F5F9] hover:text-[#0F172A]"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                className="h-8 w-8 p-0 text-[#0F172A]/35 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
