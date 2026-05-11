import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Flag, Sparkles } from "lucide-react"
import * as Icons from "lucide-react"
import { type Task } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTaskDrawerState } from "@/hooks/useTaskDrawerState"
import { SubtaskSection } from "./task-drawer/SubtaskSection"
import { MetaSidebar } from "./task-drawer/MetaSidebar"
import { ActionFooter } from "./task-drawer/ActionFooter"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export interface TaskDetailDrawerProps {
  readonly task: Task | null
  readonly mode: "view" | "create"
  readonly isOpen: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ task: initialTask, mode, isOpen, onOpenChange }: TaskDetailDrawerProps) {
  const state = useTaskDrawerState({ initialTask, mode, isOpen, onOpenChange })
  const [subtasksLimit, setSubtasksLimit] = useState(5)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  
  const allSubtasks = state.isCreate ? state.pendingSubtasks : state.localSubtasks
  const visibleSubtasks = allSubtasks.slice(0, subtasksLimit)

  const handleSafeClose = (open: boolean) => {
    if (!open && state.hasChanges) {
      setShowDiscardConfirm(true)
    } else {
      onOpenChange(open)
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleSafeClose}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-3xl p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl"
        >
          <DrawerHeader isCreate={state.isCreate} onClose={() => handleSafeClose(false)} />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-[0.65] flex flex-col p-8 gap-6 overflow-y-auto border-r border-white/5 no-scrollbar">
            <TitleSection 
              isCreate={state.isCreate}
              isEditingTitle={state.isEditingTitle}
              setIsEditingTitle={state.setIsEditingTitle}
              title={state.title}
              setTitle={state.setTitle}
              task={state.task}
              handleUpdate={state.handleUpdate}
              isDirty={state.isTitleDirty}
            />

            <DescriptionSection 
              isCreate={state.isCreate}
              description={state.description}
              setDescription={state.setDescription}
              task={state.task}
              handleUpdate={state.handleUpdate}
              isDirty={state.isDescriptionDirty}
            />

            <SubtaskSection
              isCreate={state.isCreate}
              isAddingSubtask={state.isAddingSubtask}
              setIsAddingSubtask={state.setIsAddingSubtask}
              newSubtaskTitle={state.newSubtaskTitle}
              setNewSubtaskTitle={state.setNewSubtaskTitle}
              handleAddSubtask={state.handleAddSubtask}
              visibleSubtasks={visibleSubtasks}
              allSubtasks={allSubtasks}
              handleToggleSubtask={state.handleToggleSubtask}
              handleDeleteSubtask={state.handleDeleteSubtask}
              subtaskInputRef={state.subtaskInputRef}
              subtasksLimit={subtasksLimit}
              setSubtasksLimit={setSubtasksLimit}
              pendingSubtasks={state.pendingSubtasks}
              setPendingSubtasks={state.setPendingSubtasks}
              task={state.task}
              isDirty={state.isSubtasksDirty}
            />
          </div>

            <MetaSidebar
              isCreate={state.isCreate}
              projectId={state.projectId}
              setProjectId={state.setProjectId}
              projects={state.projects}
              priority={state.priority}
              setPriority={state.setPriority}
              completed={state.completed}
              setCompleted={state.setCompleted}
              dueDate={state.dueDate}
              handleDateSelect={state.handleDateSelect}
              currentTags={state.currentTags}
              handleDetachTag={state.handleDetachTag}
              isTagPickerOpen={state.isTagPickerOpen}
              setIsTagPickerOpen={state.setIsTagPickerOpen}
              tagSearch={state.tagSearch}
              setTagSearch={state.setTagSearch}
              filteredTags={state.filteredTags}
              handleAttachTag={state.handleAttachTag}
              canCreateTag={state.canCreateTag}
              handleCreateAndAttachTag={state.handleCreateAndAttachTag}
              newTagColor={state.newTagColor}
              setNewTagColor={state.setNewTagColor}
              newTagIcon={state.newTagIcon}
              setNewTagIcon={state.setNewTagIcon}
              isProjectPickerOpen={state.isProjectPickerOpen}
              setIsProjectPickerOpen={state.setIsProjectPickerOpen}
              projectSearch={state.projectSearch}
              setProjectSearch={state.setProjectSearch}
              handleCreateProject={state.handleCreateProject}
              newProjectColor={state.newProjectColor}
              setNewProjectColor={state.setNewProjectColor}
              newProjectIcon={state.newProjectIcon}
              setNewProjectIcon={state.setNewProjectIcon}
              task={state.task}
              handleUpdate={state.handleUpdate}
              toast={state.toast}
              dirtySections={{
                dueDate: state.isDueDateDirty ?? undefined,
                status: state.isStatusDirty ?? undefined,
                priority: state.isPriorityDirty ?? undefined,
                project: state.isProjectDirty ?? undefined,
                tags: state.isTagsDirty ?? undefined
              }}
            />
          </div>
 
          <ActionFooter
            isCreate={state.isCreate}
            isDirty={state.isCreate ? !!state.title.trim() : state.hasChanges}
            onOpenChange={handleSafeClose}
            handleCreate={state.handleCreate}
            handleUpdate={state.handleConfirmUpdate}
            showDeleteConfirm={state.showDeleteConfirm}
            setShowDeleteConfirm={state.setShowDeleteConfirm}
            handleDelete={state.handleDelete}
            showSaveConfirm={state.showSaveConfirm}
            setShowSaveConfirm={state.setShowSaveConfirm}
          />
      </SheetContent>
    </Sheet>

    <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] max-w-[400px] p-8">
        <AlertDialogHeader className="items-center text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
            <Icons.AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <div className="space-y-3">
            <AlertDialogTitle className="text-3xl font-black tracking-tight leading-tight">Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base font-medium leading-relaxed px-4">
              You've made some edits to this task. Are you sure you want to discard them?
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8">
          <AlertDialogAction 
            onClick={handleConfirmDiscard}
            className="w-full h-14 rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-black uppercase tracking-widest text-xs shadow-xl shadow-destructive/20 transition-all active:scale-[0.98]"
          >
            Discard Changes
          </AlertDialogAction>
          <AlertDialogCancel className="w-full h-14 rounded-2xl border-white/5 bg-white/5 hover:bg-white/10 font-black uppercase tracking-widest text-xs transition-all active:scale-[0.98]">
            Go Back
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}

