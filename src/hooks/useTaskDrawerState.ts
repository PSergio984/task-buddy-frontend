import { useState, useRef } from "react"
import { type Task, type TaskPriority, type Tag, api } from "@/lib/api"
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
  useCreateTag,
  useAttachTag,
  useDetachTag,
} from "@/hooks/useTasks"
import { useProjects } from "@/hooks/useProjects"
import { useTags } from "@/hooks/useTags"

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
  const createTag = useCreateTag()
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()

  const { data: projects = [] } = useProjects()
  const { data: allTags = [] } = useTags()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM")
  const [projectId, setProjectId] = useState<string>("none")
  const [projectSearch, setProjectSearch] = useState("")
  const [isProjectPickerOpen, setIsProjectPickerOpen] = useState(false)
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  // Subtask state
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [pendingSubtasks, setPendingSubtasks] = useState<string[]>([])
  const subtaskInputRef = useRef<HTMLInputElement>(null)

  // Tag state
  const [tagSearch, setTagSearch] = useState("")
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false)
  const [pendingTags, setPendingTags] = useState<Tag[]>([])
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState("Tag")

  const [newProjectColor, setNewProjectColor] = useState(PRESET_COLORS[0])
  const [newProjectIcon, setNewProjectIcon] = useState("Layers")

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const isCreate = mode === "create"

  // Sync state when task or mode changes (reset/initialize form)
  const [prevId, setPrevId] = useState<number | string | null>(null)
  const currentId = isCreate ? "create" : (task?.id ?? null)

  if (isOpen && currentId !== prevId) {
    setPrevId(currentId)
    
    if (task && !isCreate) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setPriority(task.priority)
      setProjectId(task.project_id?.toString() ?? "none")
      setDueDate(task.due_date ? new Date(task.due_date) : undefined)
    } else {
      setTitle("")
      setDescription("")
      setPriority("MEDIUM")
      setProjectId("none")
      setDueDate(undefined)
      setPendingSubtasks([])
      setPendingTags([])
    }
    
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
    setTagSearch("")
    setIsTagPickerOpen(false)
    setProjectSearch("")
    setIsProjectPickerOpen(false)
    setShowDeleteConfirm(false)
    setIsEditingTitle(false)
  }

  const handleUpdate = (updates: Partial<Task>) => {
    if (!task) return
    updateTask.mutate({ id: task.id, updates })
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return
    if (isCreate) {
      setPendingSubtasks(prev => [...prev, newSubtaskTitle.trim()])
      setNewSubtaskTitle("")
      setIsAddingSubtask(false)
    } else if (task) {
      try {
        await createSubtask.mutateAsync({ taskId: task.id, title: newSubtaskTitle.trim() })
        setNewSubtaskTitle("")
        setIsAddingSubtask(false)
      } catch {
        toast({ title: "Failed to add subtask", variant: "destructive" })
      }
    }
  }

  const handleToggleSubtask = (subtaskId: number, completed: boolean) => {
    updateSubtask.mutate({ id: subtaskId, updates: { completed } })
  }

  const handleDeleteSubtask = (subtaskId: number) => {
    deleteSubtask.mutate(subtaskId)
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
        project_id: projectId === "none" ? undefined : parseInt(projectId),
        due_date: dueDate?.toISOString(),
        completed: false,
        tags: pendingTags.map(t => t.name),
        subtasks: pendingSubtasks.map(stTitle => ({ title: stTitle }))
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
      setTagSearch("")
    } else if (task) {
      try {
        await attachTag.mutateAsync({ taskId: task.id, tagId })
        setTagSearch("")
      } catch {
        toast({ title: "Failed to attach tag", variant: "destructive" })
      }
    }
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
      } else if (task) {
        await attachTag.mutateAsync({ taskId: task.id, tagId: newTag.id })
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
    else if (task) detachTag.mutate({ taskId: task.id, tagId })
  }

  const handleDateSelect = (d: Date | undefined) => {
    if (!d) {
      if (isCreate) setDueDate(undefined)
      else handleUpdate({ due_date: undefined })
      return
    }
    const current = isCreate ? dueDate : (task?.due_date ? new Date(task.due_date) : undefined)
    const newDate = new Date(d)
    if (current) {
      newDate.setHours(current.getHours())
      newDate.setMinutes(current.getMinutes())
    } else {
      newDate.setHours(9)
      newDate.setMinutes(0)
    }
    if (isCreate) setDueDate(newDate)
    else handleUpdate({ due_date: newDate.toISOString() })
  }

  const handleCreateProject = async () => {
    if (!projectSearch.trim()) return
    try {
      const response = await api.post("/api/v1/projects/", { 
        name: projectSearch.trim(),
        color: newProjectColor,
        icon: newProjectIcon
      })
      const p = response.data
      if (isCreate) setProjectId(p.id.toString())
      else if (task) handleUpdate({ project_id: p.id })
      setProjectSearch("")
      setIsProjectPickerOpen(false)
      setNewProjectColor(PRESET_COLORS[0])
      setNewProjectIcon("Layers")
      toast({ title: "Project created!", variant: "success" })
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" })
    }
  }

  const currentTags = isCreate ? pendingTags : (task?.tags || [])
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
    projectId, setProjectId,
    projectSearch, setProjectSearch,
    isProjectPickerOpen, setIsProjectPickerOpen,
    dueDate, setDueDate,
    isEditingTitle, setIsEditingTitle,
    newSubtaskTitle, setNewSubtaskTitle,
    isAddingSubtask, setIsAddingSubtask,
    pendingSubtasks, setPendingSubtasks,
    subtaskInputRef,
    tagSearch, setTagSearch,
    isTagPickerOpen, setIsTagPickerOpen,
    newTagColor, setNewTagColor,
    newTagIcon, setNewTagIcon,
    newProjectColor, setNewProjectColor,
    newProjectIcon, setNewProjectIcon,
    showDeleteConfirm, setShowDeleteConfirm,
    projects,
    allTags,
    currentTags,
    filteredTags,
    canCreateTag,
    handleUpdate,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
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
