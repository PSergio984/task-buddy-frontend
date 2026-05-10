import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTasks, useUpdateTask, useUpdateSubtask, useDeleteSubtask, useDetachTag } from "@/hooks/useTasks"
import { cn } from "@/lib/utils"
import { useFilters } from "@/contexts/FilterContext"
import { useOutletContext } from "react-router-dom"
import type { Task } from "@/lib/api"
import { TaskCard } from "@/components/task-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { ListChecks, Search, LayoutGrid, List, ArrowUpDown, Check, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"
import { Badge } from "@/components/ui/badge"

type SortMode = "priority" | "due_date" | "alpha"

const SORT_LABELS: Record<SortMode, string> = {
  priority: "Priority (High–Low)",
  due_date: "Deadline (Soonest)",
  alpha: "Alphabetical",
}

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 }

const LS_KEY = "tb_sort_preference"

interface LayoutContext {
  handleEditTask: (task: Task) => void
  onNewTask: () => void
}

export function TasksPage() {
  const { handleEditTask } = useOutletContext<LayoutContext>()
  const { activeSidebarFilter, activeStatus, setActiveStatus, activeTagId } = useFilters()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<SortMode>(() => {
    const saved = localStorage.getItem(LS_KEY)
    return (saved as SortMode) || "due_date"
  })
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
  
  const { data: projects = [] } = useProjects()
  const { data: tags = [] } = useTags()
  const { logout } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    localStorage.setItem(LS_KEY, sortBy)
  }, [sortBy])

  const isProjectFilter = activeSidebarFilter.startsWith("project:")
  const filterParam = activeStatus === "all" ? undefined : activeStatus
  const projectIdParam = isProjectFilter ? Number.parseInt(activeSidebarFilter.split(":")[1]) : undefined

  // Determine date filtering
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next7Days = new Date(today)
  next7Days.setDate(today.getDate() + 7)

  const { data: tasks = [], isLoading: loadingTasks, refetch: refreshTasks } = useTasks(
    filterParam, 
    projectIdParam, 
    activeTagId || undefined
  )

  const { mutateAsync: updateTask } = useUpdateTask()
  const { mutateAsync: updateSubtask } = useUpdateSubtask()
  const { mutateAsync: deleteSubtask } = useDeleteSubtask()
  const { mutateAsync: detachTag } = useDetachTag()

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(task.priority)
    const matchesProject = selectedProjects.length === 0 || (task.project_id && selectedProjects.includes(task.project_id))
    const matchesTags = selectedTags.length === 0 || task.tags?.some(tag => selectedTags.includes(tag.id))

    // Sidebar Smart Filters
    let matchesSidebar = true
    if (activeSidebarFilter === "today") {
      matchesSidebar = task.due_date ? new Date(task.due_date).getTime() >= today.getTime() && new Date(task.due_date).getTime() < today.getTime() + 86400000 : false
    } else if (activeSidebarFilter === "upcoming") {
      matchesSidebar = task.due_date ? new Date(task.due_date).getTime() >= today.getTime() && new Date(task.due_date).getTime() < next7Days.getTime() : false
    } else if (activeSidebarFilter === "inbox") {
      matchesSidebar = !task.project_id
    }

    return matchesSearch && matchesPriority && matchesProject && matchesTags && matchesSidebar
  })

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      if (sortBy === "priority") {
        const pa = PRIORITY_ORDER[a.priority] ?? 99
        const pb = PRIORITY_ORDER[b.priority] ?? 99
        return pa - pb
      }
      if (sortBy === "due_date") {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return a.title.localeCompare(b.title)
    })
  }, [filteredTasks, sortBy])

  const handleToggleComplete = async (id: number) => {
    const task = tasks.find((t: Task) => t.id === id)
    if (!task) return
    
    const nextStatus = !task.completed
    try {
      await updateTask({ id, updates: { completed: nextStatus } })
      toast({
        title: nextStatus ? "Task completed!" : "Task restored",
        description: nextStatus ? "Great job!" : "Task moved to pending.",
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
    }
  }


  const handleToggleSubtask = async (subtaskId: number, completed: boolean) => {
    try {
      await updateSubtask({ id: subtaskId, updates: { completed } })
      refreshTasks()
    } catch (err) {
      console.error("Failed to update subtask:", err)
      toast({ title: "Update failed", variant: "destructive" })
    }
  }

  const handleDeleteSubtask = async (subtaskId: number) => {
    try {
      await deleteSubtask(subtaskId)
      toast({ title: "Subtask deleted", variant: "success" })
      refreshTasks()
    } catch (err) {
      console.error("Failed to delete subtask:", err)
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  const handleDetachTag = async (taskId: number, tagId: number) => {
    try {
      await detachTag({ taskId, tagId })
      refreshTasks()
    } catch (err) {
      console.error("Failed to detach tag:", err)
      toast({ title: "Detach failed", variant: "destructive" })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col gap-8 p-6 lg:p-10 relative"
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-600 opacity-80" />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <ListChecks className="h-8 w-8" />
            <h1 className="text-4xl font-black tracking-tighter uppercase">Tasks</h1>
          </div>
          <p className="text-foreground/60 font-medium text-lg ml-11">
            {activeSidebarFilter === "all" ? "Your complete objective list." : "Refined focus for current mission."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort controls moved here — TopNav handles Create Task globally */}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40 transition-colors group-focus-within:text-primary" />
          <Input 
            placeholder="Search tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-14 pl-12 pr-4 rounded-2xl border-white/10 bg-white/5 backdrop-blur-xl text-lg focus-visible:ring-primary/30 shadow-2xl shadow-black/10 transition-all hover:bg-white/10"
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className={cn(
              "font-black text-[10px] tracking-widest uppercase flex items-center gap-2 transition-all h-10 px-4 rounded-xl",
              isFiltersExpanded || selectedPriorities.length > 0 || selectedProjects.length > 0 || selectedTags.length > 0
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-foreground/60 hover:text-foreground hover:bg-white/5"
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {(selectedPriorities.length + selectedProjects.length + selectedTags.length) > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-white font-black">
                {selectedPriorities.length + selectedProjects.length + selectedTags.length}
              </span>
            )}
          </Button>
          <div className="w-[1px] h-6 bg-border mx-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="font-bold text-xs tracking-widest uppercase flex items-center gap-2 text-foreground/60 hover:text-foreground">
                <ArrowUpDown className="h-4 w-4" />
                {SORT_LABELS[sortBy]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl border-border bg-background shadow-2xl p-1">
              <DropdownMenuLabel className="text-[10px] font-black tracking-widest uppercase text-muted-foreground px-3 py-2">Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.entries(SORT_LABELS) as [SortMode, string][]).map(([mode, label]) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => setSortBy(mode)}
                  className="rounded-xl cursor-pointer flex items-center justify-between font-semibold text-sm px-3 py-2.5"
                >
                  {label}
                  {sortBy === mode && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <AnimatePresence>
        {isFiltersExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-[2rem] bg-background/40 border border-border/50 backdrop-blur-xl">
              {/* Priority Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-1">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {["HIGH", "MEDIUM", "LOW"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPriorities(prev => 
                        prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                      )}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border",
                        selectedPriorities.includes(p)
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                          : "bg-muted text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/80"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Project Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-1">Projects</label>
                <div className="flex flex-wrap gap-2">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjects(prev => 
                        prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
                      )}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border",
                        selectedProjects.includes(p.id)
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                          : "bg-muted text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/80"
                      )}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag Filter */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 px-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTags(prev => 
                        prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                      )}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all border",
                        selectedTags.includes(t.id)
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                          : "bg-muted text-muted-foreground border-border/50 hover:border-primary/30 hover:bg-muted/80"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filter Pills */}
      {(selectedPriorities.length > 0 || selectedProjects.length > 0 || selectedTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mr-2">Active Filters:</p>
          {selectedPriorities.map(p => (
            <Badge key={p} variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1 uppercase text-[10px] font-black">
              {p}
              <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedPriorities(prev => prev.filter(x => x !== p))} />
            </Badge>
          ))}
          {selectedProjects.map(id => {
            const name = projects.find(p => p.id === id)?.name
            return (
              <Badge key={id} variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1 uppercase text-[10px] font-black">
                {name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedProjects(prev => prev.filter(x => x !== id))} />
              </Badge>
            )
          })}
          {selectedTags.map(id => {
            const name = tags.find(t => t.id === id)?.name
            return (
              <Badge key={id} variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 gap-1 pl-3 pr-2 py-1 uppercase text-[10px] font-black">
                {name}
                <X className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setSelectedTags(prev => prev.filter(x => x !== id))} />
              </Badge>
            )
          })}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSelectedPriorities([])
              setSelectedProjects([])
              setSelectedTags([])
            }}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-full h-8 px-4"
          >
            Clear All
          </Button>
        </div>
      )}

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
                {["t1", "t2", "t3", "t4"].map((id) => (
                  <Skeleton key={id} className="h-[200px] rounded-[2.5rem]" />
                ))}
              </div>
            ) : sortedTasks.length === 0 ? (
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
                  {sortedTasks.map((task, index) => (
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
