import { useEffect, useRef, useState } from "react"
import { Check, ListTree, Loader2, Sparkles, X } from "lucide-react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  BudgetBanner,
  CreatedCardRow,
  ErrorBanner,
  LoadingSkeleton,
  NumberChip,
  OfflineBanner,
  RetryFailedButton,
  SheetHeaderBlock,
  StartOverButton,
  SubtaskListEditor,
} from "@/components/proposal-sheet-ui"
import { updateSubtaskAt } from "@/components/proposal-cards"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { CharacterCounter } from "@/components/ui/character-counter"
import { useToast } from "@/hooks/use-toast"
import { useIsOnline } from "@/hooks/useIsOnline"
import { cn } from "@/lib/utils"
import {
  type Task,
  breakdownApi,
  createIdempotencyKey,
  tasksApi,
} from "@/lib/api"
import {
  type DraftCard,
  commitBreakdownCards,
  committableCards,
  replaceCard,
  toDraftCard,
} from "./breakdown-cards"

const INPUT_CHAR_LIMIT = 10_000

type Phase = "input" | "loading" | "review"

/**
 * Maps a propose() failure to the sheet's banners. Two different 429s: the
 * daily AI budget (backend detail) dead-ends until tomorrow; slowapi's
 * per-minute RATE_LIMIT_BREAKDOWN is a retryable "slow down" — same status,
 * very different meaning.
 */
function classifyProposeError(err: unknown): {
  budgetExhausted: boolean
  message: string | null
} {
  const status = (err as { response?: { status?: number } }).response?.status
  const detail = (err as { response?: { data?: { detail?: unknown } } })
    .response?.data?.detail
  if (
    status === 429 &&
    typeof detail === "string" &&
    /daily ai usage limit/i.test(detail)
  ) {
    return { budgetExhausted: true, message: null }
  }
  if (status === 429) {
    return {
      budgetExhausted: false,
      message: "Too many attempts — wait a moment, then try again.",
    }
  }
  return {
    budgetExhausted: false,
    message:
      status === 503
        ? "The AI service isn't available right now. Try again later."
        : "Something went wrong. Please try again.",
  }
}

interface BreakdownSheetProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  /** Pre-filled when opened via a task's "Break this down" action. */
  readonly contextTask?: Task | null
  /** Fallback project for commits when there is no context task (current UI project). */
  readonly projectId?: number
}

