import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { CalendarIcon, Sparkles, Layers, Tag, Flag, Clock } from "lucide-react"
import { useProjects } from "@/hooks/useProjects"
import type { TaskPriority } from "@/lib/api"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { TimePicker } from "@/components/ui/time-picker"
import { animations } from "@/lib/animations"
import { useToast } from "@/hooks/use-toast"
import { CharacterCounter } from "./ui/character-counter"

export interface NewTaskModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (taskData: Record<string, unknown>) => Promise<void>
  readonly isLoading: boolean
}

export function NewTaskModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: Readonly<NewTaskModalProps>) {
  const { toast } = useToast()
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState<string>("none")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [tags, setTags] = useState<string>("")

  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  const [lastOpen, setLastOpen] = useState(open)

  // Reset state when modal opens - doing it during render to avoid useEffect cascading updates
  if (open && !lastOpen) {
    setLastOpen(true)
    setTitle("")
    setDescription("")
    setProjectId("none")
    setPriority("MEDIUM")
    setTags("")
    setDueDate(undefined)
  } else if (!open && lastOpen) {
    setLastOpen(false)
  }

  const isEditMode = false
  const isDirty =
    title.trim() !== "" ||
    description.trim() !== "" ||
    projectId !== "none" ||
    dueDate !== undefined ||
    tags.trim() !== "" ||
    priority !== "MEDIUM"

  const canSubmit = title.trim() !== "" && !isLoading

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!title.trim()) return

    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "")
    if (tagList.length > 10) {
      toast({
        title: "Too Many Tags",
        description: "A task can have a maximum of 10 tags.",
        variant: "destructive",
      })
      return
    }

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      project_id:
        projectId === "none" ? undefined : Number.parseInt(projectId, 10),
      due_date: dueDate ? dueDate.toISOString() : undefined,
      completed: false,
      priority,
      tags: tagList,
    }

    try {
      await onSubmit(taskData)
      if (!isEditMode) {
        setTitle("")
        setDescription("")
        setProjectId("none")
        setPriority("MEDIUM")
        setTags("")
        setDueDate(undefined)
      }
    } catch (error) {
      console.error("Failed to save task:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pointer-events-none overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={animations.spring.snappy}
          className="pointer-events-auto overflow-hidden rounded-[2.5rem] border-none bg-white p-0 shadow-sm dark:bg-zinc-900"
        >
          <div className="p-8 sm:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-3xl font-black tracking-tight text-foreground">
                  New Task
                </DialogTitle>
              </div>
              <DialogDescription className="ml-13 text-sm font-medium tracking-wide text-muted-foreground">
                Articulate a new objective for your trajectory.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="title"
                    className="ml-1 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    Objective Title
                  </Label>
                  <div className="flex items-center gap-3">
                    <CharacterCounter current={title.length} limit={100} />
                    {isDirty && (
                      <div className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    )}
                  </div>
                </div>
                <Input
                  id="title"
                  placeholder="e.g., Finalize architecture review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                  className="h-16 rounded-[1.25rem] border-2 border-border/50 bg-muted/30 px-6 text-xl font-bold shadow-inner transition-all placeholder:text-muted-foreground/30 hover:border-border focus-visible:border-primary focus-visible:ring-primary/10 dark:bg-zinc-800/80"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Project */}
                <div className="space-y-2">
                  <Label
                    htmlFor="projectId"
                    className="ml-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    <Layers className="h-3 w-3" />
                    Project
                  </Label>
                  <Select
                    value={projectId}
                    onValueChange={(v: string) => setProjectId(v)}
                  >
                    <SelectTrigger
                      id="projectId"
                      className="h-12 rounded-2xl border-border bg-muted/50 px-4 font-semibold dark:bg-zinc-800/50"
                    >
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background shadow-2xl">
                      <SelectItem
                        value="none"
                        className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                      >
                        No Project
                      </SelectItem>
                      {projects.map((project) => (
                        <SelectItem
                          key={project.id}
                          value={project.id.toString()}
                          className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: project.color || "gray",
                              }}
                            />
                            {project.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label
                    htmlFor="priority"
                    className="ml-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    <Flag className="h-3 w-3" />
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(v: TaskPriority) => setPriority(v)}
                  >
                    <SelectTrigger
                      id="priority"
                      className="h-12 rounded-2xl border-border bg-muted/50 px-4 font-semibold dark:bg-zinc-800/50"
                    >
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background shadow-2xl">
                      <SelectItem
                        value="LOW"
                        className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="MEDIUM"
                        className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="HIGH"
                        className="rounded-xl font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          High
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timing Section (Date & Time) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="ml-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    <CalendarIcon className="h-3 w-3" />
                    Deadline Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "h-12 w-full justify-start rounded-2xl border-border bg-muted/50 px-6 text-left font-semibold transition-colors hover:bg-background/80 focus-visible:ring-primary/20 dark:bg-zinc-800/50",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        {dueDate ? (
                          format(dueDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto rounded-2xl border-border bg-background/95 p-0 backdrop-blur-xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="time"
                    className="ml-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    <Clock className="h-3 w-3" />
                    Deadline Time
                  </Label>
                  <TimePicker
                    id="time"
                    value={dueDate ? format(dueDate, "HH:mm") : "09:00"}
                    onChange={(timeStr) => {
                      const [hours, minutes] = timeStr.split(":").map(Number)
                      const newDate = dueDate ? new Date(dueDate) : new Date()
                      newDate.setHours(hours, minutes)
                      setDueDate(newDate)
                    }}
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <Label
                  htmlFor="tags"
                  className="ml-1 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                >
                  <Tag className="h-3 w-3" />
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g., work, research, critical"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-12 rounded-2xl border-border bg-muted/50 px-4 font-medium placeholder:text-muted-foreground/30 focus-visible:ring-primary/20 dark:bg-zinc-800/50"
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <div className="ml-1 flex items-center justify-between">
                  <Label
                    htmlFor="description"
                    className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase"
                  >
                    Description
                  </Label>
                  <CharacterCounter current={description.length} limit={2000} />
                </div>
                <Textarea
                  id="description"
                  placeholder="Define scope and dependencies..."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setDescription(e.target.value)
                  }
                  maxLength={2000}
                  className="flex min-h-[100px] w-full resize-none rounded-2xl border border-border bg-muted/50 px-6 py-4 text-sm font-medium text-foreground transition-all outline-none placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 dark:bg-zinc-800/50"
                />
              </div>

              <DialogFooter className="flex gap-4 border-t border-border/50 pt-6 sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 rounded-2xl px-6 font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
                >
                  Discard
                </Button>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    loading={isLoading}
                    disabled={!canSubmit}
                    className="h-12 rounded-2xl bg-primary px-10 font-bold tracking-tight text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-50 disabled:grayscale-[0.5]"
                  >
                    <span>{isEditMode ? "Update Task" : "Create Task"}</span>
                  </Button>
                </motion.div>
              </DialogFooter>
            </form>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
