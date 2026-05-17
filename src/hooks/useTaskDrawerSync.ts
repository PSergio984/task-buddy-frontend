import { type Tag, type Subtask } from "@/lib/api"
import { 
  useAttachTag, 
  useDetachTag, 
  useCreateSubtask, 
  useUpdateSubtask, 
  useDeleteSubtask, 
  useReorderSubtasks 
} from "./useTasks"
import { useCreateTag } from "./useTags"

export interface UseTaskDrawerSyncReturn {
  syncTags: (taskId: number, currentTags: Tag[], originalTags: Tag[]) => Promise<void>
  syncSubtasks: (taskId: number, local: Subtask[], original: Subtask[]) => Promise<void>
  isSyncing: boolean
}

export function useTaskDrawerSync(): UseTaskDrawerSyncReturn {
  const attachTag = useAttachTag()
  const detachTag = useDetachTag()
  const createTag = useCreateTag()
  const createSubtask = useCreateSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtask = useDeleteSubtask()
  const reorderSubtasks = useReorderSubtasks()

  const syncTags = async (taskId: number, currentTags: Tag[], originalTags: Tag[]) => {
    const originalTagIds = originalTags.map(t => t.id)
    const currentTagIds = currentTags.map(t => t.id)
    
    // 1. Detach tags that are no longer present
    const tagsToRemove = originalTagIds.filter(id => !currentTagIds.includes(id))
    
    // 2. Separate tags to add: existing vs new (virtual)
    const existingTagsToAdd = currentTags.filter(t => t.id > 0 && !originalTagIds.includes(t.id))
    const newTagsToCreate = currentTags.filter(t => t.id < 0)

    await Promise.all([
      ...tagsToRemove.map(id => detachTag.mutateAsync({ taskId, tagId: id })),
      ...existingTagsToAdd.map(t => attachTag.mutateAsync({ taskId, tagId: t.id }))
    ])

    // 3. Create and attach new tags
    for (const t of newTagsToCreate) {
      const created = await createTag.mutateAsync({ 
        name: t.name, 
        color: t.color, 
        icon: t.icon 
      })
      await attachTag.mutateAsync({ taskId, tagId: created.id })
    }
  }

  const syncSubtasks = async (taskId: number, local: Subtask[], original: Subtask[]) => {
    const subtasksToCreate = local.filter(s => s.id < 0)
    const subtasksToUpdate = local.filter(s => s.id > 0 && (
      original.find(os => os.id === s.id)?.title !== s.title ||
      original.find(os => os.id === s.id)?.completed !== s.completed
    ))
    const subtasksToDelete = original.filter(os => !local.some(ls => ls.id === os.id))

    await Promise.all([
      ...subtasksToDelete.map(s => deleteSubtask.mutateAsync(s.id)),
      ...subtasksToUpdate.map(s => updateSubtask.mutateAsync({ id: s.id, updates: { title: s.title, completed: s.completed } }))
    ])
    
    const idMap = new Map<number, number>()
    for (const s of subtasksToCreate) {
      const newSub = await createSubtask.mutateAsync({ taskId, title: s.title, completed: s.completed })
      idMap.set(s.id, newSub.id)
    }
    
    const hasOrderingChanged = local.length !== original.length || local.some((ls, i) => ls.id !== original[i]?.id)
    
    if (hasOrderingChanged) {
      const orderedIds = local.map(s => s.id < 0 ? idMap.get(s.id)! : s.id)
      await reorderSubtasks.mutateAsync({ taskId, orderedIds })
    }
  }

  return {
    syncTags,
    syncSubtasks,
    isSyncing: attachTag.isPending || detachTag.isPending || createTag.isPending || createSubtask.isPending || updateSubtask.isPending || deleteSubtask.isPending || reorderSubtasks.isPending
  }
}
