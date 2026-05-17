import { useState, memo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import type { Task } from "@/lib/api"
import { Calendar, CheckCircle2, ChevronDown, ChevronUp, Layers, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import * as LucideIcons from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useSettings } from "@/contexts/SettingsContext"

export interface TaskCardProps {
  readonly task: Task
  readonly onToggleComplete: (id: number) => void
  readonly onEdit: (task: Task) => void
  readonly onToggleSubtask?: (subtaskId: number, completed: boolean) => void
  readonly onDeleteSubtask?: (subtaskId: number) => void
  readonly onDetachTag?: (taskId: number, tagId: number) => void
  readonly disabled?: boolean
}

export const TaskCard = memo(function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onToggleSubtask,
  onDeleteSubtask,
  onDetachTag,
  disabled = false
}: Readonly<TaskCardProps>) {
  const { timeFormat } = useSettings()
  const is12h = timeFormat === '12h'
  const [showAllSubtasks, setShowAllSubtasks] = useState(false)

  const handleToggleTask = () => {
    onToggleComplete(task.id)
  }

  const handleToggleSubtask = (subtaskId: number, completed: boolean) => {
    if (onToggleSubtask) {
      onToggleSubtask(subtaskId, completed)
    }
  }

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: is12h
    }).format(date)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault()
            onEdit(task)
          }
        }}
        className={cn(
          "group relative overflow-hidden border border-border/50 bg-card/80 dark:bg-white/10 dark:backdrop-blur-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:scale-[1.01] rounded-[2rem] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          task.completed && "opacity-75",
          disabled && "cursor-not-allowed hover:shadow-none hover:scale-100"
        )}
        onClick={(e) => {
          if (disabled) return
          // Prevent opening drawer if clicking checkbox or buttons
          const target = e.target as HTMLElement
          if (target.closest('[role="checkbox"]') || target.closest("button")) {
            return
          }
          onEdit(task)
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex flex-1 items-start gap-4">
              {/* Custom Checkbox Wrapper */}
              <div className="relative mt-1">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggleTask()}
                  disabled={disabled}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 border-primary/20 transition-all data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                />
                {task.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-primary-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => !disabled && onEdit(task)}
                    disabled={disabled}
                    className={cn(
                      "text-left group/title focus:outline-none transition-all",
                      disabled && "cursor-not-allowed"
                    )}
                  >
                    <h3
                      className={cn(
                        "font-heading text-lg font-bold tracking-tight text-foreground transition-all",
                        task.completed && "text-muted-foreground/50 line-through"
                      )}
                    >
                      {task.title}
                    </h3>
                  </button>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {(() => {
                        const ProjectIcon = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[task.project?.icon || "Layers"] || Layers
                        return <ProjectIcon className="h-2.5 w-2.5" style={{ color: task.project?.color || "gray" }} />
                      })()}
                      {task.project?.name || "Inbox"}
                    </div>
                    
                    {(() => {
                      let priorityClass = "bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                      let dotClass = "bg-emerald-500"
                      
                      if (task.priority === 'HIGH') {
                        priorityClass = "bg-red-500/30 text-red-700 dark:text-red-300 border-red-500/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.4)]"
                        dotClass = "bg-red-500"
                      } else if (task.priority === 'MEDIUM') {
                        priorityClass = "bg-amber-500/30 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]"
                        dotClass = "bg-amber-500"
                      }

                      return (
                        <div className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border",
                          priorityClass
                        )}>
                          <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", dotClass)} />
                          {task.priority}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {task?.description && (
                  <p className={cn(
                    "line-clamp-2 text-sm leading-relaxed text-muted-foreground",
                    task.completed && "text-muted-foreground/40"
                  )}>
                    {task.description}
                  </p>
                )}

                {/* Metadata & Tags */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  {task?.due_date && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-muted/30 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDueDate(task.due_date)}
                    </div>
                  )}

                  {task?.tags?.map((tag) => {
                    return (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="rounded-full bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 py-0.5 px-3 flex items-center gap-1.5"
                      >
                        {tag.name}
                        {!disabled && onDetachTag && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDetachTag(task.id, tag.id);
                            }}
                            disabled={disabled}
                            className="hover:text-foreground/80 transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Subtasks Section */}
          {(task?.subtasks?.length ?? 0) > 0 && (
            <div className="mt-6 space-y-3 border-t border-border/50 pt-5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  Sub-Tasks Progress
                </span>
                <span className="text-[10px] font-bold text-primary/70">
                  {task.subtasks?.filter(s => s.completed).length ?? 0}/{task.subtasks?.length ?? 0}
                </span>
              </div>
              <div className="space-y-2">
                {(() => {
                  const limit = 3
                  const hasMore = (task.subtasks?.length ?? 0) > limit
                  const displayedSubtasks = showAllSubtasks ? task.subtasks : task.subtasks?.slice(0, limit)
                  
                  return (
                    <>
                      {displayedSubtasks?.map((subtask) => (
                        <div
                          key={subtask.id}
                          className="group/sub flex items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={subtask.completed}
                              disabled={disabled}
                              onCheckedChange={(checked) => handleToggleSubtask(subtask.id, !!checked)}
                              className="h-4 w-4 rounded-md border-2 border-primary/20"
                            />
                            <span className={cn(
                              "text-xs font-medium transition-all",
                              subtask.completed ? "text-muted-foreground/40 line-through" : "text-muted-foreground"
                            )}>
                              {subtask.title}
                            </span>
                          </div>
                          {!disabled && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteSubtask?.(subtask.id)
                              }}
                              className="h-6 w-6 rounded-lg opacity-0 transition-opacity group-hover/sub:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAllSubtasks(!showAllSubtasks)
                          }}
                          className="mt-2 w-full gap-2 rounded-xl border border-dashed border-border/50 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 hover:bg-muted/50 hover:text-primary"
                        >
                          {showAllSubtasks ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              View {(task.subtasks?.length ?? 0) - limit} More Subtasks
                            </>
                          )}
                        </Button>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </motion.div>
  )
})
