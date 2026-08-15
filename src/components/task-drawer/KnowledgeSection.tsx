import { useEffect, useRef, useState } from "react"
import { BookOpen, Loader2, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useKnowledgeNotes } from "@/hooks/useKnowledgeNotes"
import { knowledgeApi } from "@/lib/api"
import { getErrorMessage, getHttpErrorStatus } from "@/lib/errors"
import { cn } from "@/lib/utils"

interface KnowledgeSectionProps {
  readonly taskId: number
  readonly userId: number
  readonly toast: (props: {
    title?: string
    description?: string
    variant?: "default" | "destructive" | "success"
  }) => void
}

export function KnowledgeSection({
  taskId,
  userId,
  toast,
}: Readonly<KnowledgeSectionProps>) {
  const [draft, setDraft] = useState("")
  const {
    notes,
    loadError,
    createNote,
    isCreating,
    createError,
    ask,
    isAsking,
    askError,
    answer,
  } = useKnowledgeNotes(taskId, userId)

  useEffect(() => {
    if (loadError) {
      toast({ variant: "destructive", description: getErrorMessage(loadError) })
    }
  }, [loadError, toast])

  useEffect(() => {
    if (createError) {
      toast({
        variant: "destructive",
        description: getErrorMessage(createError),
      })
    }
  }, [createError, toast])

  useEffect(() => {
    if (askError) {
      toast({ variant: "destructive", description: getErrorMessage(askError) })
    }
  }, [askError, toast])

  const handleSave = () => {
    const content = draft.trim()
    if (!content || isCreating) {
      return
    }
    createNote(content, {
      onSuccess: () => {
        setDraft("")
        toast({ variant: "success", description: "Note saved" })
      },
    })
  }

  const [feedbackPending, setFeedbackPending] = useState(false)
  const [sentRating, setSentRating] = useState<1 | -1 | null>(null)
  // Synchronous in-flight guard: two clicks within the same render frame
  // both pass the state-based check (stale closure) and would POST twice.
  const feedbackInFlightRef = useRef(false)

  const handleAsk = () => {
    if (isAsking) {
      return
    }
    setFeedbackPending(false)
    setSentRating(null)
    feedbackInFlightRef.current = false
    ask(undefined)
  }

  const handleFeedback = async (rating: 1 | -1) => {
    if (!answer || feedbackPending || feedbackInFlightRef.current) {
      return
    }
    feedbackInFlightRef.current = true
    setFeedbackPending(true)
    try {
      await knowledgeApi.feedback(answer.task_id, answer.answer_id, rating)
      setSentRating(rating)
    } catch (error) {
      if (getHttpErrorStatus(error) === 429) {
        toast({
          variant: "destructive",
          description: "Feedback rate limit reached, try again in a moment.",
        })
      } else {
        toast({
          variant: "destructive",
          description: getErrorMessage(error),
        })
      }
    } finally {
      feedbackInFlightRef.current = false
      setFeedbackPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="knowledge-notes"
          className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground/40 uppercase"
        >
          <BookOpen className="h-3 w-3" />
          Notes
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAsk}
          disabled={isAsking}
          className="h-7 gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 text-[10px] font-black tracking-widest text-primary uppercase hover:bg-primary/20"
        >
          {isAsking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          What do I need
        </Button>
      </div>

      {answer && (
        <div
          data-testid="knowledge-answer"
          className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-sm leading-relaxed text-foreground/90">
            {answer.answer}
          </p>
          <div className="flex items-center gap-1.5 border-t border-primary/10 pt-2.5">
            <span className="mr-1 text-[10px] font-black tracking-widest text-foreground/40 uppercase">
              Was this helpful?
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-pressed={sentRating === 1}
              disabled={feedbackPending || sentRating !== null}
              onClick={() => handleFeedback(1)}
              aria-label="Helpful"
              className={cn(
                "h-7 w-7 rounded-lg",
                sentRating === 1 && "bg-primary/20 text-primary"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-pressed={sentRating === -1}
              disabled={feedbackPending || sentRating !== null}
              onClick={() => handleFeedback(-1)}
              aria-label="Not helpful"
              className={cn(
                "h-7 w-7 rounded-lg",
                sentRating === -1 && "bg-destructive/20 text-destructive"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </Button>
          </div>
          {answer.citations.length > 0 && (
            <div className="space-y-1.5 border-t border-primary/10 pt-3">
              {answer.citations.map((citation, index) => (
                <p
                  key={`${citation.knowledge_id}-${index}`}
                  className="text-xs leading-relaxed text-foreground/50"
                >
                  <span className="mr-1.5 text-primary">
                    [{citation.knowledge_id}]
                  </span>
                  {citation.chunk_text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Textarea
          id="knowledge-notes"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this task..."
          className="min-h-[80px] resize-none border-white/5 bg-white/5 text-sm text-foreground placeholder:text-foreground/30"
          disabled={isCreating}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isCreating || draft.trim() === ""}
            className="h-8 rounded-lg px-3 text-[10px] font-black tracking-widest uppercase"
          >
            {isCreating ? "Saving..." : "Save note"}
          </Button>
        </div>
      </div>

      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm leading-relaxed text-foreground/70"
            >
              {note.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
