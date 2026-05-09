import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTasks, useUpdateTask, useDeleteTask, useUpdateSubtask, useDeleteSubtask, useDetachTag } from "@/hooks/useTasks"
import { useFilters } from "@/contexts/FilterContext"
import { useOutletContext } from "react-router-dom"
import type { Task } from "@/lib/api"
import { TaskCard } from "@/components/task-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Search, Filter, Plus, LayoutGrid, List } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"

interface LayoutContext {
  handleEditTask: (task: Task) => void
  onNewTask: () => void
}

export function TasksPage() {
  const { handleEditTask, onNewTask } = useOutletContext<LayoutContext>()
  const { activeSidebarFilter, activeStatus, setActiveStatus, activeTagId } = useFilters()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { logout } = useAuth()
  const { toast } = useToast()

  const isProjectFilter = activeSidebarFilter.startsWith("project:")
  const filterParam = activeStatus === "all" ? undefined : activeStatus
  const projectIdParam = isProjectFilter ? parseInt(activeSidebarFilter.split(":")[1]) : undefined

  const { data: tasks = [], isLoading: loadingTasks, refetch: refreshTasks } = useTasks(
    filterParam, 
    projectIdParam, 
    activeTagId || undefined
  )

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: deleteTask } = useDeleteTask()
  const { mutateAsync: updateSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find((t: Task) => t.id === id)
    if (!task) return
    try {
      await updateTask({ id, updates: { completed: !task.completed } })
      toast({
        title: task.completed ? "Task restored" : "Task completed!",
        description: task.completed ? "Task moved to pending." : "Great job!",
        variant: "success",
      })
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      toast({ title: "Action failed", variant: "destructive" })
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id)
      toast({ title: "Task deleted", variant: "success" })
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  const handleToggleSubtask = async (subtaskId: number, completed: boolean) => {
    try {
      await updateSubtask({ id: subtaskId, updates: { completed } })
      refreshTasks()
    } catch (err) {
      toast({ title: "Update failed", variant: "destructive" })
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await deleteSubtask(subtaskId)
      toast({ title: "Subtask deleted", variant: "success" })
      refreshTasks()
    } catch (err) {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  const handleDetachTag = async (taskId: number, tagId: number) => {
    try {
      await detachTag({ taskId, tagId })
      refreshTasks()
    } catch (err) {
      toast({ title: "Detach failed", variant: "destructive" })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col gap-8 p-6 lg:p-10"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <ListChecks className="h-8 w-8" />
            <h1 className="text-4xl font-black tracking-tighter uppercase">Task Studio</h1>
          </div>
          <p className="text-foreground/60 font-medium text-lg ml-11">
            Refine, organize, and execute your vision.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={onNewTask}
            className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground font-bold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Task
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-2xl border-border bg-background/50 backdrop-blur-xl text-lg focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-2xl border border-border backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-primary text-primary-foreground shadow-lg" : "text-foreground/40"}
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-primary text-primary-foreground shadow-lg" : "text-foreground/40"}
          >
            <List className="h-5 w-5" />
          </Button>
          <div className="w-[1px] h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" className="font-bold text-xs tracking-widest text-foreground/40 uppercase flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Sort
          </Button>
        </div>
      </div>

      <Tabs value={activeStatus} onValueChange={setActiveStatus} className="w-full">
        <TabsList className="inline-flex h-14 items-center justify-center rounded-[2rem] border bg-background/50 p-1.5 backdrop-blur-2xl shadow-xl mb-10">
          {["all", "pending", "completed"].map((status) => (
            <TabsTrigger
              key={status}
              value={status}
              className="rounded-3xl px-10 text-xs font-black tracking-[0.3em] transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl uppercase"
            >
              {status}
            </TabsTrigger>
          ))}
        </TabsList>

        {["all", "pending", "completed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-0 outline-none">
            {loadingTasks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-[200px] rounded-[2.5rem]" />)}
              </div>
            ) : filteredTasks.length === 0 ? (
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
            ) : (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-4"}>
                <AnimatePresence mode="popLayout">
                  {filteredTasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.05, type: "spring", stiffness: 260, damping: 20 }}
                    >
                      <TaskCard
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onDelete={handleDelete}
                        onEdit={handleEditTask}
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
  )
}
