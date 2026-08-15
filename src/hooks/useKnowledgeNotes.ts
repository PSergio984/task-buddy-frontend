import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { knowledgeApi, type KnowledgeNote } from "@/lib/api"

export function useKnowledgeNotes(taskId: number, userId: number) {
  const queryClient = useQueryClient()

  const notesQuery = useQuery({
    // User-scoped: the query is persisted to IndexedDB (24h), and without
    // the userId two accounts on a shared browser would see each other's
    // notes/answers before the refetch lands.
    queryKey: ["knowledge", "notes", userId, taskId],
    queryFn: () => knowledgeApi.list(taskId),
    enabled: taskId > 0,
  })

  const createMutation = useMutation({
    mutationFn: (content: string) => knowledgeApi.create(taskId, content),
    onSuccess: (saved: KnowledgeNote) => {
      queryClient.setQueryData<KnowledgeNote[]>(
        ["knowledge", "notes", userId, taskId],
        (prev) => [saved, ...(prev ?? [])]
      )
    },
  })

  const askMutation = useMutation({
    mutationFn: (query?: string) => knowledgeApi.ask(taskId, query),
  })

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    loadError: notesQuery.error ?? null,
    createNote: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error ?? null,
    ask: askMutation.mutate,
    isAsking: askMutation.isPending,
    askError: askMutation.error ?? null,
    answer: askMutation.data ?? null,
  }
}
