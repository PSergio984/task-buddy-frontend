import { useState, useEffect } from "react"
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

export interface NewTaskModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (
    taskData: any
  ) => Promise<void>
  readonly isLoading: boolean
}

export function NewTaskModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: Readonly<NewTaskModalProps>) {
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState<string>("none")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [tags, setTags] = useState<string>("")
  
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    setTitle("")
    setDescription("")
    setProjectId("none")
    setPriority("MEDIUM")
    setTags("")
    setDueDate(undefined)
  }, [open])

  const isEditMode = false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      project_id: projectId === "none" ? undefined : Number.parseInt(projectId),
      due_date: dueDate ? dueDate.toISOString() : undefined,
      completed: false,
      priority,
      tags: tags.split(",").map(t => t.trim()).filter(t => t !== ""),
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
      <DialogContent className="sm:max-w-2xl overflow-hidden border-none bg-transparent p-0 shadow-none pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="pointer-events-auto overflow-hidden border-none bg-white dark:bg-zinc-900 p-0 shadow-sm rounded-[2.5rem]"
        >
          <div className="p-8 sm:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <DialogTitle className="font-heading text-3xl font-black tracking-tight text-foreground">
                  New Task
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-muted-foreground tracking-wide ml-13">
                Articulate a new objective for your trajectory.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Section */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Objective Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Finalize architecture review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-6 text-lg font-semibold focus-visible:ring-primary/20 placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Project */}
                <div className="space-y-2">
                  <Label htmlFor="projectId" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <Layers className="h-3 w-3" />
                    Project
                  </Label>
                  <Select
                    value={projectId}
                    onValueChange={(v: string) => setProjectId(v)}
                  >
                    <SelectTrigger id="projectId" className="h-12 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-4 font-semibold">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background shadow-2xl">
                      <SelectItem value="none" className="rounded-xl focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20 font-medium">No Project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id.toString()} className="rounded-xl focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20 font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: project.color || "gray" }} 
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
                  <Label htmlFor="priority" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <Flag className="h-3 w-3" />
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(v: TaskPriority) => setPriority(v)}
                  >
                    <SelectTrigger id="priority" className="h-12 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-4 font-semibold">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background shadow-2xl">
                      <SelectItem value="LOW" className="rounded-xl focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          Low
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM" className="rounded-xl focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20 font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH" className="rounded-xl focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20 font-medium">
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
                  <Label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <CalendarIcon className="h-3 w-3" />
                    Deadline Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-12 justify-start text-left font-semibold rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-6 focus-visible:ring-primary/20 hover:bg-background/80 transition-colors",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-border bg-background/95 backdrop-blur-xl" align="start">
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
                  <Label htmlFor="time" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <Clock className="h-3 w-3" />
                    Deadline Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={dueDate ? format(dueDate, "HH:mm") : ""}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(":").map(Number);
                      const newDate = dueDate ? new Date(dueDate) : new Date();
                      newDate.setHours(hours, minutes);
                      setDueDate(newDate);
                    }}
                    className="h-12 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-4 font-semibold focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  <Tag className="h-3 w-3" />
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="e.g., work, research, critical"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="h-12 rounded-2xl border-border bg-muted/50 dark:bg-zinc-800/50 px-4 font-medium focus-visible:ring-primary/20 placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Description Section */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Define scope and dependencies..."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-2xl border border-border bg-muted/50 dark:bg-zinc-800/50 px-6 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              <DialogFooter className="pt-6 border-t border-border/50 gap-4 flex sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-12 px-6 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all font-bold"
                >
                  Discard
                </Button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={isLoading || !title.trim()}
                    className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all font-bold tracking-tight"
                  >
                    {isLoading ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                    ) : (
                      <span>{isEditMode ? "Update Task" : "Create Task"}</span>
                    )}
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
