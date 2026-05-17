import { useState, useCallback, useMemo } from "react"
import { type Tag } from "@/lib/api"
import { PRESET_COLORS } from "@/components/color-icon-picker"
import { useToast } from "@/hooks/use-toast"

export interface UseTagManagementReturn {
  tagSearch: string
  setTagSearch: (val: string) => void
  isTagPickerOpen: boolean
  setIsTagPickerOpen: (val: boolean) => void
  localTags: Tag[]
  setLocalTags: (tags: Tag[]) => void
  pendingTags: Tag[]
  setPendingTags: (tags: Tag[]) => void
  newTagColor: string
  setNewTagColor: (val: string) => void
  newTagIcon: string
  setNewTagIcon: (val: string) => void
  currentTags: Tag[]
  filteredTags: Tag[]
  canCreateTag: boolean
  handleAttachTag: (tagId: number) => void
  handleCreateAndAttachTag: () => Promise<void>
  handleDetachTag: (tagId: number) => void
  resetTags: (task: { tags?: Tag[] } | null) => void
  localUnsavedTags: { name: string, color: string, icon: string, tempId: number }[]
}

export function useTagManagement(
  isCreate: boolean, 
  allTags: Tag[], 
  toast: ReturnType<typeof useToast>["toast"]
): UseTagManagementReturn {
  const [tagSearch, setTagSearch] = useState("")
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false)
  const [localTags, setLocalTags] = useState<Tag[]>([])
  const [pendingTags, setPendingTags] = useState<Tag[]>([])
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState("Tag")
  const [localUnsavedTags, setLocalUnsavedTags] = useState<{ name: string, color: string, icon: string, tempId: number }[]>([])

  const currentTags = isCreate ? pendingTags : localTags

  const handleAttachTag = useCallback((tagId: number) => {
    const tag = allTags.find(t => t.id === tagId)
    if (!tag) return
    if (isCreate) {
      setPendingTags(prev => [...prev, tag])
    } else if (!localTags.some(t => t.id === tagId)) {
      setLocalTags(prev => [...prev, tag])
    }
    setTagSearch("")
  }, [allTags, isCreate, localTags])

  const handleCreateAndAttachTag = async () => {
    if (!tagSearch.trim()) return
    
    // Check if tag already exists in allTags or localUnsavedTags
    const existsInAll = allTags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase())
    const existsInUnsaved = localUnsavedTags.some(t => t.name.toLowerCase() === tagSearch.trim().toLowerCase())
    
    if (existsInAll || existsInUnsaved) {
      toast({ title: "Tag already exists", variant: "warning" })
      return
    }

    const tempId = -(localUnsavedTags.length + 1)
    const newVirtualTag: Tag = {
      id: tempId,
      name: tagSearch.trim(),
      color: newTagColor,
      icon: newTagIcon,
      user_id: 0, // placeholder
      created_at: new Date().toISOString()
    }

    setLocalUnsavedTags(prev => [...prev, { 
      name: tagSearch.trim(), 
      color: newTagColor, 
      icon: newTagIcon, 
      tempId 
    }])

    if (isCreate) setPendingTags(prev => [...prev, newVirtualTag])
    else setLocalTags(prev => [...prev, newVirtualTag])
    
    setTagSearch("")
    setIsTagPickerOpen(false)
    setNewTagColor(PRESET_COLORS[0])
    setNewTagIcon("Tag")
  }

  const handleDetachTag = useCallback((tagId: number) => {
    if (isCreate) setPendingTags(prev => prev.filter(t => t.id !== tagId))
    else setLocalTags(prev => prev.filter(t => t.id !== tagId))

    if (tagId < 0) {
      setLocalUnsavedTags(prev => prev.filter(t => t.tempId !== tagId))
    }
  }, [isCreate])

  const resetTags = useCallback((task: { tags?: Tag[] } | null) => {
    setLocalTags(!isCreate && task ? (task.tags || []) : [])
    setPendingTags([])
    setLocalUnsavedTags([])
    setTagSearch("")
    setIsTagPickerOpen(false)
    setNewTagColor(PRESET_COLORS[0])
    setNewTagIcon("Tag")
  }, [isCreate])

  const filteredTags = useMemo(() => allTags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
    !currentTags?.some(tt => tt.id === t.id)
  ), [allTags, tagSearch, currentTags])

  const canCreateTag = !!tagSearch.trim() && !allTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase())

  return {
    tagSearch, setTagSearch,
    isTagPickerOpen, setIsTagPickerOpen,
    localTags, setLocalTags,
    pendingTags, setPendingTags,
    newTagColor, setNewTagColor,
    newTagIcon, setNewTagIcon,
    currentTags,
    filteredTags,
    canCreateTag,
    handleAttachTag,
    handleCreateAndAttachTag,
    handleDetachTag,
    resetTags,
    localUnsavedTags
  }
}
