import { useState, useRef } from "react"
import { type Task, type TaskPriority, type Tag, type Subtask } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { PRESET_COLORS } from "@/components/color-icon-picker"
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useCreateTask,
  useCreateSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useReorderSubtasks,
  useAttachTag,
  useDetachTag,
} from "@/hooks/useTasks"
import { useProjects, useCreateProject } from "@/hooks/useProjects"
import { useTags, useCreateTag } from "@/hooks/useTags"

interface UseTaskDrawerStateProps {
  initialTask: Task | null
  mode: "view" | "create"
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function useTaskDrawerState({ initialTask, mode, isOpen, onOpenChange }: UseTaskDrawerStateProps) {
  const { toast } = useToast()
  const { data: fetchedTask } = useTask(initialTask?.id ?? null)
  const task = fetchedTask || initialTask

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const createTask = useCreateTask()
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()
  const reorderSubtasks = useReorderSubtasks()
  const createTag = useCreateTag()
  const createProject = useCreateProject()
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()

  const { data: projects = [] } = useProjects()
  const { data: allTags = [] } = useTags()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [completed, setCompleted] = useState(false)
  const [projectId, setProjectId] = useState<string>("none")
  const [projectSearch, setProjectSearch] = useState("")
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([])
  const [pendingSubtasks, setPendingSubtasks] = useState<{ id: string; title: string }[]>([])
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  // Tag state
  const [tagSearch, setTagSearch] = useState("")
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false)
  const [localTags, setLocalTags] = useState<Tag[]>([])
  const [pendingTags, setPendingTags] = useState<Tag[]>([])
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState("Tag")

  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState("Layers")

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const isCreate = mode === "create"

  // Sync state when task or mode changes (reset/initialize form)
  const [prevIsOpen, setPrevIsOpen] = useState(false)
  const [prevId, setPrevId] = useState<number | string | null>(null)
  const currentId = isCreate ? "create" : (task?.id ?? null)