export function BreakdownSheet({
  isOpen,
  onClose,
  contextTask = null,
  projectId,
}: BreakdownSheetProps) {
  const { toast } = useToast()
  const isOnline = useIsOnline()

  const [phase, setPhase] = useState<Phase>("input")
  const [text, setText] = useState("")
  const [cards, setCards] = useState<DraftCard[]>([])
  const [refineText, setRefineText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [budgetExhausted, setBudgetExhausted] = useState(false)
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  // The refine loop re-sends the ORIGINAL input plus the focus card's stable
  // number (and current title as prompt context), so the model regenerates one
  // card with full context instead of hallucinating.
  const originalTextRef = useRef("")
  const lastRequestRef = useRef<{
    text: string
    focus?: { number: number; title?: string }
  } | null>(null)
  const cardNumberRef = useRef(1)
  // Idempotency key per request signature — a retry of the SAME request
  // replays the backend's cached response instead of billing a second LLM
  // call; a different request mints a fresh one (same key + different
  // body → 422).
  const proposeKeyRef = useRef<{ source: string; key: string } | null>(null)

  useEffect(() => {
    if (isOpen) cardNumberRef.current = 1
  }, [isOpen])

  // The sheet stays mounted (MainLayout), so a 429 flag must not dead-end
  // a reopened sheet — clear it on the closed→open transition (render-time
  // reset; a fresh attempt re-checks the backend anyway).
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setBudgetExhausted(false)
    }
  }

  const reset = () => {
    setPhase("input")
    setText("")
    setCards([])
    setRefineText("")
    setError(null)
    setBudgetExhausted(false)
    setEmptyNotice(null)
    originalTextRef.current = ""
    lastRequestRef.current = null
    proposeKeyRef.current = null
  }

  async function requestBreakdown(
    requestText: string,
    focus?: { number: number; title?: string }
  ) {
    setPhase("loading")
    setError(null)
    setBudgetExhausted(false)
    setEmptyNotice(null)
    lastRequestRef.current = { text: requestText, focus }

    const contextTaskId =
      focus === undefined && contextTask ? contextTask.id : undefined
    const source = JSON.stringify({ requestText, contextTaskId, focus })
    const key =
      proposeKeyRef.current?.source === source
        ? proposeKeyRef.current.key
        : createIdempotencyKey()
    proposeKeyRef.current = { source, key }

    try {
      const response = await breakdownApi.propose(requestText, {
        contextTaskId,
        focusTaskNumber: focus?.number,
        focusTaskTitle: focus?.title,
        idempotencyKey: key,
      })

      // A 2xx response is cached under this key server-side — the response
      // arrived, so the key has done its job. Clear it: a later retry must
      // mint a fresh key to actually re-run the breakdown, not replay this
      // cached result.
      proposeKeyRef.current = null

      if (response.tasks.length > 0) {
        const newCards: DraftCard[] = response.tasks.map((task) =>
          toDraftCard(task, cardNumberRef.current++)
        )
        setCards((prev) =>
          focus === undefined
            ? newCards
            : replaceCard(prev, focus.number, newCards)
        )
        setPhase("review")
        return
      }
      if (response.reason) {
        // Parse/infra degrade — retryable, distinct from "no tasks found".
        setError("The breakdown failed. Please try again.")
      } else {
        setEmptyNotice(
          "I couldn't find any tasks in that. Try pasting your to-dos."
        )
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response
        ?.status
      // A definitive error response means the server-side call is done and
      // non-2xx responses aren't cached — the key is spent; a retry mints a
      // fresh one. Keep it for transport loss (undefined), 409, and gateway
      // 502/504 — the original may still be in-flight behind the proxy and
      // only the same key can attach to it.
      if (
        status !== undefined &&
        status !== 409 &&
        status !== 502 &&
        status !== 504
      ) {
        proposeKeyRef.current = null
      }
      const failure = classifyProposeError(err)
      if (failure.budgetExhausted) {
        setBudgetExhausted(true)
      } else {
        setError(failure.message)
      }
    }
    setPhase(focus === undefined ? "input" : "review")
  }

  const handleBreakDownClick = () => {
    if (!text.trim()) return
    originalTextRef.current = text.trim()
    void requestBreakdown(text.trim())
  }

  const handleRefineSubmit = () => {
    const match = /#(\d+)/.exec(refineText)
    if (!match) return
    const target = Number(match[1])
    const focusCard = cards.find((card) => card.number === target)
    if (!focusCard || !originalTextRef.current) return
    // Target by stable chip number; the title only rides along as context
    // (clamped to the wire contract's max length).
    void requestBreakdown(originalTextRef.current, {
      number: target,
      title: focusCard.title.slice(0, 200),
    })
    setRefineText("")
  }

  const updateCard = (
    number: number,
    updater: (card: DraftCard) => DraftCard
  ) => {
    setCards((prev) =>
      prev.map((card) => (card.number === number ? updater(card) : card))
    )
  }

  const committableCount = committableCards(cards).length
  // Mirrors committableCards — a blank-titled failure isn't retryable, so
  // it must not keep "Retry failed" enabled for a zero-target commit.
  const hasFailed = cards.some(
    (c) => c.status === "failed" && c.accepted && c.title.trim() !== ""
  )
  const isCreating = cards.some((c) => c.status === "creating")
  const acceptedSubtaskCount = committableCards(cards).reduce(
    (sum, card) =>
      sum + card.subtasks.filter((s) => s.accepted && s.title.trim()).length,
    0
  )

  async function commit() {
    setIsCommitting(true)
    try {
      const { created, failed } = await commitBreakdownCards(
        cards,
        (data, idempotencyKey) => tasksApi.create(data, { idempotencyKey }),
        (number, status) => updateCard(number, (card) => ({ ...card, status })),
        // Persist the card's key so a retried commit replays, not re-creates.
        (number, idempotencyKey) =>
          updateCard(number, (card) => ({ ...card, idempotencyKey })),
        contextTask?.project_id ?? projectId
      )
      // Cumulative — a retry batch must report all created tasks, not just
      // the ones it retried.
      const alreadyCreated = cards.filter((c) => c.status === "created")
      const total = alreadyCreated.length + created
      if (failed === 0) {
        const subtasks =
          alreadyCreated.reduce(
            (sum, card) =>
              sum +
              card.subtasks.filter((s) => s.accepted && s.title.trim()).length,
            0
          ) + acceptedSubtaskCount
        toast({
          title: "Tasks added",
          description: `Added ${total} task${total === 1 ? "" : "s"} · ${subtasks} subtask${subtasks === 1 ? "" : "s"}.`,
          variant: "success",
        })
        // Back to a clean input — reopening shouldn't show stale "created" cards.
        reset()
        onClose()
      } else if (created > 0) {
        toast({
          title: `${total} task${total === 1 ? "" : "s"} added`,
          description: `${failed} failed. Use "Retry failed" below.`,
          variant: "destructive",
        })
      }
    } finally {
      // An unexpected throw must not wedge the commit + Start Over buttons.
      setIsCommitting(false)
    }
  }

  const handleRetryRequest = () => {
    if (!lastRequestRef.current) return
    void requestBreakdown(
      lastRequestRef.current.text,
      lastRequestRef.current.focus
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-xl"
      >
        <SheetHeaderBlock
          icon={<ListTree className="h-4 w-4 text-primary" />}
          title="Break Down"
        >
          {contextTask && phase !== "review" ? (
            <p className="text-xs text-muted-foreground">
              Context: {contextTask.title}
            </p>
          ) : null}
        </SheetHeaderBlock>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
          {!isOnline ? (
            <OfflineBanner message="You're offline — the breakdown bot needs a connection." />
          ) : budgetExhausted ? (
            <BudgetBanner />
          ) : error ? (
            <ErrorBanner message={error} onRetry={handleRetryRequest} />
          ) : emptyNotice ? (
            <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              {emptyNotice}
            </p>
          ) : null}

          {phase === "input" ? (
            <InputSection
              text={text}
              setText={setText}
              disabled={!isOnline || budgetExhausted}
              onSubmit={handleBreakDownClick}
            />
          ) : null}

          {phase === "loading" ? (
            <LoadingSkeleton label="Breaking down your text…" />
          ) : null}

          {phase === "review" ? (
            <>
              <StartOverButton onClick={reset} disabled={isCommitting} />
              <div className="flex flex-col gap-3">
                {cards.map((card) => (
                  <DraftCardView
                    key={card.number}
                    card={card}
                    disabled={isCommitting}
                    onChange={updateCard}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {phase === "review" ? (
          <div className="shrink-0 border-t border-white/5 px-6 py-4">
            <RefineInput
              value={refineText}
              setValue={setRefineText}
              disabled={!isOnline || isCommitting || budgetExhausted}
              onSubmit={handleRefineSubmit}
            />
            {/* Commit stays visible while anything is committable; after a
                partial success only the retry affordance remains so failed
                cards are always recoverable. */}
            {committableCount > 0 || isCreating ? (
              <Button
                id="breakdown-commit-btn"
                className="mt-3 w-full"
                onClick={() => void commit()}
                disabled={
                  !isOnline ||
                  isCommitting ||
                  committableCount === 0 ||
                  isCreating
                }
              >
                {isCommitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Add {committableCount} task{committableCount === 1 ? "" : "s"} ·{" "}
                {acceptedSubtaskCount} subtask
                {acceptedSubtaskCount === 1 ? "" : "s"}
              </Button>
            ) : null}
            <RetryFailedButton
              show={hasFailed && !isCommitting}
              hasCommittable={committableCount > 0}
              disabled={!isOnline}
              onClick={() => void commit()}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

interface InputSectionProps {
  readonly text: string
  readonly setText: (value: string) => void
  readonly disabled: boolean
  readonly onSubmit: () => void
}

function InputSection({
  text,
  setText,
  disabled,
  onSubmit,
}: InputSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <Textarea
        id="breakdown-input"
        placeholder="Type or paste your tasks — one line or a whole brain-dump…"
        value={text}
        maxLength={INPUT_CHAR_LIMIT}
        onChange={(event) => setText(event.target.value)}
        className="min-h-40 resize-none"
        disabled={disabled}
      />
      <div className="flex items-center justify-between">
        <CharacterCounter current={text.length} limit={INPUT_CHAR_LIMIT} />
        <Button
          id="breakdown-submit-btn"
          onClick={onSubmit}
          disabled={disabled || !text.trim()}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Break down
        </Button>
      </div>
    </div>
  )
}

function RefineInput({
  value,
  setValue,
  disabled,
  onSubmit,
}: Readonly<{
  value: string
  setValue: (value: string) => void
  disabled: boolean
  onSubmit: () => void
}>) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <Input
        id="breakdown-refine-input"
        placeholder='Refine, e.g. "split #2 more"'
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled}
      />
    </form>
  )
}

function DraftCardView({
  card,
  disabled = false,
  onChange,
}: Readonly<{
  card: DraftCard
  /** Locks committability-changing controls while a commit runs. */
  disabled?: boolean
  onChange: (number: number, updater: (card: DraftCard) => DraftCard) => void
}>) {
  if (card.status === "created") {
    return <CreatedCardRow number={card.number} title={card.title} />
  }

  const isRejected = !card.accepted

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3 transition-opacity",
        isRejected && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={card.accepted}
          disabled={disabled}
          aria-label={`Include task ${card.number}`}
          onCheckedChange={(checked) =>
            onChange(card.number, (prev) => ({
              ...prev,
              accepted: checked === true,
            }))
          }
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <NumberChip number={card.number} />
            {card.effortMinutes != null ? (
              <span className="text-xs text-muted-foreground">
                ~{card.effortMinutes}m
              </span>
            ) : null}
          </div>
          <Input
            value={card.title}
            disabled={disabled}
            aria-label={`Task ${card.number} title`}
            onChange={(event) =>
              onChange(card.number, (prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
            className="mt-1.5 border-transparent bg-transparent px-0 font-medium shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-2"
          />

          <SubtaskListEditor
            cardNumber={card.number}
            subtasks={card.subtasks}
            disabled={disabled}
            onToggle={(index, accepted) =>
              onChange(
                card.number,
                updateSubtaskAt<DraftCard>(index, (item) => ({
                  ...item,
                  accepted,
                }))
              )
            }
            onEditTitle={(index, title) =>
              onChange(
                card.number,
                updateSubtaskAt<DraftCard>(index, (item) => ({
                  ...item,
                  title,
                }))
              )
            }
            onRemove={(index) =>
              onChange(card.number, (prev) => ({
                ...prev,
                subtasks: prev.subtasks.filter(
                  (_, itemIndex) => itemIndex !== index
                ),
              }))
            }
            onAdd={() =>
              onChange(card.number, (prev) => ({
                ...prev,
                subtasks: [...prev.subtasks, { title: "", accepted: true }],
              }))
            }
          />
        </div>
        {card.status === "failed" ? (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-destructive">
            <X className="h-3.5 w-3.5" />
            Failed
          </span>
        ) : card.status === "creating" ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  )
}
