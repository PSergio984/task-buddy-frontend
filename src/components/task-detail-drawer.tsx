import { useState, useEffect } from "react"
import { 
  Sheet, 
  SheetContent
} from "@/components/ui/sheet"
import { 
  Calendar,
  Flag,
  Layers, 
  Circle,
  Plus,
  Trash2,
  MessageSquare
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUpdateTask, useDeleteTask } from "@/hooks/useTasks"
import { type Task, type TaskPriority } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { useProjects } from "@/hooks/useProjects"

interface TaskDetailDrawerProps {
  readonly task: Task | null
  readonly isOpen: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ task, isOpen, onOpenChange }: TaskDetailDrawerProps) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: projects = [] } = useProjects()
  
  const [title, setTitle] = useState(task?.title ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
    }
  }, [task])

  if (!task) return null

  const handleUpdate = (updates: Partial<Task>) => {
    updateTask.mutate({ id: task.id, updates })
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask.mutate(task.id)
      onOpenChange(false)
    }
  }

  const priorityColors = {
    HIGH: "text-red-500 bg-red-500/10 border-red-500/20",
    MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl">
        {/* Header/Banner Area */}
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content (Left 65%) */}
          <div className="flex-[0.65] flex flex-col p-8 gap-8 overflow-y-auto border-r border-white/5 no-scrollbar">
            {/* Title Section */}
            <div className="space-y-2">
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false)
                    if (title !== task.title) handleUpdate({ title })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingTitle(false)
                      if (title !== task.title) handleUpdate({ title })
                    }
                  }}
                  className="text-2xl font-black bg-transparent border-none focus-visible:ring-1 focus-visible:ring-primary/50 p-0"
                  autoFocus
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingTitle(true)}
                  className="text-3xl font-black tracking-tight text-foreground cursor-text hover:text-primary transition-colors"
                >
                  {task.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40 flex items-center gap-2">
                <MessageSquare className="h-3 w-3" />
                Description
              </label>
              <Textarea
                placeholder="Add a detailed description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  if (description !== (task.description ?? "")) handleUpdate({ description })
                }}
                className="min-h-[150px] bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl p-4 text-sm resize-none"
              />
            </div>

            {/* Subtasks (Simplified placeholder for now) */}
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                Sub-tasks
              </label>
              <div className="space-y-2">
                {task.subtasks?.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group">
                    <Circle className="h-4 w-4 text-foreground/20" />
                    <span className="text-sm flex-1">{sub.title}</span>
                  </div>
                ))}
                <button className="flex items-center gap-2 text-xs text-primary font-bold px-3 py-2 hover:bg-primary/10 rounded-xl transition-all">
                  <Plus className="h-3.5 w-3.5" />
                  Add sub-task
                </button>
              </div>
            </div>

             {/* Comments Placeholder */}
             <div className="mt-auto pt-8 border-t border-white/5">
                <div className="flex items-center gap-4 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-xs uppercase">
                    YH
                  </div>
                  <input 
                    placeholder="Write a comment..." 
                    className="bg-transparent border-none flex-1 text-sm focus:outline-none"
                  />
                </div>
             </div>
          </div>

          {/* Meta Info (Right 35%) */}
          <div className="flex-[0.35] bg-white/[0.02] p-8 space-y-8 flex flex-col">
            <div className="space-y-6">
              {/* Status Section */}
              <div className="space-y-3">
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

              {/* Priority Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Priority</label>
                <Select
                  value={task.priority}
                  onValueChange={(priority) => handleUpdate({ priority: priority as TaskPriority })}
                >
                  <SelectTrigger className={cn(
                    "w-full border-none rounded-xl h-10 font-bold",
                    priorityColors[task.priority]
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

              {/* Project Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Project</label>
                <Select
                  value={task.project_id?.toString() ?? "none"}
                  onValueChange={(val) => handleUpdate({ project_id: val === "none" ? undefined : parseInt(val) })}
                >
                  <SelectTrigger className="w-full bg-white/5 border-none rounded-xl h-10 font-bold">
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-foreground/40" />
                      <SelectValue placeholder="No Project" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Due Date</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-sm font-bold text-foreground/60 border border-white/5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No deadline"}
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Labels</label>
                <div className="flex flex-wrap gap-2">
                  {task.tags?.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 px-3 py-1 rounded-full text-[10px] font-black uppercase"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  <button className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Plus className="h-3 w-3 text-foreground/40" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto space-y-4">
              <Button 
                variant="destructive" 
                className="w-full rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Discard Task
              </Button>
              <p className="text-[10px] text-center font-bold text-foreground/20 uppercase">
                Created {format(new Date(task.created_at), "MMM d, HH:mm")}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
