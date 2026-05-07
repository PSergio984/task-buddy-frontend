import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Task } from "@/hooks/useApi"
import { Trash2, Edit2, Calendar, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TaskCardProps {
  readonly task: Task
  readonly onToggleComplete: (id: number) => void
  readonly onDelete: (id: number) => void
  readonly onEdit: (task: Task) => void
  readonly onToggleSubtask?: (subtaskId: number, completed: boolean) => void
  readonly onDeleteSubtask?: (subtaskId: number) => void
  readonly onDetachTag?: (taskId: number, tagId: number) => void
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
  onToggleSubtask,
  onDeleteSubtask,
  onDetachTag,
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
          "border-border bg-card transition-all"
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
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="h-5 w-5 border-2 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </motion.div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-medium text-foreground",
                  task.completed && "text-muted-foreground line-through"
                )}
              >
                {task.title}
              </p>

              {task?.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
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

                {/* Dynamic Tags */}
                {task?.tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="group relative flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag.name}
                    <button
                      onClick={() => onDetachTag?.(task.id, tag.id)}
                      aria-label={`Remove tag ${tag.name}`}
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}

                {task?.due_date && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(task.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Subtasks */}
              {task?.subtasks?.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-border pt-3">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground/40 uppercase">Subtasks</p>
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="group flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={(checked) => onToggleSubtask?.(subtask.id, !!checked)}
                          className="h-3.5 w-3.5 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className={cn(
                          "text-xs text-muted-foreground",
                          subtask.completed && "text-muted-foreground/40 line-through"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteSubtask?.(subtask.id)}
                        aria-label={`Delete subtask ${subtask.title}`}
                        className="h-6 w-6 p-0 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus:opacity-100 focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                aria-label={`Edit task ${task.title}`}
                className="h-8 w-8 p-0 text-blue-500 hover:bg-blue-500/10 transition-colors focus-visible:ring-1 focus-visible:ring-ring"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete task ${task.title}`}
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-1 focus-visible:ring-ring"
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
