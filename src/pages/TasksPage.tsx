import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useTasks, useUpdateTask, useUpdateSubtask, useDeleteSubtask, useDetachTag } from "@/hooks/useTasks"
import { useFilters } from "@/contexts/FilterContext"
import { useOutletContext } from "react-router-dom"
import type { Task, Tag } from "@/lib/api"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { Badge } from "@/components/ui/badge"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { useTaskFilters } from "@/hooks/useTaskFilters"
import { TasksHeader } from "./tasks/TasksHeader"
import { TaskList } from "./tasks/TaskList"
import { useUserPreferences } from "@/hooks/useUserPreferences"

type SortMode = "priority" | "due_date" | "alpha"

const SORT_LABELS: Record<SortMode, string> = {
  priority: "Priority (High–Low)",
  due_date: "Deadline (Soonest)",
  alpha: "Alphabetical",
}

const LS_KEY = "tb_sort_preference"

interface LayoutContext {
  handleEditTask: (task: Task) => void
  onNewTask: () => void
}

export function TasksPage() {
  const { handleEditTask } = useOutletContext<LayoutContext>()
  const { 
    activeSidebarFilter, 
    activeStatus, 
    setActiveStatus, 
    activeTagId,
  } = useFilters()
  
  const { toast } = useToast()
  const { user, logout } = useAuth()
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [confirmData, setConfirmData] = useState<{
    type: "task" | "subtask" | "detach_tag" | "delete_subtask"
    id: number
    title: string
    completed?: boolean
    taskId?: number
  } | null>(null)

  const isProjectFilter = activeSidebarFilter.startsWith("project:")
  const filterParam = activeStatus === "all" ? undefined : activeStatus
  const projectIdParam = isProjectFilter ? Number.parseInt(activeSidebarFilter.split(":")[1], 10) : undefined

  const { data: tasks = [], isLoading: loadingTasks, refetch: refreshTasks } = useTasks(
    filterParam, 
    projectIdParam, 
    activeTagId || undefined
  )

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: updateSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortedTasks,
    togglePriority,
    clearAllFilters,
    selectedPriorities
  } = useTaskFilters(tasks)

  useEffect(() => {
    const saved = globalThis.localStorage.getItem(LS_KEY)
    if (saved && (saved === "priority" || saved === "due_date" || saved === "alpha")) {
      setSortBy(saved)
    }
  }, [setSortBy])

  useEffect(() => {
    globalThis.localStorage.setItem(LS_KEY, sortBy)
  }, [sortBy])

  const { 
    skipTaskCompletionConfirm, 
    skipSubtaskCompletionConfirm,
    skipTagDetachmentConfirm,
    skipSubtaskDeletionConfirm,
    setPreference 
  } = useUserPreferences(user?.id ?? "default")

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find((t: Task) => t.id === id)
    if (!task) return
    
    const nextStatus = !task.completed
    
    if (nextStatus) {
      if (skipTaskCompletionConfirm) {
        await performToggle(id, nextStatus)
        return
      }

      setConfirmData({
        type: "task",
        id,
        title: task.title,
        completed: true
      })
      return
    }

    await performToggle(id, nextStatus)
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    if (skipSubtaskDeletionConfirm) {
      try {
        await deleteSubtask(subtaskId)
        refreshTasks()
        toast({
          title: "Subtask deleted",
          variant: "success",
        })
        return
      } catch (err) {
        console.error("Failed to delete subtask:", err)
      }
    }

    // Find subtask to get its title
    const subtask = tasks.flatMap((t: Task) => t.subtasks || []).find(s => s.id === subtaskId)
    setConfirmData({
      type: "delete_subtask",
      id: subtaskId,
      title: subtask?.title || "this subtask"
    })
  }

  const handleConfirmAction = async (dontShowAgain?: boolean) => {
    if (!confirmData) return
    
    setIsCompleting(true)
    try {
      if (confirmData.type === "task") {
        if (dontShowAgain) setPreference('skipTaskCompletionConfirm', true)
        await performToggle(confirmData.id, confirmData.completed ?? false)
      } else if (confirmData.type === "subtask") {
        if (dontShowAgain) setPreference('skipSubtaskCompletionConfirm', true)
        await updateSubtask({ id: confirmData.id, updates: { completed: confirmData.completed ?? false } })
        refreshTasks()
        toast({
          title: "Subtask completed!",
          variant: "success",
        })
      } else if (confirmData.type === "detach_tag" && confirmData.taskId) {
        if (dontShowAgain) setPreference('skipTagDetachmentConfirm', true)
        await detachTag({ taskId: confirmData.taskId, tagId: confirmData.id })
        refreshTasks()
        toast({
          title: "Tag removed",
          variant: "success",
        })
      } else if (confirmData.type === "delete_subtask") {
        if (dontShowAgain) setPreference('skipSubtaskDeletionConfirm', true)
        await deleteSubtask(confirmData.id)
        refreshTasks()
        toast({
          title: "Subtask deleted",
          variant: "success",
        })
      }
      setConfirmData(null)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      console.error("Failed to complete action:", err)
      toast({ 
        title: "Action failed", 
        description: "Could not update status.",
        variant: "destructive" 
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const performToggle = async (id: number, completed: boolean) => {
    setIsCompleting(true)
    try {
      await updateTask({ id, updates: { completed } })
      toast({
        title: completed ? "Task completed!" : "Task restored",
        description: completed ? "Great job!" : "Task moved to pending.",
        variant: "success",
      })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      console.error("Failed to toggle task status:", err)
      toast({ 
        title: "Action failed", 
        description: "Could not update task status.",
        variant: "destructive" 
      })
    } finally {
      setIsCompleting(false)
    }
  }

  const handleToggleSubtask = async (subtaskId: number, completed: boolean) => {
    if (completed) {
      if (skipSubtaskCompletionConfirm) {
        try {
          await updateSubtask({ id: subtaskId, updates: { completed: true } })
          refreshTasks()
          return
        } catch (err) {
          console.error("Failed to update subtask:", err)
        }
      }

      const allSubtasks = tasks.flatMap(t => t.subtasks || [])
      const subtask = allSubtasks.find(s => s.id === subtaskId)
      if (subtask) {
        setConfirmData({
          type: "subtask",
          id: subtaskId,
          title: subtask.title,
          completed: true
        })
        return
      }
    }
    
    try {
      await updateSubtask({ id: subtaskId, updates: { completed } })
      refreshTasks()
    } catch (err) {
      console.error("Failed to update subtask:", err)
    }
  }


  const handleDetachTag = async (taskId: number, tagId: number) => {
    if (skipTagDetachmentConfirm) {
      try {
        await detachTag({ taskId, tagId })
        refreshTasks()
        toast({
          title: "Tag removed",
          variant: "success",
        })
        return
      } catch (err) {
        console.error("Failed to detach tag:", err)
      }
    }

    const task = tasks.find((t: Task) => t.id === taskId)
    const tag = tags.find((t: Tag) => t.id === tagId)
    if (task && tag) {
      setConfirmData({
        type: "detach_tag",
        id: tagId,
        taskId,
        title: tag.name
      })
    }
  }

  const activeProject = isProjectFilter ? projects.find(p => p.id === projectIdParam) : null
  const activeTag = activeTagId ? tags.find(t => t.id === activeTagId) : null

  return (
    <>
    <ConfirmationModal
      open={!!confirmData}
      onOpenChange={(open) => !open && setConfirmData(null)}
      onConfirm={handleConfirmAction}
      title={
        confirmData?.type === "task" ? "Mission Accomplished?" : 
        confirmData?.type === "detach_tag" ? "Remove Tag?" :
        confirmData?.type === "delete_subtask" ? "Delete Subtask?" :
        "Sub-objective Complete?"
      }
      description={
        confirmData?.type === "detach_tag" 
          ? `Are you sure you want to remove the tag "${confirmData?.title}"?` :
        confirmData?.type === "delete_subtask"
          ? `Are you sure you want to delete the subtask "${confirmData?.title}"? This action cannot be undone.`
          : `Confirm completion of: "${confirmData?.title}"`
      }
      confirmText={
        confirmData?.type === "detach_tag" ? "Remove Tag" : 
        confirmData?.type === "delete_subtask" ? "Delete Subtask" : 
        "Mark Finished"
      }
      variant={
        (confirmData?.type === "detach_tag" || confirmData?.type === "delete_subtask") 
          ? "destructive" 
          : "success"
      }
      showDontShowAgain={true}
      dontShowAgainLabel={
        confirmData?.type === "detach_tag" ? "Don't ask again for tag removal" :
        confirmData?.type === "delete_subtask" ? "Don't ask again for subtask deletion" :
        "Don't ask again for completion"
      }
      isLoading={isCompleting}
    />

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col gap-10 bg-background/20 p-4 md:p-8 lg:p-12 backdrop-blur-3xl"
    >
      <header className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <Badge variant="outline" className="rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary">
                {activeSidebarFilter === "all" ? "All Tasks" : (activeProject?.name || activeSidebarFilter.replace("project:", "").toUpperCase())}
              </Badge>
              {activeTag && (
                <Badge variant="secondary" className="rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase bg-accent/10 text-accent">
                  Focus: {activeTag.name}
                </Badge>
              )}
            </div>
            <h1 className="font-heading text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
              Tasks
            </h1>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-white/5 p-1.5 border border-white/10 shadow-2xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-white/5 hover:text-foreground"}`}
            >
              <span className="sr-only">Grid View</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-foreground/40 hover:bg-white/5 hover:text-foreground"}`}
            >
              <span className="sr-only">List View</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        <TasksHeader 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortLabels={SORT_LABELS}
          isFiltersExpanded={isFiltersExpanded}
          setIsFiltersExpanded={setIsFiltersExpanded}
          selectedPriorities={selectedPriorities}
          togglePriority={togglePriority}
          clearAllFilters={clearAllFilters}
        />
      </header>

      <Tabs 
        value={activeStatus} 
        onValueChange={setActiveStatus} 
        className="w-full"
      >
        <div className="mb-8 flex items-center justify-between">
          <TabsList className="h-auto bg-transparent p-0 gap-8">
            {["all", "pending", "completed"].map((status) => (
              <TabsTrigger
                key={status}
                value={status}
                className="relative bg-transparent p-0 text-xl font-black uppercase tracking-tighter text-foreground/30 transition-all data-[state=active]:text-primary hover:text-foreground/60 focus-visible:outline-none"
              >
                {status}
                {activeStatus === status && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute -bottom-2 left-0 h-1 w-full rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            <span>Result Set:</span>
            <span className="text-foreground">{sortedTasks.length} Units</span>
          </div>
        </div>

        {["all", "pending", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-0 outline-none">
            <TaskList 
              tasks={sortedTasks}
              loading={loadingTasks}
              viewMode={viewMode}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditTask}
              onToggleSubtask={handleToggleSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onDetachTag={handleDetachTag}
            />
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
    </>
  )
}
