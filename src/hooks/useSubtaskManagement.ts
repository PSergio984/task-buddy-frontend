import { useState, useRef, useCallback } from "react"
import { type Subtask } from "@/lib/api"

export interface UseSubtaskManagementReturn {
  newSubtaskTitle: string
  setNewSubtaskTitle: (title: string) => void
  isAddingSubtask: boolean
  setIsAddingSubtask: (isAdding: boolean) => void
  localSubtasks: Subtask[]
  setLocalSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>
  pendingSubtasks: { id: string; title: string }[]
  setPendingSubtasks: React.Dispatch<React.SetStateAction<{ id: string; title: string }[]>>
  subtaskInputRef: React.RefObject<HTMLInputElement | null>
  handleAddSubtask: () => void
  handleToggleSubtask: (subtaskId: number, completed: boolean) => void
  handleDeleteSubtask: (subtaskId: number) => void
  handleReorderSubtasks: (newSubtasks: (Subtask | { id: string; title: string })[]) => void
  resetSubtasks: (task: { subtasks?: Subtask[] } | null) => void
}

export function useSubtaskManagement(isCreate: boolean, taskId: number | undefined): UseSubtaskManagementReturn {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([])
  const [pendingSubtasks, setPendingSubtasks] = useState<{ id: string; title: string }[]>([])
  const subtaskInputRef = useRef<HTMLInputElement | null>(null)

  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim()) return
    if (isCreate) {
      setPendingSubtasks(prev => [...prev, { id: `pending-${Math.random().toString(36).substring(2, 11)}`, title: newSubtaskTitle.trim() }])
    } else {
      const newSub: Subtask = {
        id: -Math.floor(Math.random() * 1000000),
        task_id: taskId || 0,
        title: newSubtaskTitle.trim(),
        completed: false,
        created_at: new Date().toISOString()
      }
      setLocalSubtasks(prev => [...prev, newSub])
    }
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
  }, [newSubtaskTitle, isCreate, taskId])

  const handleToggleSubtask = useCallback((subtaskId: number, completed: boolean) => {
    setLocalSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, completed } : s))
  }, [])

  const handleDeleteSubtask = useCallback((subtaskId: number) => {
    setLocalSubtasks(prev => prev.filter(s => s.id !== subtaskId))
  }, [])

  const handleReorderSubtasks = useCallback((newSubtasks: (Subtask | { id: string; title: string })[]) => {
    if (isCreate) {
      setPendingSubtasks(newSubtasks as unknown as { id: string; title: string }[])
    } else {
      setLocalSubtasks(newSubtasks as unknown as Subtask[])
    }
  }, [isCreate])

  const resetSubtasks = useCallback((task: { subtasks?: Subtask[] } | null) => {
    setLocalSubtasks(!isCreate && task ? (task.subtasks || []) : [])
    setPendingSubtasks([])
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
  }, [isCreate])

  return {
    newSubtaskTitle, setNewSubtaskTitle,
    isAddingSubtask, setIsAddingSubtask,
    localSubtasks, setLocalSubtasks,
    pendingSubtasks, setPendingSubtasks,
    subtaskInputRef,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleReorderSubtasks,
    resetSubtasks
  }
}
