import { useState, useCallback, useMemo } from "react"
import { type Tag } from "@/lib/api"
import { PRESET_COLORS } from "@/components/color-icon-picker"
import { type UseMutationResult } from "@tanstack/react-query"
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
}

type CreateTagMutation = UseMutationResult<
  Tag,
  Error,
  { name: string; color?: string; icon?: string }
>

export function useTagManagement(
  isCreate: boolean, 
  allTags: Tag[], 
  createTag: CreateTagMutation, 
  toast: ReturnType<typeof useToast>["toast"]
): UseTagManagementReturn {
  const [tagSearch, setTagSearch] = useState("")
  const [isTagPickerOpen, setIsTagPickerOpen] = useState(false)
  const [localTags, setLocalTags] = useState<Tag[]>([])
  const [pendingTags, setPendingTags] = useState<Tag[]>([])
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [newTagIcon, setNewTagIcon] = useState("Tag")

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
    try {
      const newTag = await createTag.mutateAsync({ 
        name: tagSearch.trim(),
        color: newTagColor,
        icon: newTagIcon
      })
      if (isCreate) setPendingTags(prev => [...prev, newTag])
      else setLocalTags(prev => [...prev, newTag])
      
      setTagSearch("")
      setIsTagPickerOpen(false)
      setNewTagColor(PRESET_COLORS[0])
      setNewTagIcon("Tag")
    } catch {
      toast({ title: "Failed to create tag", variant: "destructive" })
    }
  }

  const handleDetachTag = useCallback((tagId: number) => {
    if (isCreate) setPendingTags(prev => prev.filter(t => t.id !== tagId))
    else setLocalTags(prev => prev.filter(t => t.id !== tagId))
  }, [isCreate])

  const resetTags = useCallback((task: { tags?: Tag[] } | null) => {
    setLocalTags(!isCreate && task ? (task.tags || []) : [])
    setPendingTags([])
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
    resetTags
  }
}
