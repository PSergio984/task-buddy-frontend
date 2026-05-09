import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi, api, type Task, type TaskPriority } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag as TagIcon,
  Layers,
  CheckCircle2,
  Circle,
  MoreVertical,
  Trash2,
  Edit3,
  CheckSquare,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)

  const taskId = id ? parseInt(id) : 0

  const {
    data: task,
    isLoading,
    error,
  } = useQuery<Task>({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/tasks/${taskId}`)
      return response.data
    },
    enabled: taskId > 0,
  })

  const toggleMutation = useMutation({
    mutationFn: (completed: boolean) => tasksApi.update(taskId, { completed }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] })
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
      toast({
        title: "Status Updated",
        description: `Task marked as ${!task?.completed ? "completed" : "pending"}.`,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(taskId),
    onSuccess: () => {
      toast({
        title: "Task Deleted",
        description: "The task has been permanently removed.",
        variant: "destructive",
      })
      navigate("/tasks")
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="shadow-glow h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Task Not Found</h2>
          <p className="max-w-sm text-muted-foreground">
            The task you're looking for might have been deleted or moved to
            another workspace.
          </p>
        </div>
        <Button
          onClick={() => navigate("/tasks")}
          variant="outline"
          className="h-12 rounded-2xl px-8 font-bold tracking-wider uppercase"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Studio
        </Button>
      </div>
    )
  }

  const priorityColors: Record<TaskPriority, string> = {
    LOW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    HIGH: "bg-destructive/10 text-destructive border-destructive/20",
  }
  const priorityColor =
    priorityColors[task.priority as TaskPriority] ||
    "bg-muted text-muted-foreground"

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-6 md:flex-row md:items-center"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <div className="mb-1 flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-bold tracking-widest uppercase",
                  priorityColor
                )}
              >
                {task.priority} Priority
              </Badge>
              {task.group && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 border-white/10 bg-white/5 text-[10px] font-bold tracking-widest text-foreground/60 uppercase"
                >
                  <Layers className="h-3 w-3" /> {task.group.name}
                </Badge>
              )}
            </div>
            <h1
              className={cn(
                "text-4xl leading-none font-black tracking-tighter transition-all md:text-5xl",
                task.completed && "text-foreground/40 line-through"
              )}
            >
              {task.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={task.completed ? "outline" : "default"}
            size="lg"
            onClick={() => toggleMutation.mutate(!task.completed)}
            className="h-14 rounded-2xl px-8 font-black tracking-wider uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {task.completed ? (
              <span className="flex items-center gap-2">
                Mark Pending <Circle className="h-5 w-5" />
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Complete Task <CheckCircle2 className="h-5 w-5" />
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <MoreVertical className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-white/10 bg-background/80 p-2 backdrop-blur-xl"
            >
              <DropdownMenuItem className="h-12 cursor-pointer gap-3 rounded-xl">
                <Edit3 className="h-4 w-4" /> Edit Task
              </DropdownMenuItem>
              <Separator className="my-1 bg-white/5" />
              <DropdownMenuItem
                onClick={() => setIsDeleting(true)}
                className="h-12 cursor-pointer gap-3 rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete Task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-xl font-bold tracking-[0.2em] text-foreground/40 uppercase">
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-0">
                <p className="text-xl leading-relaxed font-medium text-foreground/80">
                  {task.description ||
                    "No description provided for this task. Maintain your flow by adding context."}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subtasks Section placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between px-2">
              <h3 className="flex items-center gap-3 text-2xl font-black tracking-tight uppercase">
                <CheckSquare className="h-7 w-7 text-primary" /> Subtasks
              </h3>
              <Badge
                variant="outline"
                className="rounded-full border-primary/20 px-4 py-1 text-sm font-black tracking-widest text-primary uppercase"
              >
                {task.subtasks?.length || 0} ITEMS
              </Badge>
            </div>

            <div className="grid gap-4">
              {task.subtasks?.map((subtask: any) => (
                <div
                  key={subtask.id}
                  className="group flex items-center justify-between rounded-3xl border border-white/5 bg-white/5 p-6 transition-all hover:border-white/10"
                >
                  <div className="flex items-center gap-4">
                    <button
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-colors",
                        subtask.completed
                          ? "border-primary bg-primary"
                          : "border-white/20"
                      )}
                    >
                      {subtask.completed && (
                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "text-lg font-bold",
                        subtask.completed && "text-foreground/40 line-through"
                      )}
                    >
                      {subtask.title}
                    </span>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                className="h-16 rounded-3xl border-2 border-dashed border-white/5 font-black tracking-widest text-muted-foreground uppercase hover:border-white/20 hover:bg-white/5"
              >
                + Add Subtask
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <Card className="group relative overflow-hidden rounded-[2.5rem] border-none bg-primary text-primary-foreground shadow-sm">
              <div className="absolute top-0 right-0 p-8 opacity-20 transition-transform group-hover:scale-125">
                <Clock className="h-20 w-20" />
              </div>
              <CardHeader className="p-8 pb-0">
                <CardTitle className="text-sm font-bold tracking-[0.3em] uppercase opacity-60">
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tighter uppercase opacity-60">
                      Due Date
                    </p>
                    <p className="text-xl font-bold">
                      {task.due_date
                        ? format(new Date(task.due_date), "MMM d, yyyy 'at' p")
                        : "No deadline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-tighter uppercase opacity-60">
                      Created At
                    </p>
                    <p className="text-xl font-bold">
                      {format(new Date(task.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-white dark:bg-zinc-900 shadow-sm">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-sm font-bold tracking-[0.3em] text-foreground/40 uppercase">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex flex-wrap gap-2">
                  {task.tags?.length ? (
                    task.tags.map((tag: any) => (
                      <Badge
                        key={tag.id}
                        className="rounded-xl bg-accent px-4 py-2 text-xs font-black tracking-tighter text-accent-foreground uppercase"
                      >
                        <TagIcon className="mr-1.5 h-3 w-3" /> {tag.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No tags assigned
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Overlay placeholder */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="shadow-3xl w-full max-w-md space-y-8 rounded-[3rem] border border-white/10 bg-card p-10 text-center"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-destructive/10">
                <Trash2 className="h-10 w-10 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tighter uppercase">
                  Are you sure?
                </h3>
                <p className="text-lg leading-relaxed font-medium text-muted-foreground">
                  This action cannot be undone. This will permanently delete the
                  task and all associated subtasks.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => deleteMutation.mutate()}
                  className="h-16 rounded-2xl text-lg font-black tracking-wider uppercase"
                >
                  Yes, Delete Task
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => setIsDeleting(false)}
                  className="h-16 rounded-2xl font-black tracking-wider text-muted-foreground uppercase"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ")
}
