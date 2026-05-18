import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Circle, Plus, Trash2, Check, X, GripVertical } from "lucide-react"
import { type Subtask, type Task } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { DragEndEvent, DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { useAuth } from "@/contexts/AuthContext"
import { CharacterCounter } from "../ui/character-counter"

interface SubtaskSectionProps {
  readonly isCreate: boolean
  readonly isAddingSubtask: boolean
  readonly setIsAddingSubtask: (v: boolean) => void
  readonly newSubtaskTitle: string
  readonly setNewSubtaskTitle: (v: string) => void
  readonly handleAddSubtask: () => void
  readonly visibleSubtasks: readonly (Subtask | { id: string; title: string })[]
  readonly allSubtasks: readonly (Subtask | { id: string; title: string })[]
  readonly handleToggleSubtask: (id: number, completed: boolean) => void
  readonly handleDeleteSubtask: (id: number) => void
  readonly subtaskInputRef: React.RefObject<HTMLInputElement | null>
  readonly subtasksLimit: number
  readonly setSubtasksLimit: (v: number) => void
  readonly pendingSubtasks: readonly { id: string; title: string }[]
  readonly setPendingSubtasks: React.Dispatch<React.SetStateAction<{ id: string; title: string }[]>>
  readonly task: Task | null
  readonly isDirty?: boolean
  readonly handleReorderSubtasks: (newSubtasks: (Subtask | { id: string; title: string })[]) => void
  readonly onDeleteSubtaskClick: (id: number | string) => void
}

export function SubtaskSection({
  isCreate, isAddingSubtask, setIsAddingSubtask,
  newSubtaskTitle, setNewSubtaskTitle, handleAddSubtask,
  visibleSubtasks, allSubtasks, handleToggleSubtask, handleDeleteSubtask,
  subtaskInputRef, subtasksLimit, setSubtasksLimit, pendingSubtasks, setPendingSubtasks,
  task, isDirty, handleReorderSubtasks, onDeleteSubtaskClick
}: Readonly<SubtaskSectionProps>) {
  const { user } = useAuth()
  const preferences = useUserPreferences(user?.id ?? "default")
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = allSubtasks.findIndex((sub) => sub.id.toString() === active.id.toString())
      const newIndex = allSubtasks.findIndex((sub) => sub.id.toString() === over.id.toString())

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove([...allSubtasks], oldIndex, newIndex)
        handleReorderSubtasks(newOrder)
      }
    }
  }

  const subtaskIds = allSubtasks.map((sub) => sub.id.toString())

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={subtaskIds}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {visibleSubtasks.map((sub) => (
                <SortableSubtaskItem 
                  key={sub.id.toString()}
                  id={sub.id.toString()}
                  sub={sub}
                  handleToggleSubtask={handleToggleSubtask}
                  handleDeleteSubtask={(id) => {
                    if (preferences.skipSubtaskDeletionConfirm) {
                      handleDeleteSubtask(id as number)
                    } else {
                      onDeleteSubtaskClick(id)
                    }
                  }}
                  pendingSubtasks={pendingSubtasks}
                  setPendingSubtasks={setPendingSubtasks}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

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
        ) : allSubtasks.length < 50 ? (
          <AddSubtaskButton onClick={() => setIsAddingSubtask(true)} />
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-destructive/40 px-3 py-2 italic select-none">
            Maximum sub-tasks reached (50)
          </div>
        )}
      </div>
    </div>
  )
}

function SortableSubtaskItem({ id, ...props }: Readonly<SubtaskItemProps & { id: string | number }>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <SubtaskItem {...props} attributes={attributes} listeners={listeners} />
    </div>
  )
}

interface SubtaskItemProps {
  readonly sub: Subtask | { id: string; title: string }
  readonly handleToggleSubtask: (id: number, completed: boolean) => void
  readonly handleDeleteSubtask: (id: number | string) => void
  readonly pendingSubtasks?: readonly { id: string; title: string }[]
  readonly setPendingSubtasks?: React.Dispatch<React.SetStateAction<{ id: string; title: string }[]>>
  readonly attributes?: DraggableAttributes
  readonly listeners?: DraggableSyntheticListeners
}

function SubtaskItem({ sub, handleToggleSubtask, handleDeleteSubtask, attributes, listeners }: Readonly<Omit<SubtaskItemProps, "pendingSubtasks" | "setPendingSubtasks">>) {
  const isPending = typeof sub.id === "string"
  const subTitle = sub.title
  const isCompleted = "completed" in sub && sub.completed

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 group/sub"
    >
      <div 
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing text-foreground/20 hover:text-primary transition-colors opacity-0 group-hover/sub:opacity-100"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      <button 
        type="button"
        aria-label={isCompleted ? "Mark subtask as incomplete" : "Mark subtask as complete"}
        className="shrink-0 cursor-pointer hover:text-primary transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full p-0 border-none bg-transparent"
        onClick={() => !isPending && handleToggleSubtask(sub.id as number, !isCompleted)}
      >
        {!isPending && isCompleted
          ? <CheckCircle2 className="h-4 w-4 text-primary" />
          : <Circle className="h-4 w-4 text-foreground/30" />
        }
      </button>
      <span className={cn(
        "text-sm flex-1 transition-all",
        isCompleted && "line-through text-foreground/30"
      )}>
        {subTitle}
      </span>
      
      <button
        onClick={() => handleDeleteSubtask(sub.id)}
        aria-label={`Delete subtask: ${subTitle}`}
        className="opacity-0 group-hover/sub:opacity-100 transition-opacity text-foreground/20 hover:text-red-500 focus-visible:opacity-100 outline-none"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
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

function SubtaskInput({ subtaskInputRef, newSubtaskTitle, setNewSubtaskTitle, handleAddSubtask, setIsAddingSubtask }: Readonly<SubtaskInputProps>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2">
        <input
          ref={subtaskInputRef}
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          maxLength={80}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAddSubtask()
            if (e.key === "Escape") {
              setIsAddingSubtask(false)
              setNewSubtaskTitle("")
            }
          }}
          placeholder="Sub-task title... (Enter to add)"
          aria-label="New sub-task title"
          className="flex-1 bg-white/10 border-2 border-primary/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-primary/60 hover:border-primary/40 transition-all shadow-inner"
        />
        <button onClick={handleAddSubtask} className="text-primary hover:text-primary/80" aria-label="Confirm add subtask">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle("") }} className="text-foreground/30 hover:text-foreground" aria-label="Cancel add subtask">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex justify-end px-2">
        <CharacterCounter current={newSubtaskTitle.length} limit={80} />
      </div>
    </motion.div>
  )
}

function AddSubtaskButton({ onClick }: Readonly<{ onClick: () => void }>) {
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
