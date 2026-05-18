import React, { useCallback, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCard } from "@/components/task-card"
import { AuditTrail } from "@/components/audit-trail"
import { SystemOverview } from "@/components/system-overview"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { useFilters } from "@/contexts/FilterContext"
import { useUserPreferences } from "@/hooks/useUserPreferences"
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
  useUpdateSubtask,
  useDeleteSubtask,
  useDetachTag,
} from "@/hooks/useTasks"
import type { Task, StatsOverview } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { Skeleton } from "@/components/ui/skeleton"
import { LayoutDashboard, ListChecks, Calendar } from "lucide-react"
import { animations } from "@/lib/animations"

export interface DashboardProps {
  readonly tasks: readonly Task[]
  readonly loadingTasks?: boolean
  readonly onRefresh: () => void
  readonly onEdit: (task: Task) => void
  readonly stats?: StatsOverview
  readonly loadingStats?: boolean
}

function TaskListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-48 rounded-[2rem] border border-white/5" />
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
  const { user, logout } = useAuth()
  const { skipTaskCompletionConfirm, skipSubtaskCompletionConfirm, setPreference } = useUserPreferences(user?.id ?? "default")
  const { mutateAsync: updateTask, isPending: isUpdatingTask } = useUpdateTask()
  const { mutateAsync: updateSubtask, isPending: isUpdatingSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()
  const { activeStatus, setActiveStatus } = useFilters()
  
  const { toast } = useToast()

  const [confirmData, setConfirmData] = useState<{
    id: number
    title: string
    type: "task" | "subtask" | "detach_tag"
    taskId?: number
  } | null>(null)

  const filteredTasks = useMemo(() => {
    const today = startOfToday()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const weekEnd = endOfWeek(today)

    return tasks.filter((task) => {
      if (task.completed) return false
      if (activeStatus === "all") return true
      if (!task.due_date) return false

      const dueDate = parseISO(task.due_date)
      if (activeStatus === "today") return isToday(dueDate)
      if (activeStatus === "tomorrow") return isTomorrow(dueDate)
      if (activeStatus === "week") {
        return isWithinInterval(dueDate, { start: today, end: weekEnd })
      }
      return true
    })
  }, [tasks, activeStatus])

  const handleToggleComplete = useCallback(
    async (id: number) => {
      const skipConfirm = skipTaskCompletionConfirm
      const task = tasks.find((t) => t.id === id)
      
      if (task && !skipConfirm) {
        setConfirmData({ id, title: task.title, type: "task" })
      } else if (task) {
        // Immediate update if skipping confirmation
        try {
          await updateTask({ id, updates: { completed: true } })
          onRefresh()
        } catch (err) {
          console.error("Failed to complete task:", err)
        }
      }
    },
    [tasks, updateTask, onRefresh, skipTaskCompletionConfirm]
  )

  const handleConfirmAction = async (dontShowAgain?: boolean) => {
    if (dontShowAgain) {
      if (confirmData?.type === "task") setPreference('skipTaskCompletionConfirm', true)
      else if (confirmData?.type === "subtask") setPreference('skipSubtaskCompletionConfirm', true)
    }
    if (!confirmData) return
    try {
      if (confirmData.type === "task") {
        await updateTask({ id: confirmData.id, updates: { completed: true } })
        toast({
          title: "Objective Complete",
          description: "Task marked as finished.",
          variant: "success",
        })
      } else if (confirmData.type === "subtask") {
        await updateSubtask({ id: confirmData.id, updates: { completed: true } })
        toast({
          title: "Subtask Finished",
          variant: "success",
        })
      } else if (confirmData.type === "detach_tag" && confirmData.taskId) {
        await detachTag({ taskId: confirmData.taskId, tagId: confirmData.id })
        toast({ title: "Tag removed", variant: "success" })
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        logout()
      }
      toast({
        title: "Update failed",
        description: "Could not update status.",
        variant: "destructive",
      })
    } finally {
      setConfirmData(null)
    }
  }

  const handleToggleSubtask = useCallback(
    async (subtaskId: number, completed: boolean) => {
      if (completed) {
        const skipConfirm = skipSubtaskCompletionConfirm
        const allSubtasks = tasks.flatMap(t => t.subtasks || [])
        const subtask = allSubtasks.find(s => s.id === subtaskId)
        
        if (subtask && !skipConfirm) {
          setConfirmData({ id: subtaskId, title: subtask.title, type: "subtask" })
          return
        }
      }
      
      try {
        await updateSubtask({ id: subtaskId, updates: { completed } })
      } catch (err) {
        console.error("Failed to update subtask:", err)
      }
    },
    [tasks, updateSubtask, skipSubtaskCompletionConfirm]
  )

  const handleDeleteSubtask = useCallback(
    async (subtaskId: number) => {
      try {
        await deleteSubtask(subtaskId)
        toast({
          title: "Subtask deleted",
          variant: "success",
        })
      } catch (err) {
        console.error("Failed to delete subtask:", err)
        toast({
          title: "Delete failed",
          description: "Could not delete subtask.",
          variant: "destructive",
        })
      }
    },
    [deleteSubtask, toast]
  )

  const handleDetachTag = useCallback(
    async (taskId: number, tagId: number) => {
      const task = tasks.find(t => t.id === taskId)
      const tag = task?.tags?.find(t => t.id === tagId)
      if (task && tag) {
        setConfirmData({
          type: "detach_tag",
          id: tagId,
          taskId,
          title: tag.name
        })
      }
    },
    [tasks]
  )

  return (
    <React.Fragment>
      <ConfirmationModal
        open={!!confirmData}
        onOpenChange={(open) => !open && setConfirmData(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmData?.type === "task" ? "Mission Accomplished?" : 
          confirmData?.type === "detach_tag" ? "Remove Tag?" :
          "Sub-objective Complete?"
        }
        description={
          confirmData?.type === "detach_tag" 
            ? `Are you sure you want to remove the tag "${confirmData?.title}"?`
            : `Confirm completion of: "${confirmData?.title}"`
        }
        variant={confirmData?.type === "detach_tag" ? "destructive" : "success"}
        confirmText={confirmData?.type === "detach_tag" ? "Remove Tag" : "Mark as Complete"}
        isLoading={isUpdatingTask || isUpdatingSubtask}
        showDontShowAgain={confirmData?.type !== "detach_tag"}
      />
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
            <h1 className="font-heading text-4xl font-black tracking-tighter uppercase">Dashboard</h1>
          </div>
          <p className="text-lg font-medium text-foreground/60 ml-16">Manage your daily goals and track your progress.</p>
        </header>

        {/* Primary: Stats & Audit */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <SystemOverview
              stats={stats}
              loading={!!loadingStats}
              timeframeTasks={filteredTasks}
              timeframeLabel={(() => {
                if (activeStatus === "all") return "All Time"
                if (activeStatus === "today") return "Today"
                if (activeStatus === "tomorrow") return "Tomorrow"
                return "This Week"
              })()}
            />
          </div>
          <div className="lg:col-span-2 h-[500px]">
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
            value={activeStatus}
            onValueChange={setActiveStatus}
            className="w-full"
          >
            <TabsList className="inline-flex h-14 items-center justify-center rounded-[2rem] border-none bg-white/5 p-1.5 backdrop-blur-2xl shadow-xl mb-10">
              {[
                { value: "all", label: "All" },
                { value: "today", label: "Due Today" },
                { value: "tomorrow", label: "Due Tomorrow" },
                { value: "week", label: "Due This Week" },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-3xl px-10 text-[10px] font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeStatus} className="mt-0 space-y-6 focus-visible:outline-none">    
              {(() => {
                if (loadingTasks) return <TaskListSkeleton />
                if (filteredTasks.length === 0) {
                  return (
                    <div className="flex h-80 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-border/30 bg-black/5 dark:bg-white/5 text-center animate-in fade-in zoom-in-95 duration-500">
                      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-muted/20">    
                        <ListChecks className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 uppercase tracking-tight">Agenda Clear</h3>
                      <p className="text-muted-foreground font-medium italic">
                        No critical objectives found in this view.
                      </p>
                    </div>
                  )
                }
                return (
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                      {filteredTasks.map((task: Task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, scale: 0.9, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -20 }}
                          transition={{ ...animations.spring.snappy, delay: index * 0.05 }}
                        >
                          <TaskCard
                            task={task}
                            onToggleComplete={handleToggleComplete}
                            onEdit={onEdit}
                            onToggleSubtask={handleToggleSubtask}
                            onDeleteSubtask={handleDeleteSubtask}
                            onDetachTag={handleDetachTag}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )
              })()}
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </React.Fragment>
  )
}
