import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  knowledgeApi,
  type KnowledgeAskResponse,
  type KnowledgeCitation,
  type KnowledgeNote,
} from "@/lib/api"
import {
  streamKnowledgeAsk,
  type KnowledgeAskRelevance,
} from "@/lib/knowledge-stream"

export type KnowledgeAskDraft = {
  readonly text: string
  readonly citations: KnowledgeCitation[]
  readonly hasTokens: boolean
  readonly relevance: KnowledgeAskRelevance | null
  readonly explanation: string | null
}

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

  const [answer, setAnswer] = useState<KnowledgeAskResponse | null>(null)
  const [answerDraft, setAnswerDraft] = useState<KnowledgeAskDraft | null>(null)
  const [isAsking, setIsAsking] = useState(false)
  const [askError, setAskError] = useState<Error | null>(null)
  const askAbortRef = useRef<AbortController | null>(null)

  // Abort the in-flight stream on unmount or task switch; a superseded ask
  // aborts the previous one inside `ask` itself.
  useEffect(() => {
    return () => {
      askAbortRef.current?.abort()
      askAbortRef.current = null
      setIsAsking(false)
      setAnswerDraft(null)
    }
  }, [taskId])

  const ask = useCallback(
    async (query?: string) => {
      askAbortRef.current?.abort()
      const controller = new AbortController()
      askAbortRef.current = controller

      let draft: KnowledgeAskDraft = {
        text: "",
        citations: [],
        hasTokens: false,
        relevance: null,
        explanation: null,
      }
      setAnswer(null)
      setAnswerDraft(draft)
      setAskError(null)
      setIsAsking(true)

      try {
        await streamKnowledgeAsk(
          taskId,
          query,
          (event) => {
            switch (event.type) {
              case "citations":
                draft = { ...draft, citations: event.citations }
                setAnswerDraft(draft)
                break
              case "token":
                draft = {
                  ...draft,
                  text: draft.text + event.text,
                  hasTokens: true,
                }
                setAnswerDraft(draft)
                break
              case "verdict":
                draft = {
                  ...draft,
                  relevance: event.relevance,
                  explanation: event.explanation,
                }
                break
              case "done":
                setAnswer({
                  task_id: event.done.task_id,
                  answer: draft.text,
                  citations: draft.citations,
                  model: event.done.model,
                  prompt_tokens: event.done.prompt_tokens,
                  completion_tokens: event.done.completion_tokens,
                  total_tokens: event.done.total_tokens,
                  cost_usd: event.done.cost_usd,
                  response_time_ms: event.done.response_time_ms,
                  judge_verdict: draft.relevance,
                  judge_explanation: draft.explanation,
                  answer_id: event.done.answer_id,
                })
                setAnswerDraft(null)
                break
              case "error":
                // The stream client throws after delivering this event;
                // the catch below surfaces it.
                break
            }
          },
          controller.signal
        )
      } catch (error) {
        if (!controller.signal.aborted) {
          setAnswerDraft(null)
          setAskError(
            error instanceof Error
              ? error
              : new Error("An unexpected error occurred")
          )
        }
      } finally {
        // A superseded stream must not clear the newer request's state.
        if (askAbortRef.current === controller) {
          askAbortRef.current = null
          setIsAsking(false)
        }
      }
    },
    [taskId]
  )

  return {
    notes: notesQuery.data ?? [],
    isLoading: notesQuery.isLoading,
    loadError: notesQuery.error ?? null,
    createNote: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error ?? null,
    ask,
    isAsking,
    askError,
    answer,
    answerDraft,
  }
}
