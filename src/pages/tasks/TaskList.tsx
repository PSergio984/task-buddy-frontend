import { motion, AnimatePresence } from "framer-motion"
import { ListChecks } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { TaskCard } from "@/components/task-card"
import { animations } from "@/lib/animations"
import type { Task } from "@/lib/api"

interface TaskListProps {
  readonly tasks: Task[]
  readonly loading: boolean
  readonly viewMode: "grid" | "list"
  readonly onToggleComplete: (id: number) => void
  readonly onEdit: (task: Task) => void
  readonly onToggleSubtask: (subtaskId: number, completed: boolean) => void
  readonly onDeleteSubtask: (subtaskId: number) => void
  readonly onDetachTag: (taskId: number, tagId: number) => void
}

export function TaskList({
  tasks,
  loading,
  viewMode,
  onToggleComplete,
  onEdit,
  onToggleSubtask,
  onDeleteSubtask,
  onDetachTag,
}: TaskListProps) {
  if (loading) {
    return (
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
        {["t1", "t2", "t3", "t4"].map((id) => (
          <Skeleton key={id} className="h-[200px] rounded-[2.5rem]" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-96 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border bg-background/20 text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted/50">
          <ListChecks className="h-10 w-10 text-muted-foreground/20" />
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">No tasks found</h3>
        <p className="text-muted-foreground font-medium">Clear as a summer sky. Ready for new ideas?</p>
      </motion.div>
    )
  }

  return (
    <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            layout
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ ...animations.spring.snappy, delay: index * 0.02 }}
          >
            <TaskCard
              task={task}
              onToggleComplete={onToggleComplete}
              onEdit={onEdit}
              onToggleSubtask={onToggleSubtask}
              onDeleteSubtask={onDeleteSubtask}
              onDetachTag={onDetachTag}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
