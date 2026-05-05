import { useState } from "react"
import { motion } from "framer-motion"
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
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>
  isLoading: boolean
}

export function NewTaskModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [category, setCategory] = useState<
    "work" | "personal" | "school" | "health" | "other"
  >("work")
  const [dueDate, setDueDate] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData: Omit<Task, "id" | "createdAt" | "updatedAt"> = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate || undefined,
      status: "pending",
    }

    try {
      await onSubmit(taskData)
      // Reset form
      setTitle("")
      setDescription("")
      setPriority("medium")
      setCategory("work")
      setDueDate("")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to create task:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[#EDE9E6] bg-[#FFFFFF] sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle className="text-[#0F172A]">
              Create New Task
            </DialogTitle>
            <DialogDescription className="text-[#0F172A]/60">
              Add a new task to your task list. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="title" className="text-[#0F172A]">
                Task Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="border-[#EDE9E6]"
              />
            </motion.div>

            {/* Description */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Label htmlFor="description" className="text-[#0F172A]">
                Description
              </Label>
              <textarea
                id="description"
                placeholder="Enter task description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-[#EDE9E6] bg-white px-3 py-2 text-base placeholder:text-[#0F172A]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2A388]/40"
              />
            </motion.div>

            {/* Priority and Category Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Priority */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Label htmlFor="priority" className="text-[#0F172A]">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(v: "low" | "medium" | "high") =>
                    setPriority(v)
                  }
                >
                  <SelectTrigger id="priority" className="border-[#EDE9E6]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Category */}
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Label htmlFor="category" className="text-[#0F172A]">
                  Category
                </Label>
                <Select
                  value={category}
                  onValueChange={(
                    v: "work" | "personal" | "school" | "health" | "other"
                  ) => setCategory(v)}
                >
                  <SelectTrigger id="category" className="border-[#EDE9E6]">
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
              </motion.div>
            </div>

            {/* Due Date */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="dueDate" className="text-[#0F172A]">
                Due Date
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border-[#EDE9E6]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-[#EDE9E6] text-[#0F172A] hover:bg-[#F1F5F9]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className="bg-[#0F172A] text-white hover:bg-[#0F172A]/90 disabled:border-[#94A3B8] disabled:bg-[#94A3B8]"
                >
                  {isLoading ? "Creating..." : "Create Task"}
                </Button>
              </DialogFooter>
            </motion.div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
