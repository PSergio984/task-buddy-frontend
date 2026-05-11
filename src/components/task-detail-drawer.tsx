import { useState } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Flag, Sparkles } from "lucide-react"
import { type Task } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useTaskDrawerState } from "@/hooks/useTaskDrawerState"
import { SubtaskSection } from "./task-drawer/SubtaskSection"
import { MetaSidebar } from "./task-drawer/MetaSidebar"
import { ActionFooter } from "./task-drawer/ActionFooter"

export interface TaskDetailDrawerProps {
  readonly task: Task | null
  readonly mode: "view" | "create"
  readonly isOpen: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function TaskDetailDrawer({ task: initialTask, mode, isOpen, onOpenChange }: TaskDetailDrawerProps) {
  const state = useTaskDrawerState({ initialTask, mode, isOpen, onOpenChange })
  const [subtasksLimit, setSubtasksLimit] = useState(5)
  
  const allSubtasks = state.isCreate ? state.pendingSubtasks : (state.task?.subtasks || [])
  const visibleSubtasks = allSubtasks.slice(0, subtasksLimit)

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl p-0 flex flex-col bg-background/95 backdrop-blur-2xl border-l border-white/5 shadow-2xl"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 shrink-0 shadow-[0_1px_10px_rgba(37,99,235,0.3)]" />

        <DrawerHeader isCreate={state.isCreate} />

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
            />

            <DescriptionSection 
              isCreate={state.isCreate}
              description={state.description}
              setDescription={state.setDescription}
              task={state.task}
              handleUpdate={state.handleUpdate}
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
            />
          </div>

          <MetaSidebar
            isCreate={state.isCreate}
            projectId={state.projectId}
            setProjectId={state.setProjectId}
            projects={state.projects}
            priority={state.priority}
            setPriority={state.setPriority}
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
          />
        </div>

        <ActionFooter
          isCreate={state.isCreate}
          isDirty={!!state.title.trim()}
          onOpenChange={onOpenChange}
          handleCreate={state.handleCreate}
          showDeleteConfirm={state.showDeleteConfirm}
          setShowDeleteConfirm={state.setShowDeleteConfirm}
          handleDelete={state.handleDelete}
        />
      </SheetContent>
    </Sheet>
  )
}

function DrawerHeader({ isCreate }: Readonly<{ isCreate: boolean }>) {
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
}

function TitleSection({ isCreate, isEditingTitle, setIsEditingTitle, title, setTitle, task, handleUpdate }: Readonly<TitleSectionProps>) {
  if (isCreate || isEditingTitle) {
    return (
      <div className="space-y-4 pt-4 px-1">
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
          className="text-4xl font-black bg-transparent border-none focus-visible:ring-0 p-0 h-auto placeholder:text-foreground/10"
          autoFocus={isCreate}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-4 px-1">
      <h2 className="text-4xl font-black tracking-tighter text-foreground leading-tight">
        <button
          onClick={() => setIsEditingTitle(true)}
          className="text-left w-full cursor-text hover:text-primary transition-all duration-300 focus:outline-none focus:text-primary"
          aria-label={`Edit title: ${task?.title}`}
        >
          {task?.title}
        </button>
      </h2>
    </div>
  )
}

interface DescriptionSectionProps {
  readonly isCreate: boolean
  readonly description: string
  readonly setDescription: (val: string) => void
  readonly task: Task | null
  readonly handleUpdate: (updates: Partial<Task>) => void
}

function DescriptionSection({ isCreate, description, setDescription, task, handleUpdate }: Readonly<DescriptionSectionProps>) {
  return (
    <div className="space-y-3">
      <label htmlFor="task-notes" className="text-[10px] font-black uppercase tracking-widest text-foreground/40">Notes</label>
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


