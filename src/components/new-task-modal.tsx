import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { Sparkles, Calendar, Tag, AlertCircle, PencilLine, Trash2 } from "lucide-react"
import type { Task } from "@/hooks/useApi"
import { cn } from "@/lib/utils"

export interface NewTaskModalProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSubmit: (
    taskData: Omit<Task, "id" | "created_at" | "user_id">
  ) => Promise<void>
  readonly isLoading: boolean
  readonly task?: Task | null
}

export function NewTaskModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  task,
}: Readonly<NewTaskModalProps>) {
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    task?.priority ?? "medium"
  )
  const [category, setCategory] = useState<
    "work" | "personal" | "school" | "health" | "other"
  >(task?.category ?? "work")
  const [dueDate, setDueDate] = useState(
    task?.due_date ? task.due_date.split("T")[0] : ""
  )
  const isEditMode = !!task

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData: Omit<Task, "id" | "created_at" | "user_id"> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      due_date: dueDate || undefined,
      completed: task?.completed ?? false,
    }

    try {
      await onSubmit(taskData)
      setTitle("")
      setDescription("")
      setPriority("medium")
      setCategory("work")
      setDueDate("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save task:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] overflow-hidden border-none bg-transparent p-0 shadow-none pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="pointer-events-auto overflow-hidden border bg-background/80 p-0 shadow-2xl shadow-primary/10 backdrop-blur-2xl rounded-[2.5rem]"
        >
          <div className="p-8 sm:p-10">
            <DialogHeader className="mb-10 text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {isEditMode ? <PencilLine className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                </div>
                <DialogTitle className="font-heading text-3xl font-black tracking-tight text-foreground">
                  {isEditMode ? "Refine Intent" : "Manifest Task"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm font-medium text-muted-foreground tracking-wide ml-13">
                {isEditMode 
                  ? "Adjust the parameters of your existing commitment." 
                  : "Articulate a new objective for your trajectory."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Title Section */}
              <div className="space-y-3">
                <Label htmlFor="title" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Objective Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Finalize architecture review"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-border bg-background/50 px-6 text-lg font-semibold focus-visible:ring-primary/20 placeholder:text-muted-foreground/30"
                />
              </div>

              {/* Description Section */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  Contextual Details
                </Label>
                <textarea
                  id="description"
                  placeholder="Define scope and dependencies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex min-h-[120px] w-full rounded-2xl border border-border bg-background/50 px-6 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all outline-none resize-none"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="priority" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <AlertCircle className="h-3 w-3" />
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(v: "low" | "medium" | "high") => setPriority(v)}
                  >
                    <SelectTrigger id="priority" className="h-12 rounded-2xl border-border bg-background/50 px-4 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl">
                      <SelectItem value="low" className="rounded-xl focus:bg-muted font-medium">Low Intensity</SelectItem>
                      <SelectItem value="medium" className="rounded-xl focus:bg-muted font-medium">Medium Flow</SelectItem>
                      <SelectItem value="high" className="rounded-xl focus:bg-muted font-medium">High Velocity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="category" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <Tag className="h-3 w-3" />
                    Domain
                  </Label>
                  <Select
                    value={category}
                    onValueChange={(v: any) => setCategory(v)}
                  >
                    <SelectTrigger id="category" className="h-12 rounded-2xl border-border bg-background/50 px-4 font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl">
                      <SelectItem value="work" className="rounded-xl focus:bg-muted font-medium">Professional</SelectItem>
                      <SelectItem value="personal" className="rounded-xl focus:bg-muted font-medium">Personal</SelectItem>
                      <SelectItem value="school" className="rounded-xl focus:bg-muted font-medium">Academic</SelectItem>
                      <SelectItem value="health" className="rounded-xl focus:bg-muted font-medium">Wellness</SelectItem>
                      <SelectItem value="other" className="rounded-xl focus:bg-muted font-medium">Uncategorized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-3">
                <Label htmlFor="dueDate" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                  <Calendar className="h-3 w-3" />
                  Execution Deadline
                </Label>
                <div className="relative group">
                   <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-14 rounded-2xl border-border bg-background/50 px-6 font-semibold focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <DialogFooter className="pt-8 mt-10 border-t border-border/50 gap-4 flex sm:justify-end">
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
                      <span>{isEditMode ? "Synchronize" : "Finalize Task"}</span>
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
