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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion } from "framer-motion"
import { Sparkles, Calendar, PencilLine, Layers } from "lucide-react"
import { useGroups, type Task } from "@/hooks/useApi"

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
  const { groups } = useGroups()
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [groupId, setGroupId] = useState<string>(
    task?.group_id?.toString() ?? "none"
  )
  
  // Format due_date for datetime-local input (YYYY-MM-DDThh:mm)
  const formatDateTimeForInput = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ""
      // Adjust for local timezone offset to get local time in ISO format
      const localDate = new Date(date)
      localDate.setMinutes(date.getMinutes() - date.getTimezoneOffset())
      return localDate.toISOString().slice(0, 16)
    } catch (e) {
      return ""
    }
  }

  const [dueDate, setDueDate] = useState(formatDateTimeForInput(task?.due_date))

  // Update state when task prop changes (e.g. when opening modal to edit)
  useEffect(() => {
    if (task) {
      setTitle(task.title ?? "")
      setDescription(task.description ?? "")
      setGroupId(task.group_id?.toString() ?? "none")
      setDueDate(formatDateTimeForInput(task.due_date))
    } else {
      setTitle("")
      setDescription("")
      setGroupId("none")
      setDueDate("")
    }
  }, [task, open])

  const isEditMode = !!task

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData: Omit<Task, "id" | "created_at" | "user_id"> = {
      title: title.trim(),
      description: description.trim() || undefined,
      group_id: groupId !== "none" ? parseInt(groupId) : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      completed: task?.completed ?? false,
    }

    try {
      await onSubmit(taskData)
      if (!isEditMode) {
        setTitle("")
        setDescription("")
        setGroupId("none")
        setDueDate("")
      }
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
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="groupId" className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
                    <Layers className="h-3 w-3" />
                    Group
                  </Label>
                  <Select
                    value={groupId}
                    onValueChange={(v: string) => setGroupId(v)}
                  >
                    <SelectTrigger id="groupId" className="h-12 rounded-2xl border-border bg-background/50 px-4 font-semibold">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-background/95 backdrop-blur-xl">
                      <SelectItem value="none" className="rounded-xl focus:bg-muted font-medium">No Group</SelectItem>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()} className="rounded-xl focus:bg-muted font-medium">
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 w-2 rounded-full" 
                              style={{ backgroundColor: group.color || "gray" }} 
                            />
                            {group.name}
                          </div>
                        </SelectItem>
                      ))}
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
                    type="datetime-local"
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
