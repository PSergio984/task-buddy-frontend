import { useCallback } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCard } from "@/components/task-card"
import { AuditTrail } from "@/components/audit-trail"
import { SystemOverview } from "@/components/system-overview"
import {
  useUpdateTask,
  useDeleteTask,
  useUpdateSubtask,
  useDeleteSubtask,
  useDetachTag,
} from "@/hooks/useApi"
import type { Task } from "@/hooks/useApi"
import { useToast } from "@/hooks/use-toast"

export interface DashboardProps {
  tasks: Task[]
  activeFilter: string
  onFilterChange: (filter: string) => void
  onRefresh: () => void
  onEdit: (task: Task) => void
  stats: any
  loadingStats: boolean
}

export function Dashboard({
  tasks,
  activeFilter,
  onFilterChange,
  onRefresh,
  onEdit,
  stats,
  loadingStats,
}: DashboardProps) {
  const { logout } = useAuth()
  const { updateTask } = useUpdateTask()
  const { deleteTask } = useDeleteTask()
  const { updateSubtask } = useUpdateSubtask()
  const { deleteSubtask } = useDeleteSubtask()
  const { detachTag } = useDetachTag()
  const { toast } = useToast()

  const handleToggleComplete = useCallback(
    async (id: string) => {
      const task = tasks.find((t: Task) => t.id === id)
      if (!task) return

      try {
        await updateTask(id, {
          completed: !task.completed,
        })
        toast({
          title: !task.completed ? "Task completed!" : "Task restored",
          description: !task.completed ? "Excellent work on completing the task." : "The task has been moved back to pending.",
          variant: "success",
        })
        onRefresh()
      } catch (err: any) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        toast({
          title: "Action failed",
          description: "Could not update the task status. Please try again.",
          variant: "destructive",
        })
        console.error("Failed to update task:", err)
      }
    },
    [tasks, updateTask, onRefresh, toast]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteTask(id)
        toast({
          title: "Task deleted",
          description: "The task has been permanently removed.",
          variant: "success",
        })
        onRefresh()
      } catch (err: any) {
        if (err.response?.status === 401) {
          await logout()
          return
        }
        toast({
          title: "Delete failed",
          description: "Could not delete the task. Please try again.",
          variant: "destructive",
        })
        console.error("Failed to delete task:", err)
      }
    },
    [deleteTask, onRefresh, toast]
  )

  const handleToggleSubtask = useCallback(
    async (subtaskId: string, completed: boolean) => {
      try {
        await updateSubtask(subtaskId, { completed })
        onRefresh()
      } catch (err) {
        toast({
          title: "Update failed",
          description: "Could not update subtask status.",
          variant: "destructive",
        })
      }
    },
    [updateSubtask, onRefresh, toast]
  )

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) => {
      try {
        await deleteSubtask(subtaskId)
        toast({
          title: "Subtask deleted",
          variant: "success",
        })
        onRefresh()
      } catch (err) {
        toast({
          title: "Delete failed",
          description: "Could not delete subtask.",
          variant: "destructive",
        })
      }
    },
    [deleteSubtask, onRefresh, toast]
  )

  const handleDetachTag = useCallback(
    async (taskId: string, tagId: string) => {
      try {
        await detachTag(taskId, tagId)
        onRefresh()
      } catch (err) {
        toast({
          title: "Detach failed",
          description: "Could not remove tag from task.",
          variant: "destructive",
        })
      }
    },
    [detachTag, onRefresh, toast]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-1 flex-col gap-6 bg-background p-6"
    >
      {/* Primary: Stats & Audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SystemOverview stats={stats} loading={loadingStats} />
        </div>
        <div className="lg:col-span-2">
          <AuditTrail limit={5} />
        </div>
      </div>

      {/* Secondary: Task Management */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs
          value={activeFilter}
          onValueChange={(v) => onFilterChange(v)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 border border-border bg-card">
            <TabsTrigger
              value="all"
              className="text-xs font-bold tracking-widest text-foreground/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              ALL
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="text-xs font-bold tracking-widest text-foreground/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              PENDING
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-xs font-bold tracking-widest text-foreground/50 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              COMPLETED
            </TabsTrigger>
          </TabsList>

          {(["all", "pending", "completed"] as const).map((status) => (
            <TabsContent
              key={status}
              value={status}
              className="mt-4 space-y-3"
            >
              {tasks.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  No tasks found
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {tasks.map((task: Task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDelete}
                        onEdit={onEdit}
                        onToggleSubtask={handleToggleSubtask}
                        onDeleteSubtask={handleDeleteSubtask}
                        onDetachTag={handleDetachTag}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
