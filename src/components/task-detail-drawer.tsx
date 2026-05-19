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
import { CharacterCounter } from "./ui/character-counter"
import { ConfirmationModal } from "./confirmation-modal"

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
  readonly onOpen: () => void
  readonly onClose: () => void
}

export function TaskDetailDrawer({
  task: initialTask,
  mode,
  isOpen,
  onOpen,
  onClose,
}: TaskDetailDrawerProps) {
  const state = useTaskDrawerState({
    initialTask,
    mode,
    isOpen,
    onOpen,
    onClose,
  })
  const [subtasksLimit, setSubtasksLimit] = useState(5)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const allSubtasks = state.isCreate
    ? state.pendingSubtasks
    : state.localSubtasks
  const visibleSubtasks = allSubtasks.slice(0, subtasksLimit)

  const handleClose = () => {
    if (state.hasChanges) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const onSheetOpenChange = (open: boolean) => {
    if (open) {
      onOpen()
    } else {
      handleClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onClose()
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onSheetOpenChange}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-l border-white/5 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl sm:max-w-3xl"
        >
          <DrawerHeader isCreate={state.isCreate} onClose={handleClose} />

          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <div className="no-scrollbar flex flex-1 flex-col gap-6 overflow-y-auto border-b border-white/5 p-6 md:p-8 lg:border-r lg:border-b-0">
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
                handleReorderSubtasks={state.handleReorderSubtasks}
                onDeleteSubtaskClick={state.setDeletingSubtask}
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
              localUnsavedProjects={state.localUnsavedProjects}
              task={state.task}
              handleUpdate={state.handleUpdate}
              toast={state.toast}
              dirtySections={{
                dueDate: state.isDueDateDirty ?? undefined,
                status: state.isStatusDirty ?? undefined,
                priority: state.isPriorityDirty ?? undefined,
                project: state.isProjectDirty ?? undefined,
                tags: state.isTagsDirty ?? undefined,
              }}
              isCreatingTag={state.isCreatingTag}
              isCreatingProject={state.isCreatingProject}
            />
          </div>

          <ActionFooter
            isCreate={state.isCreate}
            isDirty={state.hasChanges}
            isValid={state.title.trim() !== ""}
            onClose={handleClose}
            handleCreate={state.actions.handleCreate}
            handleUpdate={state.actions.handleConfirmUpdate}
            setShowDeleteConfirm={(v) => {
              if (v && state.preferences.skipTaskDeletionConfirm) {
                state.actions.handleDelete()
              } else {
                state.setShowDeleteConfirm(v)
              }
            }}
            showSaveConfirm={state.showSaveConfirm}
            setShowSaveConfirm={state.setShowSaveConfirm}
            isSaving={state.actions.isSaving}
            isDeleting={state.actions.isDeleting}
            isCreating={state.actions.isCreating}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={showDiscardConfirm}
        onOpenChange={setShowDiscardConfirm}
      >
        <AlertDialogContent className="max-w-[400px] rounded-[2.5rem] border border-white/10 bg-background/95 p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-3xl">
          <AlertDialogHeader className="items-center space-y-6 text-center">
            <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-amber-500/10">
              <Icons.AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-3">
              <AlertDialogTitle className="text-3xl leading-tight font-black tracking-tight">
                Unsaved Changes
              </AlertDialogTitle>
              <AlertDialogDescription className="px-4 text-base leading-relaxed font-medium text-muted-foreground">
                You've made some edits to this task. Are you sure you want to
                discard them?
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex-col gap-3 sm:flex-col">
            <AlertDialogAction
              onClick={handleConfirmDiscard}
              className="h-14 w-full rounded-2xl bg-destructive text-xs font-black tracking-widest text-destructive-foreground uppercase shadow-xl shadow-destructive/20 transition-all hover:bg-destructive/90 active:scale-[0.98]"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogCancel className="h-14 w-full rounded-2xl border-white/5 bg-white/5 text-xs font-black tracking-widest uppercase transition-all hover:bg-white/10 active:scale-[0.98]">
              Go Back
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Deletion Confirmation */}
      <ConfirmationModal
        open={state.showDeleteConfirm}
        onOpenChange={state.setShowDeleteConfirm}
        title="Delete Task"
        description="This action cannot be undone. All data for this task will be permanently removed."
        confirmText="Delete Task"
        variant="destructive"
        isLoading={state.actions.isDeleting}
        showDontShowAgain
        onConfirm={async (dontShow) => {
          if (dontShow)
            state.preferences.setPreference("skipTaskDeletionConfirm", true)
          await state.actions.handleDelete()
          // Ensure the modal closes even if the drawer unmounts/closes
          state.setShowDeleteConfirm(false)
        }}
      />

      {/* Subtask Deletion Confirmation */}
      <ConfirmationModal
        open={!!state.deletingSubtask}
        onOpenChange={(open) => !open && state.setDeletingSubtask(null)}
        title="Remove Subtask"
        description="Are you sure you want to remove this subtask?"
        confirmText="Remove"
        variant="destructive"
        showDontShowAgain
        onConfirm={async (dontShow) => {
          if (dontShow)
            state.preferences.setPreference("skipSubtaskDeletionConfirm", true)
          if (state.deletingSubtask !== null) {
            state.handleDeleteSubtask(state.deletingSubtask as number)
          }
          state.setDeletingSubtask(null)
        }}
      />
    </>
  )
}