  if (isOpen && (!prevIsOpen || currentId !== prevId)) {
    setPrevIsOpen(true)
    setPrevId(currentId)
    
    if (task && !isCreate) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setPriority(task.priority)
      setCompleted(task.completed)
      setProjectId(task.project_id?.toString() ?? "none")
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
      setLocalSubtasks(task.subtasks || [])
      setLocalTags(task.tags || [])
    } else {
      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setCompleted(false)
      setProjectId("none")
      setDueDate(undefined)
      setPendingSubtasks([])
      setPendingTags([])
      setLocalSubtasks([])
      setLocalTags([])
    }
    
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
    setTagSearch("")
    setIsTagPickerOpen(false)
    setProjectSearch("")
    setIsProjectPickerOpen(false)
    setShowDeleteConfirm(false)
    setShowSaveConfirm(false)
    setIsEditingTitle(false)
  }

  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false)
  }

  const isTitleDirty = Boolean(!isCreate && task && title !== task.title)
  const isDescriptionDirty = Boolean(!isCreate && task && description !== (task.description ?? ""))
  const isPriorityDirty = Boolean(!isCreate && task && priority !== task.priority)
  const isStatusDirty = Boolean(!isCreate && task && completed !== task.completed)
  const isProjectDirty = Boolean(!isCreate && task && projectId !== (task.project_id?.toString() ?? "none"))
  const isDueDateDirty = Boolean(!isCreate && task && (dueDate?.getTime() !== (task.due_date ? new Date(task.due_date).getTime() : undefined)))
  
  const isTagsDirty = Boolean(!isCreate && task && (
    localTags.length !== (task.tags || []).length ||
    localTags.some(lt => !(task.tags || []).some(ot => ot.id === lt.id))
  ))

  const isSubtasksDirty = Boolean(!isCreate && task && (
    localSubtasks.length !== (task.subtasks || []).length ||
    localSubtasks.some((ls, index) => {
      const os = (task.subtasks || [])[index]
      return !os || ls.id !== os.id || ls.title !== os.title || ls.completed !== os.completed
    })
  ))

  const hasChanges = isTitleDirty || isDescriptionDirty || isPriorityDirty || isStatusDirty || isProjectDirty || isDueDateDirty || isTagsDirty || isSubtasksDirty

  const handleUpdate = (updates: Partial<Task>) => {
    if (updates.title !== undefined) setTitle(updates.title)
    if (updates.description !== undefined) setDescription(updates.description ?? "")
    if (updates.priority !== undefined) setPriority(updates.priority)
    if (updates.completed !== undefined) setCompleted(updates.completed)
    if (updates.project_id !== undefined) setProjectId(updates.project_id?.toString() ?? "none")
    if (updates.due_date !== undefined) setDueDate(updates.due_date ? new Date(updates.due_date) : undefined)
  }

  const handleConfirmUpdate = async () => {
    if (!task) return
    try {
      // 1. Update core task fields
      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          completed,
          project_id: projectId === "none" ? undefined : Number.parseInt(projectId, 10),
          due_date: dueDate?.toISOString(),
        }
      })

      // 2. Sync Tags
      const originalTagIds = (task.tags || []).map(t => t.id)
      const currentTagIds = localTags.map(t => t.id)
      
      const tagsToAdd = currentTagIds.filter(id => !originalTagIds.includes(id))
      const tagsToRemove = originalTagIds.filter(id => !currentTagIds.includes(id))

      await Promise.all([
        ...tagsToAdd.map(id => attachTag.mutateAsync({ taskId: task.id, tagId: id })),
        ...tagsToRemove.map(id => detachTag.mutateAsync({ taskId: task.id, tagId: id }))
      ])

      // 3. Sync Subtasks
      const originalSubtasks = task.subtasks || []
      
      // New subtasks have id < 0
      const subtasksToCreate = localSubtasks.filter(s => s.id < 0)
      const subtasksToUpdate = localSubtasks.filter(s => s.id > 0 && (
        originalSubtasks.find(os => os.id === s.id)?.title !== s.title ||
        originalSubtasks.find(os => os.id === s.id)?.completed !== s.completed
      ))
      const subtasksToDelete = originalSubtasks.filter(os => !localSubtasks.some(ls => ls.id === os.id))

      // a. Delete removed subtasks
      await Promise.all(subtasksToDelete.map(s => deleteSubtask.mutateAsync(s.id)))
      
      // b. Update existing subtasks
      await Promise.all(subtasksToUpdate.map(s => updateSubtask.mutateAsync({ id: s.id, updates: { title: s.title, completed: s.completed } })))
      
      // c. Create new subtasks and capture their real IDs
      const createdSubtaskMappings = await Promise.all(
        subtasksToCreate.map(async (s) => {
          const newSub = await createSubtask.mutateAsync({ 
            taskId: task.id, 
            title: s.title,
            completed: s.completed 
          })
          return { tempId: s.id, realId: newSub.id }
        })
      )
      
      // d. Create a map for temp -> real ID lookup
      const idMap = new Map<number, number>()
      createdSubtaskMappings.forEach(mapping => idMap.set(mapping.tempId, mapping.realId))
      
      // e. Final reordering with all real IDs
      if (isSubtasksDirty) {
        const orderedIds = localSubtasks.map(s => s.id < 0 ? idMap.get(s.id)! : s.id)
        await reorderSubtasks.mutateAsync({ 
          taskId: task.id, 
          orderedIds 
        })
      }

      setShowSaveConfirm(false)
      toast({ title: "Changes saved", variant: "success" })
      onOpenChange(false)
    } catch {
      toast({ title: "Failed to save changes", variant: "destructive" })
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    if (isCreate) {
      setPendingSubtasks(prev => [...prev, { id: `pending-${Math.random().toString(36).substr(2, 9)}`, title: newSubtaskTitle.trim() }])
    } else {
      // Use negative ID for local-only subtasks
      const tempId = -Math.floor(Math.random() * 1000000)
      const newSub: {
        id: number
        task_id: number
        title: string
        completed: boolean
        created_at: string
      } = {
        id: tempId,
        task_id: task?.id || 0,
        title: newSubtaskTitle.trim(),
        completed: false,
        created_at: new Date().toISOString()
      }
      setLocalSubtasks(prev => [...prev, newSub])
    }
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
  }

  const handleToggleSubtask = (subtaskId: number, completed: boolean) => {
    if (isCreate) return // Pending subtasks don't have toggles in create mode usually
    setLocalSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed } : s))
  }

  const handleDeleteSubtask = (subtaskId: number) => {
    if (isCreate) return
    setLocalSubtasks(prev => prev.filter(s => s.id !== subtaskId))
  }

  const handleReorderSubtasks = (newSubtasks: Subtask[] | { id: string; title: string }[]) => {
    if (isCreate) {
      setPendingSubtasks(newSubtasks as { id: string; title: string }[])
    } else {
      setLocalSubtasks(newSubtasks as Subtask[])
    }
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      setShowDeleteConfirm(false)
      await deleteTask.mutateAsync(task.id)
      toast({ title: "Task deleted", variant: "success" })
      onOpenChange(false)
    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        project_id: projectId === "none" ? undefined : Number.parseInt(projectId, 10),
        due_date: dueDate?.toISOString(),
        completed: false,
        tags: pendingTags.map(t => t.name),
        subtasks: pendingSubtasks.map(st => ({ title: st.title }))
      })
      toast({ title: "Task created!", variant: "success" })
      onOpenChange(false)
    } catch {
      toast({ title: "Failed to create task", variant: "destructive" })
    }
  }

  const handleAttachTag = async (tagId: number) => {
    const tag = allTags.find(t => t.id === tagId)
    if (!tag) return
    if (isCreate) {
      setPendingTags(prev => [...prev, tag])
    } else {
      if (!localTags.some(t => t.id === tagId)) {
        setLocalTags(prev => [...prev, tag])
      }
    }
    setTagSearch("")
  }

  const handleCreateAndAttachTag = async () => {
    if (!tagSearch.trim()) return
    try {
      const newTag = await createTag.mutateAsync({ 
        name: tagSearch.trim(),
        color: newTagColor,
        icon: newTagIcon
      })
      if (isCreate) {
        setPendingTags(prev => [...prev, newTag])
      } else {
        setLocalTags(prev => [...prev, newTag])
      }
      setTagSearch("")
      setIsTagPickerOpen(false)
      setNewTagColor(PRESET_COLORS[0])
      setNewTagIcon("Tag")
    } catch {
      toast({ title: "Failed to create tag", variant: "destructive" })
    }
  }

  const handleDetachTag = (tagId: number) => {
    if (isCreate) setPendingTags(prev => prev.filter(t => t.id !== tagId))
    else setLocalTags(prev => prev.filter(t => t.id !== tagId))
  }

  const handleDateSelect = (d: Date | undefined, preserveTime = true) => {
    if (!d) {
      setDueDate(undefined)
      return
    }
    
    const newDate = new Date(d)
    if (preserveTime) {
      let current: Date | undefined = dueDate
      if (!isCreate && task?.due_date && !dueDate) {
        current = new Date(task.due_date)
      }
  
      if (current) {
        newDate.setHours(current.getHours())
        newDate.setMinutes(current.getMinutes())
      } else {
        const now = new Date()
        newDate.setHours(now.getHours())
        newDate.setMinutes(now.getMinutes())
      }
    }
    setDueDate(newDate)
  }

  const handleCreateProject = async () => {
    if (!projectSearch.trim()) return
    try {
      const p = await createProject.mutateAsync({ 
        name: projectSearch.trim(),
        color: newProjectColor,
        icon: newProjectIcon
      })
      setProjectId(p.id.toString())
      setProjectSearch("")
      setIsProjectPickerOpen(false)
      setNewProjectColor(PRESET_COLORS[0])
      setNewProjectIcon("Layers")
      toast({ title: "Project created!", variant: "success" })
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" })
    }
  }

  const currentTags = isCreate ? pendingTags : localTags
  const filteredTags = allTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !currentTags?.some(tt => tt.id === t.id)
  )
  const canCreateTag = !!tagSearch.trim() && !allTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase())

  return {
    task,
    isCreate,
    title, setTitle,
    description, setDescription,
    priority, setPriority,
    completed, setCompleted,
    projectId, setProjectId,
    projectSearch, setProjectSearch,
    isProjectPickerOpen, setIsProjectPickerOpen,
    dueDate, setDueDate,
    isEditingTitle, setIsEditingTitle,
    newSubtaskTitle, setNewSubtaskTitle,
    isAddingSubtask, setIsAddingSubtask,
    pendingSubtasks, setPendingSubtasks,
    localSubtasks, setLocalSubtasks,
    subtaskInputRef,
    tagSearch, setTagSearch,
    isTagPickerOpen, setIsTagPickerOpen,
    newTagColor, setNewTagColor,
    newTagIcon, setNewTagIcon,
    newProjectColor, setNewProjectColor,
    newProjectIcon, setNewProjectIcon,
    showDeleteConfirm, setShowDeleteConfirm,
    showSaveConfirm, setShowSaveConfirm,
    hasChanges,
    isTitleDirty, isDescriptionDirty, isPriorityDirty, isStatusDirty, isProjectDirty, isDueDateDirty, isTagsDirty, isSubtasksDirty,
    projects,
    allTags,
    currentTags,
    filteredTags,
    canCreateTag,
    isSaving: updateTask.isPending || attachTag.isPending || detachTag.isPending || createSubtask.isPending || updateSubtask.isPending || deleteSubtask.isPending || reorderSubtasks.isPending,
    isDeleting: deleteTask.isPending,
    isCreating: createTask.isPending,
    isCreatingTag: createTag.isPending,
    isCreatingProject: createProject.isPending,
    handleUpdate,
    handleConfirmUpdate,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleReorderSubtasks,
    handleDelete,
    handleCreate,
    handleAttachTag,
    handleCreateAndAttachTag,
    handleDetachTag,
    handleDateSelect,
    handleCreateProject,
    toast,
  }
}
