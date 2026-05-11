import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Plus, Trash2, Check, X } from "lucide-react"
import { type Subtask, type Task } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SubtaskSectionProps {
  readonly isCreate: boolean
  readonly isAddingSubtask: boolean
  readonly setIsAddingSubtask: (v: boolean) => void
  readonly newSubtaskTitle: string
  readonly setNewSubtaskTitle: (v: string) => void
  readonly handleAddSubtask: () => void
  readonly visibleSubtasks: readonly (Subtask | string)[]
  readonly allSubtasks: readonly (Subtask | string)[]
  readonly handleToggleSubtask: (id: number, completed: boolean) => void
  readonly handleDeleteSubtask: (id: number) => void
  readonly subtaskInputRef: React.RefObject<HTMLInputElement | null>
  readonly subtasksLimit: number
  readonly setSubtasksLimit: (v: number) => void
  readonly pendingSubtasks: readonly string[]
  readonly setPendingSubtasks: React.Dispatch<React.SetStateAction<string[]>>
  readonly task: Task | null
  readonly isDirty?: boolean
}

export function SubtaskSection({
  isCreate, isAddingSubtask, setIsAddingSubtask,
  newSubtaskTitle, setNewSubtaskTitle, handleAddSubtask,
  visibleSubtasks, allSubtasks, handleToggleSubtask, handleDeleteSubtask,
  subtaskInputRef, subtasksLimit, setSubtasksLimit, pendingSubtasks, setPendingSubtasks,
  task, isDirty
}: SubtaskSectionProps) {

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
          Sub-Tasks
          {(isCreate ? pendingSubtasks.length : (task?.subtasks?.length ?? 0)) > 0 && (
            <span className="ml-2 text-primary">
              {isCreate ? `0/${pendingSubtasks.length}` : `${task?.subtasks?.filter(s => s.completed).length}/${task?.subtasks?.length}`}
            </span>
          )}
        </label>
        {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visibleSubtasks.map((sub, idx) => (
            <SubtaskItem 
              key={typeof sub === "string" ? `pending-${idx}` : sub.id}
              sub={sub}
              idx={idx}
              handleToggleSubtask={handleToggleSubtask}
              handleDeleteSubtask={handleDeleteSubtask}
              setPendingSubtasks={setPendingSubtasks}
            />
          ))}
        </AnimatePresence>

        {allSubtasks.length > subtasksLimit && (
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            onClick={() => setSubtasksLimit(subtasksLimit + 5)}
          >
            Load More Subtasks ({allSubtasks.length - subtasksLimit} remaining)
          </Button>
        )}

        {subtasksLimit > 5 && (
          <Button
            variant="ghost"
            className="w-full h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
            onClick={() => setSubtasksLimit(5)}
          >
            Show Less
          </Button>
        )}

        {isAddingSubtask ? (
          <SubtaskInput 
            subtaskInputRef={subtaskInputRef}
            newSubtaskTitle={newSubtaskTitle}
            setNewSubtaskTitle={setNewSubtaskTitle}
            handleAddSubtask={handleAddSubtask}
            setIsAddingSubtask={setIsAddingSubtask}
          />
        ) : (
          <AddSubtaskButton onClick={() => setIsAddingSubtask(true)} />
        )}
      </div>
    </div>
  )
}

interface SubtaskItemProps {
  readonly sub: Subtask | string
  readonly idx: number
  readonly handleToggleSubtask: (id: number, completed: boolean) => void
  readonly handleDeleteSubtask: (id: number) => void
  readonly setPendingSubtasks: React.Dispatch<React.SetStateAction<string[]>>
}

function SubtaskItem({ sub, idx, handleToggleSubtask, handleDeleteSubtask, setPendingSubtasks }: SubtaskItemProps) {
  const isPending = typeof sub === "string"
  const subTitle = isPending ? sub : sub.title
  const isCompleted = !isPending && sub.completed
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group/sub"
    >
      <div 
        role="button"
        tabIndex={0}
        aria-label={isCompleted ? "Mark subtask as incomplete" : "Mark subtask as complete"}
        className="shrink-0 cursor-pointer hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
        onClick={() => !isPending && handleToggleSubtask(sub.id, !isCompleted)}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isPending) {
            e.preventDefault()
            handleToggleSubtask(sub.id, !isCompleted)
          }
        }}
      >
        {!isPending && isCompleted
          ? <CheckCircle2 className="h-4 w-4 text-primary" />
          : <Circle className="h-4 w-4 text-foreground/30" />
        }
      </div>
      <span className={cn(
        "text-sm flex-1 transition-all",
        isCompleted && "line-through text-foreground/30"
      )}>
        {subTitle}
      </span>
      
      {confirmDelete ? (
        <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
          <button
            onClick={() => {
              if (isPending) {
                setPendingSubtasks((prev: string[]) => prev.filter((_, i) => i !== idx))
              } else {
                handleDeleteSubtask(sub.id)
              }
              setConfirmDelete(false)
            }}
            className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            aria-label="Confirm delete"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            className="p-1 text-foreground/30 hover:bg-white/10 rounded-md transition-colors"
            aria-label="Cancel delete"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          aria-label={`Delete subtask: ${subTitle}`}
          className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-foreground/20 hover:text-red-500 focus-visible:opacity-100 outline-none"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  )
}

interface SubtaskInputProps {
  readonly subtaskInputRef: React.RefObject<HTMLInputElement | null>
  readonly newSubtaskTitle: string
  readonly setNewSubtaskTitle: (v: string) => void
  readonly handleAddSubtask: () => void
  readonly setIsAddingSubtask: (v: boolean) => void
}

function SubtaskInput({ subtaskInputRef, newSubtaskTitle, setNewSubtaskTitle, handleAddSubtask, setIsAddingSubtask }: SubtaskInputProps) {
  return (
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
        aria-label="New sub-task title"
        className="flex-1 bg-white/5 border border-primary/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60"
      />
      <button onClick={handleAddSubtask} className="text-primary hover:text-primary/80" aria-label="Confirm add subtask">
        <Check className="h-4 w-4" />
      </button>
      <button onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle("") }} className="text-foreground/30 hover:text-foreground" aria-label="Cancel add subtask">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  )
}

function AddSubtaskButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        className="flex items-center gap-2 text-xs text-primary font-bold px-3 py-2 hover:bg-primary/10 rounded-xl transition-all"
      >
        <Plus className="h-3.5 w-3.5" />
        Add sub-task
      </button>
    </div>
  )
}
