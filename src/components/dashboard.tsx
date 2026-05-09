import { useCallback, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCard } from "@/components/task-card"
import { AuditTrail } from "@/components/audit-trail"
import { SystemOverview } from "@/components/system-overview"
import { Skeleton } from "@/components/ui/skeleton"
import {
  isToday,
  isTomorrow,
  isWithinInterval,
  startOfToday,
  endOfWeek,
  parseISO,
} from "date-fns"
import {
  useUpdateTask,
  useDeleteTask,
  useUpdateSubtask,
  useDeleteSubtask,
  useDetachTag,
} from "@/hooks/useTasks"
import type { Task, StatsOverview } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { LayoutDashboard, ListChecks, Calendar } from "lucide-react"

export interface DashboardProps {
  readonly tasks: Task[]
  readonly loadingTasks?: boolean
  readonly onRefresh: () => void
  readonly onEdit: (task: Task) => void
  readonly stats: StatsOverview | null
  readonly loadingStats: boolean
}

function TaskListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-[200px] rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 p-8 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-12 rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="pt-4">
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard({
  tasks,
  loadingTasks,
  onRefresh,
  onEdit,
  stats,
  loadingStats,
}: Readonly<DashboardProps>) {
  const { logout } = useAuth()
  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: deleteTask } = useDeleteTask()
  const { mutateAsync: updateSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()
  const [activeTab, setActiveTab] = useState("all")
  
  const { toast } = useToast()

  const filteredTasks = useMemo(() => {
    const today = startOfToday()
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Assuming Monday start

    return tasks.filter((task) => {
      if (activeTab === "all") return true
      if (!task.due_date) return false

      const dueDate = parseISO(task.due_date)
      
      if (activeTab === "today") return isToday(dueDate)
      if (activeTab === "tomorrow") return isTomorrow(dueDate)
      if (activeTab === "week") {
        return isWithinInterval(dueDate, { start: today, end: weekEnd })
      }
      return true
    })
  }, [tasks, activeTab])

  const handleToggleComplete = useCallback(
    async (id: number) => {
      const task = tasks.find((t: Task) => t.id === id)
      if (!task) return

      try {
        await updateTask({
          id,
          updates: { completed: !task.completed }
        })
        toast({
          title: task.completed ? "Task restored" : "Task completed!",
          description: task.completed
            ? "The task has been moved back to pending."
            : "Excellent work on completing the task.",
          variant: "success",
        })
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
    [tasks, updateTask, toast, logout]
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
    [deleteTask, toast, logout]
  )

  const handleToggleSubtask = useCallback(
    async (subtaskId: number, completed: boolean) => {
      try {
        await updateSubtask({ id: subtaskId, updates: { completed } })
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
        await detachTag({ taskId, tagId })
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
      className="flex flex-1 flex-col gap-10 bg-background/20 p-4 md:p-8 lg:p-12 backdrop-blur-3xl"
    >
      {/* Header Section */}
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-4 text-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
            <LayoutDashboard className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-4xl font-black tracking-tighter uppercase">Executive Dashboard</h1>
        </div>
        <p className="text-lg font-medium text-foreground/60 ml-16">High-performance tracking for your strategic objectives.</p>
      </header>

      {/* Primary: Stats & Audit */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
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
        className="flex flex-col gap-8"
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Strategic Agenda</h2>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="inline-flex h-14 items-center justify-center rounded-[2rem] border-none bg-white/5 p-1.5 backdrop-blur-2xl shadow-xl mb-10">
            <TabsTrigger
              value="all"
              className="rounded-3xl px-10 text-[10px] font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="today"
              className="rounded-3xl px-10 text-[10px] font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
            >
              Today
            </TabsTrigger>
            <TabsTrigger
              value="tomorrow"
              className="rounded-3xl px-10 text-[10px] font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
            >
              Tomorrow
            </TabsTrigger>
            <TabsTrigger
              value="week"
              className="rounded-3xl px-10 text-[10px] font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
            >
              This Week
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0 space-y-6 focus-visible:outline-none">    
            {loadingTasks ? (
              <TaskListSkeleton />
            ) : filteredTasks.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border/30 bg-white/5 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted/20">    
                  <ListChecks className="h-10 w-10 text-muted-foreground/20" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 uppercase tracking-tight">Agenda Clear</h3>
                <p className="text-muted-foreground font-medium italic">
                  No critical objectives found in this view.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task: Task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
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
        </Tabs>
      </motion.div>

    </motion.div>
  )
}