function DrawerHeader({ isCreate, onClose }: Readonly<{ isCreate: boolean; onClose: () => void }>) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          {isCreate ? <Sparkles className="h-4 w-4 text-primary" /> : <Flag className="h-4 w-4 text-primary" />}
        </div>
        <span className="text-xs font-black uppercase tracking-[0.3em] text-foreground/40">
          {isCreate ? "New Task" : "Task Details"}
        </span>
      </div>
      <button 
        onClick={onClose}
        className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors text-foreground/40 hover:text-foreground"
      >
        <Icons.X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface TitleSectionProps {
  readonly isCreate: boolean
  readonly isEditingTitle: boolean
  readonly setIsEditingTitle: (val: boolean) => void
  readonly title: string
  readonly setTitle: (val: string) => void
  readonly task: Task | null
  readonly handleUpdate: (updates: Partial<Task>) => void
  readonly isDirty: boolean
}

function TitleSection({ isCreate, isEditingTitle, setIsEditingTitle, title, setTitle, task, handleUpdate, isDirty }: Readonly<TitleSectionProps>) {
  if (isCreate || isEditingTitle) {
    return (
      <div className="pt-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { 
            setIsEditingTitle(false)
            if (!isCreate && task && title !== task.title && title.trim()) {
              handleUpdate({ title })
            }
          }}
          onKeyDown={(e) => { if (e.key === "Enter" && !isCreate) setIsEditingTitle(false) }}
          placeholder="Task Title..."
          className="text-4xl font-black bg-white/5 border border-white/10 focus-visible:ring-2 focus-visible:ring-primary/20 p-5 rounded-2xl shadow-2xl h-auto placeholder:text-foreground/10"
          autoFocus={isCreate}
        />
      </div>
    )
  }

  return (
    <div className="pt-2 space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Title</span>
        {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <div className="p-5 bg-white/5 border border-white/5 rounded-2xl shadow-xl hover:bg-white/10 transition-all duration-300 group">
        <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight">
          <button
            onClick={() => setIsEditingTitle(true)}
            className="text-left w-full cursor-text group-hover:text-primary transition-all duration-300 focus:outline-none focus:text-primary"
            aria-label={`Edit title: ${task?.title}`}
          >
            {task?.title}
          </button>
        </h2>
      </div>
    </div>
  )
}

interface DescriptionSectionProps {
  readonly isCreate: boolean
  readonly description: string
  readonly setDescription: (val: string) => void
  readonly task: Task | null
  readonly handleUpdate: (updates: Partial<Task>) => void
  readonly isDirty: boolean
}

function DescriptionSection({ isCreate, description, setDescription, task, handleUpdate, isDirty }: Readonly<DescriptionSectionProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label htmlFor="task-notes" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Notes</label>
        {isDirty && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
      </div>
      <Textarea
        id="task-notes"
        placeholder="Add notes, context, or details..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onBlur={() => { 
          if (!isCreate && task && description !== (task.description ?? "")) {
            handleUpdate({ description })
          }
        }}
        className="min-h-[180px] bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl p-4 text-sm resize-none"
      />
    </div>
  )
}


