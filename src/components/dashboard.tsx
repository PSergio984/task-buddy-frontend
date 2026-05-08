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
import type { Task, StatsOverview } from "@/hooks/useApi"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { LayoutDashboard, ListChecks } from "lucide-react"

export interface DashboardProps {
  readonly tasks: Task[]
  readonly activeStatus: string
  readonly onStatusChange: (status: string) => void
  readonly onRefresh: () => void
  readonly onEdit: (task: Task) => void
  readonly stats: StatsOverview | null
  readonly loadingStats: boolean
}

export function Dashboard({
  tasks,
  activeStatus,
  onStatusChange,
  onRefresh,
  onEdit,
  stats,
  loadingStats,
}: Readonly<DashboardProps>) {
  const { logout } = useAuth()
  const { updateTask } = useUpdateTask()
  const { deleteTask } = useDeleteTask()
  const { updateSubtask } = useUpdateSubtask()
  const { deleteSubtask } = useDeleteSubtask()
  const { detachTag } = useDetachTag()
  const { toast } = useToast()

  const handleToggleComplete = useCallback(
    async (id: number) => {
      const task = tasks.find((t: Task) => t.id === id)
      if (!task) return

      try {
        await updateTask(id, {
          completed: !task.completed,
        })
        toast({
          title: task.completed ? "Task restored" : "Task completed!",
          description: task.completed
            ? "The task has been moved back to pending."
            : "Excellent work on completing the task.",
          variant: "success",
        })
        onRefresh()
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
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
    [tasks, updateTask, onRefresh, toast, logout]
  )

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteTask(id)
        toast({
          title: "Task deleted",
          description: "The task has been permanently removed.",
          variant: "success",
        })
        onRefresh()
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
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
    [deleteTask, onRefresh, toast, logout]
  )

  const handleToggleSubtask = useCallback(
    async (subtaskId: number, completed: boolean) => {
      try {
        await updateSubtask(subtaskId, { completed })
        onRefresh()
      } catch (err) {
        console.error("Failed to update subtask:", err)
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
    async (subtaskId: number) => {
      try {
        await deleteSubtask(subtaskId)
        toast({
          title: "Subtask deleted",
          variant: "success",
        })
        onRefresh()
      } catch (err) {
        console.error("Failed to delete subtask:", err)
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
    async (taskId: number, tagId: number) => {
      try {
        await detachTag(taskId, tagId)
        onRefresh()
      } catch (err) {
        console.error("Failed to detach tag:", err)
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
      className="flex flex-1 flex-col gap-8 bg-background/20 p-2 md:p-4 lg:p-6 backdrop-blur-sm"
    >
      {/* Header Section */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 text-primary">
          <LayoutDashboard className="h-6 w-6" />
          <h1 className="font-heading text-3xl font-bold tracking-tight">Executive Dashboard</h1>
        </div>
        <p className="text-muted-foreground ml-9">Manage your focus and track your peak performance.</p>
      </header>

      {/* Primary: Stats & Audit */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SystemOverview stats={stats} loading={loadingStats} />
        </div>
        <div className="lg:col-span-2">
          <AuditTrail limit={5} />
        </div>
      </div>

      {/* Secondary: Task Management */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="flex flex-col gap-6"
      >
        <div className="flex items-center gap-3 px-1">
          <ListChecks className="h-5 w-5 text-primary/70" />
          <h2 className="text-xl font-bold tracking-tight">Daily Agenda</h2>
        </div>

        <Tabs
          value={activeStatus}
          onValueChange={(v) => onStatusChange(v)}
          className="w-full"
        >
          <TabsList className="inline-flex h-12 items-center justify-center rounded-2xl border bg-background/50 p-1.5 backdrop-blur-xl shadow-sm mb-8">
            <TabsTrigger
              value="all"
              className="rounded-xl px-8 text-xs font-bold tracking-[0.2em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              ALL
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="rounded-xl px-8 text-xs font-bold tracking-[0.2em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              PENDING
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="rounded-xl px-8 text-xs font-bold tracking-[0.2em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg"
            >
              COMPLETED
            </TabsTrigger>
          </TabsList>

          {(["all", "pending", "completed"] as const).map((status) => (
            <TabsContent key={status} value={status} className="mt-0 space-y-4 focus-visible:outline-none">
              {tasks.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border bg-muted/20 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted/30">
                    <ListChecks className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-base font-medium text-muted-foreground italic">
                    Your agenda is clear. Time to innovate.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <AnimatePresence mode="popLayout">
                    {tasks.map((task: Task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, scale: 0.98, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ delay: index * 0.04, duration: 0.3 }}
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
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </motion.div>
  )
}