function DrawerHeader({
  isCreate,
}: Readonly<{ isCreate: boolean; onClose?: () => void }>) {
  return (
    <div className="flex shrink-0 items-center justify-between border-b border-white/5 px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          {isCreate ? (
            <Sparkles className="h-4 w-4 text-primary" />
          ) : (
            <Flag className="h-4 w-4 text-primary" />
          )}
        </div>
        <span className="text-xs font-black tracking-[0.3em] text-foreground/40 uppercase">
          {isCreate ? "New Task" : "Task Details"}
        </span>
      </div>
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

function TitleSection({
  isCreate,
  isEditingTitle,
  setIsEditingTitle,
  title,
  setTitle,
  task,
  handleUpdate,
  isDirty,
}: Readonly<TitleSectionProps>) {
  if (isCreate || isEditingTitle) {
    return (
      <div className="space-y-2 pt-2">
        <div className="flex justify-end px-1">
          <CharacterCounter current={title.length} limit={100} />
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          onBlur={() => {
            setIsEditingTitle(false)
            if (!isCreate && task && title.trim() && title !== task.title) {
              handleUpdate({ title })
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isCreate) {
              e.currentTarget.blur()
            }
          }}
          placeholder="Task Title..."
          className="h-auto rounded-2xl border border-white/10 bg-white/5 p-5 text-4xl font-black shadow-2xl placeholder:text-foreground/10 focus-visible:ring-2 focus-visible:ring-primary/20"
          autoFocus={isCreate}
        />
      </div>
    )
  }

  const displayTitle = title || task?.title || "Untitled task"

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-black tracking-widest text-foreground/40 uppercase">
          Title
        </span>
        {isDirty && (
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
        )}
      </div>
      <div className="group rounded-2xl border border-white/5 bg-white/5 p-5 shadow-xl transition-all duration-300 hover:bg-white/10">
        <h2 className="text-4xl leading-tight font-black tracking-tighter break-words text-foreground">
          <button
            onClick={() => setIsEditingTitle(true)}
            className="w-full cursor-text text-left break-words whitespace-normal transition-all duration-300 group-hover:text-primary focus:text-primary focus:outline-none"
            aria-label={`Edit title: ${displayTitle}`}
          >
            {displayTitle}
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

function DescriptionSection({
  isCreate,
  description,
  setDescription,
  task,
  handleUpdate,
  isDirty,
}: Readonly<DescriptionSectionProps>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <label
          htmlFor="task-notes"
          className="text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          Notes
        </label>
        <div className="flex items-center gap-3">
          <CharacterCounter current={description.length} limit={2000} />
          {isDirty && (
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          )}
        </div>
      </div>
      <Textarea
        id="task-notes"
        placeholder="Add notes, context, or details..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={2000}
        onBlur={() => {
          if (!isCreate && task && description !== (task.description ?? "")) {
            handleUpdate({ description })
          }
        }}
        className="min-h-[180px] resize-none rounded-2xl border-none bg-white/5 p-4 text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
      />
    </div>
  )
}
