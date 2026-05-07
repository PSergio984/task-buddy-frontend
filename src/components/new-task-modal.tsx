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
import type { Task } from "@/hooks/useApi"

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
      completed: false,
    }

    try {
      await onSubmit(taskData)
      // Reset form (though key change in parent will also handle this)
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
      <DialogContent className="sm:max-w-[425px] border-border bg-card p-0 overflow-hidden shadow-2xl">
        <div className="p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold text-foreground">
              {isEditMode ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {isEditMode 
                ? "Update your task details below." 
                : "Add a new task to your task list. Fill in the details below."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                Task Title *
              </Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 border-border bg-muted/50 text-foreground placeholder:text-muted-foreground/30 focus:border-ring focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-foreground">
                Description
              </Label>
              <textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-foreground placeholder:text-muted-foreground/30 focus:border-ring focus:ring-1 focus:ring-ring transition-all outline-none"
              />
            </div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-foreground">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v: "low" | "medium" | "high") =>
                    setPriority(v)
                  }
                >
                  <SelectTrigger id="priority" className="h-11 border-border bg-muted/50 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-foreground">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(
                    v: "work" | "personal" | "school" | "health" | "other"
                  ) => setCategory(v)}
                >
                  <SelectTrigger id="category" className="h-11 border-border bg-muted/50 text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-semibold text-foreground">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-11 border-border bg-muted/50 text-foreground focus:border-ring focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            <DialogFooter className="pt-4 mt-6 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 transition-all"
              >
                {(() => {
                  if (isLoading) {
                    return isEditMode ? "Updating..." : "Creating..."
                  }
                  return isEditMode ? "Update Task" : "Create Task"
                })()}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
