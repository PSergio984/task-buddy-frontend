import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Calendar, Flag, Layers, CheckCircle2, Circle, Plus, Trash2, Sparkles, Tag as TagIcon, X, Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUpdateTask, useDeleteTask, useCreateTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask, useCreateTag, useAttachTag, useDetachTag } from "@/hooks/useTasks"
import { useTags } from "@/hooks/useTags"
import { useProjects } from "@/hooks/useProjects"
import { type Task, type TaskPriority, type Tag, api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion, AnimatePresence } from "framer-motion"
import { ColorIconPicker, PRESET_COLORS } from "./color-icon-picker"
import * as Icons from "lucide-react"

export interface TaskDetailDrawerProps {
  readonly task: Task | null
  readonly mode: "view" | "create"
  readonly isOpen: boolean
  readonly onOpenChange: (open: boolean) => void
}

const PRIORITY_STYLES = {
  HIGH: "text-red-500 bg-red-500/10 border-red-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
}

export function TaskDetailDrawer({ task, mode, isOpen, onOpenChange }: TaskDetailDrawerProps) {
  const { toast } = useToast()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const createTask = useCreateTask()
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()
  const createTag = useCreateTag()
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()

  const { data: projects = [] } = useProjects()
  const { data: allTags = [] } = useTags()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [projectId, setProjectId] = useState<string>("none")
  const [projectSearch, setProjectSearch] = useState("")
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([])
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  // Tag state
  const [tagSearch, setTagSearch] = useState("")
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false)
  const [pendingTags, setPendingTags] = useState<Tag[]>([])
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState("Tag")

  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState("Layers")

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const isCreate = mode === "create"

  // Sync form when task changes
  useEffect(() => {
    if (task && !isCreate) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setPriority(task.priority)
      setProjectId(task.project_id?.toString() ?? "none")
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
    } else if (isCreate) {
      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setProjectId("none")
      setDueDate(undefined)
      setPendingSubtasks([])
      setPendingTags([])
    }
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
    setTagSearch("")
    setIsTagPickerOpen(false)
    setProjectSearch("")
    setIsProjectPickerOpen(false)
  }, [task, isCreate, isOpen])

  // Focus subtask input when shown
  useEffect(() => {
    if (isAddingSubtask) subtaskInputRef.current?.focus()
  }, [isAddingSubtask])

  // Snapshot task info for delete dialog to prevent "undefined" during optimistic delete
  const [deleteSnapshot, setDeleteSnapshot] = useState<{ title: string } | null>(null)
  useEffect(() => {
    if (task) setDeleteSnapshot({ title: task.title })
  }, [task])

  const handleUpdate = (updates: Partial<Task>) => {
    if (!task) return
    // If updating due_date, ensure it's not in the past if it's today
    if (updates.due_date) {
      const newDate = new Date(updates.due_date)
      const now = new Date()
      if (newDate < now && newDate.toDateString() === now.toDateString()) {
        // Just a warning for now, or we could clamp it
        console.warn("Setting a past time for today")
      }
    }
    updateTask.mutate({ id: task.id, updates })
  }

  const handleTitleBlur = () => {
    setIsEditingTitle(false)
    if (task && title !== task.title && title.trim()) handleUpdate({ title })
  }

  const handleDescriptionBlur = () => {
    if (task && description !== (task.description ?? "")) handleUpdate({ description })
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    
    if (isCreate) {
      setPendingSubtasks(prev => [...prev, newSubtaskTitle.trim()])
      setNewSubtaskTitle("")
      setIsAddingSubtask(false)
    } else if (task) {
      try {
        await createSubtask.mutateAsync({ taskId: task.id, title: newSubtaskTitle.trim() })
        setNewSubtaskTitle("")
        setIsAddingSubtask(false)
      } catch {
        toast({ title: "Failed to add subtask", variant: "destructive" })
      }
    }
  }

  const handleToggleSubtask = (subtaskId: number, completed: boolean) => {
    updateSubtask.mutate({ id: subtaskId, updates: { completed } })
  }

  const handleDeleteSubtask = (subtaskId: number) => {
    deleteSubtask.mutate(subtaskId)
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      // Close confirm dialog first to avoid UI sticking
      setShowDeleteConfirm(false)
      await deleteTask.mutateAsync(task.id)
      toast({ title: "Task deleted", variant: "success" })
      // Ensure drawer closes after deletion success
      onOpenChange(false)
    } catch (err) {
      console.error("Delete failed:", err)
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        project_id: projectId === "none" ? undefined : parseInt(projectId),
        due_date: dueDate?.toISOString(),
        completed: false,
        tags: pendingTags.map(t => t.name),
        subtasks: pendingSubtasks.map(stTitle => ({ title: stTitle }))
      })

      toast({ title: "Task created!", variant: "success" })
      onOpenChange(false)
    } catch (err) {
      console.error("Failed to create task:", err)
      toast({ title: "Failed to create task", variant: "destructive" })
    }
  }

  // Tag search & create
  const currentTags = isCreate ? pendingTags : (task?.tags || [])
  const filteredTags = allTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !currentTags?.some(tt => tt.id === t.id)
  )
  const canCreateTag = tagSearch.trim() && !allTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase())

  const handleAttachTag = async (tagId: number) => {
    const tag = allTags.find(t => t.id === tagId)
    if (!tag) return

    if (isCreate) {
      setPendingTags(prev => [...prev, tag])
      setTagSearch("")
    } else if (task) {
      try {
        await attachTag.mutateAsync({ taskId: task.id, tagId })
        setTagSearch("")
      } catch {
        toast({ title: "Failed to attach tag", variant: "destructive" })
      }
    }
  }

  const handleCreateAndAttachTag = async () => {
    if (!tagSearch.trim()) return
    try {
      const newTag = await createTag.mutateAsync({ 
        name: tagSearch.trim(),
        color: newTagColor,
        icon: newTagIcon
      })
      if (isCreate) {
        setPendingTags(prev => [...prev, newTag])
        setTagSearch("")
      } else if (task) {
        await attachTag.mutateAsync({ taskId: task.id, tagId: newTag.id })
      }
      setTagSearch("")
      setIsTagPickerOpen(false)
      // Reset defaults
      setNewTagColor(PRESET_COLORS[0])
      setNewTagIcon("Tag")
    } catch {
      toast({ title: "Failed to create tag", variant: "destructive" })
    }
  }

  const handleDetachTag = (tagId: number) => {
    if (isCreate) {
      setPendingTags(prev => prev.filter(t => t.id !== tagId))
    } else if (task) {
      detachTag.mutate({ taskId: task.id, tagId })
    }
  }

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) {
      if (isCreate) setDueDate(undefined)
      else handleUpdate({ due_date: undefined })
      return
    }

    const current = isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)
    const newDate = new Date(d)
    
    if (current) {
      newDate.setHours(current.getHours())
      newDate.setMinutes(current.getMinutes())
    } else {
      // Default to 09:00 if no time was set
      newDate.setHours(9)
      newDate.setMinutes(0)
    }

    if (isCreate) setDueDate(newDate)
    else handleUpdate({ due_date: newDate.toISOString() })
  }

  const handleCreateProject = async () => {
    if (!projectSearch.trim()) return
    try {
      const response = await api.post("/api/v1/projects/", { 
        name: projectSearch.trim(),
        color: newProjectColor,
        icon: newProjectIcon
      })
      const p = response.data
      if (isCreate) {
        setProjectId(p.id.toString())
      } else if (task) {
        handleUpdate({ project_id: p.id })
      }
      setProjectSearch("")
      setIsProjectPickerOpen(false)
      // Reset defaults
      setNewProjectColor(PRESET_COLORS[0])
      setNewProjectIcon("Layers")
      toast({ title: "Project created!", variant: "success" })
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" })
    }
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl"
          style={{ "--sheet-transition-duration": "100ms" } as React.CSSProperties}
        >
          {/* Top accent bar - Premium Blue Gradient */}
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shrink-0 shadow-[0_1px_10px_rgba(37,99,235,0.3)]" />

          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                {isCreate
                  ? <Sparkles className="h-4 w-4 text-primary" />
                  : <Flag className="h-4 w-4 text-primary" />
                }
              </div>
              <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">
                {isCreate ? "New Task" : "Task Details"}
              </span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Main content (left 65%) */}
            <div className="flex-[0.65] flex flex-col p-8 gap-6 overflow-y-auto border-r border-white/5 no-scrollbar">

              {/* Title */}
              <div className="space-y-4 pt-4 px-1">
                {isCreate || isEditingTitle ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={isCreate ? undefined : handleTitleBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isCreate) {
                        setIsEditingTitle(false)
                        handleTitleBlur()
                      }
                    }}
                    placeholder="Task Title..."
                    className="text-4xl font-black bg-transparent border-none focus-visible:ring-0 p-0 h-auto placeholder:text-foreground/10"
                    autoFocus={isCreate}
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-4xl font-black tracking-tighter text-foreground cursor-text hover:text-primary transition-all duration-300 leading-tight"
                  >
                    {task?.title}
                  </h2>
                )}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Notes</label>
                <Textarea
                  placeholder="Add notes, context, or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={isCreate ? undefined : handleDescriptionBlur}
                  className="min-h-[180px] bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl p-4 text-sm resize-none"
                />
              </div>

              {/* Subtasks */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                  Sub-Tasks
                  {(isCreate ? pendingSubtasks.length : (task?.subtasks?.length ?? 0)) > 0 && (
                    <span className="ml-2 text-primary">
                      {isCreate ? `0/${pendingSubtasks.length}` : `${task?.subtasks?.filter(s => s.completed).length}/${task?.subtasks?.length}`}
                    </span>
                  )}
                </label>

                <div className="space-y-2">
                  <AnimatePresence>
                    {(isCreate ? pendingSubtasks : task?.subtasks)?.map((sub, idx) => (
                      <motion.div
                        key={isCreate ? `pending-${idx}` : (sub as any).id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group/sub"
                      >
                        <div 
                          className="shrink-0 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => !isCreate && handleToggleSubtask((sub as any).id, !(sub as any).completed)}
                        >
                          {!isCreate && (sub as any).completed
                            ? <CheckCircle2 className="h-4 w-4 text-primary" />
                            : <Circle className="h-4 w-4 text-foreground/30" />
                          }
                        </div>
                        <span className={cn(
                          "text-sm flex-1 transition-all",
                          !isCreate && (sub as any).completed && "line-through text-foreground/30"
                        )}>
                          {isCreate ? (sub as string) : (sub as any).title}
                        </span>
                        <button
                          onClick={() => isCreate 
                            ? setPendingSubtasks(prev => prev.filter((_, i) => i !== idx))
                            : handleDeleteSubtask((sub as any).id)
                          }
                          className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-foreground/20 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                    {/* Add subtask inline input */}
                    <AnimatePresence>
                      {isAddingSubtask && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="flex items-center gap-2"
                        >
                          <input
                            ref={subtaskInputRef}
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAddSubtask()
                              if (e.key === "Escape") {
                                setIsAddingSubtask(false)
                                setNewSubtaskTitle("")
                              }
                            }}
                            placeholder="Sub-task title... (Enter to add)"
                            className="flex-1 bg-white/5 border border-primary/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60"
                          />
                          <button onClick={handleAddSubtask} className="text-primary hover:text-primary/80">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle("") }} className="text-foreground/30 hover:text-foreground">
                            <X className="h-4 w-4" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!isAddingSubtask && (
                      <button
                        onClick={() => setIsAddingSubtask(true)}
                        className="flex items-center gap-2 text-xs text-primary font-bold px-3 py-2 hover:bg-primary/10 rounded-xl transition-all"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add sub-task
                      </button>
                    )}
                  </div>
                </div>
              </div>

            {/* Meta sidebar (right 35%) */}
            <div className="flex-[0.35] bg-white/[0.02] p-8 space-y-6 flex flex-col overflow-y-auto no-scrollbar">

              {/* Status — view mode */}
              {!isCreate && task && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Status</label>
                  <Select
                    value={task.completed ? "COMPLETED" : "PENDING"}
                    onValueChange={(val) => handleUpdate({ completed: val === "COMPLETED" })}
                  >
                    <SelectTrigger className="w-full bg-white/5 border-none rounded-xl h-10 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Priority</label>
                <Select
                  value={isCreate ? priority : task?.priority}
                  onValueChange={(val) => {
                    if (isCreate) setPriority(val as TaskPriority)
                    else handleUpdate({ priority: val as TaskPriority })
                  }}
                >
                  <SelectTrigger className={cn(
                    "w-full border-none rounded-xl h-10 font-bold",
                    PRIORITY_STYLES[isCreate ? priority : (task?.priority ?? "MEDIUM")]
                  )}>
                    <div className="flex items-center gap-2">
                      <Flag className="h-3.5 w-3.5" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                    <SelectItem value="HIGH" className="text-red-500 font-bold">High</SelectItem>
                    <SelectItem value="MEDIUM" className="text-amber-500 font-bold">Medium</SelectItem>
                    <SelectItem value="LOW" className="text-blue-500 font-bold">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Project</label>
                <Popover open={isProjectPickerOpen} onOpenChange={setIsProjectPickerOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-sm font-bold text-foreground/60 border border-white/5 hover:bg-white/10 transition-colors text-left">
                      <Layers className="h-4 w-4 text-primary shrink-0" />
                      {projectId === "none" ? "No Project" : projects.find(p => p.id.toString() === projectId)?.name || "No Project"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="start">
                    <input
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateProject()
                      }}
                      placeholder="Search or create project..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 mb-2"
                    />
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      <button
                        onClick={() => {
                          setProjectId("none")
                          if (!isCreate) handleUpdate({ project_id: undefined })
                          setIsProjectPickerOpen(false)
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <Layers className="h-3 w-3 text-foreground/20" />
                        No Project
                      </button>
                      {projects
                        .filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()))
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              setProjectId(p.id.toString())
                              if (!isCreate) handleUpdate({ project_id: p.id })
                              setIsProjectPickerOpen(false)
                            }}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                          >
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color || "gray" }} />
                            {p.name}
                          </button>
                        ))}
                      {projectSearch.trim() && !projects.some(p => p.name.toLowerCase() === projectSearch.toLowerCase()) && (
                        <div className="flex items-center gap-1 border-t border-white/5 pt-2 mt-1">
                          <ColorIconPicker
                            color={newProjectColor}
                            icon={newProjectIcon}
                            onSelect={(c, i) => {
                              setNewProjectColor(c)
                              setNewProjectIcon(i)
                            }}
                          />
                          <button
                            onClick={handleCreateProject}
                            className="flex-1 text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            Create "{projectSearch}"
                          </button>
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 text-sm font-bold text-foreground/60 border border-white/5 hover:bg-white/10 transition-colors text-left">
                      <Calendar className="h-4 w-4 text-primary shrink-0" />
                      {(isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined))
                        ? format(isCreate ? dueDate! : new Date(task!.due_date!), "EEE, MMM d 'at' HH:mm")
                        : "No deadline"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 rounded-2xl border-white/10 bg-background/95 backdrop-blur-xl flex flex-col gap-4" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)}
                      onSelect={handleDateSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Set Time</label>
                        {(() => {
                          const date = isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)
                          if (date && date.toDateString() === new Date().toDateString()) {
                            return <p className="text-[8px] text-amber-500/70 font-bold uppercase">Today: Future times only</p>
                          }
                          return null
                        })()}
                      </div>
                      <div className="relative group/time">
                        <Input
                          type="time"
                          className={cn(
                            "w-36 bg-white/5 border-white/10 h-10 text-sm font-black rounded-xl focus-visible:ring-primary/30 transition-all hover:bg-white/10 px-4",
                            (() => {
                              const date = isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)
                              const now = new Date()
                              if (date && date < now && date.toDateString() === now.toDateString()) return "text-red-500 border-red-500/50"
                              return ""
                            })()
                          )}
                          value={(() => {
                            const date = isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)
                            if (!date) return "09:00"
                            return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                          })()}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number)
                            const current = isCreate ? (dueDate || new Date()) : (task?.due_date ? new Date(task.due_date) : new Date())
                            const newDate = new Date(current)
                            newDate.setHours(hours)
                            newDate.setMinutes(minutes)
                            
                            const now = new Date()
                            if (newDate < now && newDate.toDateString() === now.toDateString()) {
                              toast({ title: "Note: Setting a past time", variant: "default" })
                            }

                            if (isCreate) setDueDate(newDate)
                            else handleUpdate({ due_date: newDate.toISOString() })
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {currentTags?.map((tag) => {
                    const TagIconComp = (Icons as any)[tag.icon || "Tag"] || TagIcon
                    return (
                      <Badge
                        key={tag.id}
                        className="bg-primary/5 text-primary border-primary/10 px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 group/tag transition-all hover:bg-primary/10"
                        style={{ 
                          backgroundColor: tag.color ? `${tag.color}15` : undefined,
                          color: tag.color || undefined,
                          borderColor: tag.color ? `${tag.color}30` : undefined
                        }}
                      >
                        <TagIconComp className="h-2.5 w-2.5" style={{ color: tag.color || "inherit" }} />
                        {tag.name}
                        <button
                          onClick={() => handleDetachTag(tag.id)}
                          className="opacity-0 group-hover/tag:opacity-100 transition-opacity hover:text-red-400"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    )
                  })}

                    {/* Tag picker */}
                    <Popover open={isTagPickerOpen} onOpenChange={setIsTagPickerOpen}>
                      <PopoverTrigger asChild>
                        <button className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors">
                          <Plus className="h-3 w-3 text-foreground/40" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 rounded-xl border-white/10 bg-background/95 backdrop-blur-xl" align="start">
                        <input
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && canCreateTag) handleCreateAndAttachTag()
                          }}
                          placeholder="Search or create tag..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/50 mb-2"
                        />
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {filteredTags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => handleAttachTag(tag.id)}
                              className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
                            >
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || "#6366f1" }} />
                              {tag.name}
                            </button>
                          ))}
                          {canCreateTag && (
                            <div className="flex items-center gap-1 border-t border-white/5 pt-2 mt-1">
                              <ColorIconPicker
                                color={newTagColor}
                                icon={newTagIcon}
                                onSelect={(c, i) => {
                                  setNewTagColor(c)
                                  setNewTagIcon(i)
                                }}
                              />
                              <button
                                onClick={handleCreateAndAttachTag}
                                className="flex-1 text-left px-3 py-2 rounded-lg text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                              >
                                <Plus className="h-3 w-3" />
                                Create "{tagSearch}"
                              </button>
                            </div>
                          )}
                          {filteredTags.length === 0 && !canCreateTag && (
                            <p className="text-center text-[10px] text-foreground/30 py-2">All tags attached</p>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

              <div className="mt-auto space-y-3 pt-4">
                {isCreate ? (
                  <Button
                    onClick={handleCreate}
                    disabled={!title.trim() || createTask.isPending}
                    className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20"
                  >
                    {createTask.isPending ? "Creating..." : "Create Task"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Discard Task
                    </Button>
                    {task && (
                      <p className="text-[10px] text-center font-bold text-foreground/20 uppercase">
                        Created {format(new Date(task.created_at), "MMM d, HH:mm")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl">Delete this task?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              <span className="font-semibold text-foreground">"{deleteSnapshot?.title || "This task"}"</span> will be permanently removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
