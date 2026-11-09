import { useEffect, useRef, useState } from "react"
import type { DragEvent, RefObject } from "react"
import { Check, FileUp, Loader2, Sparkles, Trash2, X } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CharacterCounter } from "@/components/ui/character-counter"
import { useToast } from "@/hooks/use-toast"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useProjects } from "@/hooks/useProjects"
import { cn } from "@/lib/utils"
import {
  createIdempotencyKey,
  type TaskPriority,
  importApi,
  tasksApi,
} from "@/lib/api"
import { TASK_DESCRIPTION_LIMIT, TASK_TITLE_LIMIT } from "./proposal-cards"
import {
  IMPORT_TEXT_LIMIT,
  type ImportDraftCard,
  committableCards,
  commitImportCards,
  editImportCard,
  readImportFile,
  toImportDraftCard,
  validateImportText,
} from "./import-cards"

type Phase = "input" | "loading" | "review"

interface ImportSheetProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  /** Fallback project for proposals with no suggestion (current UI project). */
  readonly projectId?: number
}

export function ImportSheet({ isOpen, onClose, projectId }: ImportSheetProps) {
  const { toast } = useToast()
  const isOnline = useIsOnline()
  const { data: projects = [] } = useProjects()

  const [phase, setPhase] = useState<Phase>("input")
  const [text, setText] = useState("")
  const [cards, setCards] = useState<ImportDraftCard[]>([])
  const [error, setError] = useState<string | null>(null)
  const [inputError, setInputError] = useState<string | null>(null)
  const [budgetExhausted, setBudgetExhausted] = useState(false)
  const [featureDisabled, setFeatureDisabled] = useState(false)
  const [emptyNotice, setEmptyNotice] = useState<string | null>(null)
  const [isCommitting, setIsCommitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const lastRequestRef = useRef<string | null>(null)
  // Idempotency key per extract source text — a retry of the SAME notes
  // replays the backend's cached response instead of billing a second LLM
  // call; changed text mints a fresh one (same key + different body → 422).
  const extractKeyRef = useRef<{ source: string; key: string } | null>(null)
  const cardNumberRef = useRef(1)
  const dragDepthRef = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) cardNumberRef.current = 1
  }, [isOpen])

  // The sheet stays mounted (MainLayout), so a 429/404 flag must not
  // dead-end a reopened sheet — clear it on the closed→open transition
  // (render-time reset; a fresh attempt re-checks the backend anyway).
  const [wasOpen, setWasOpen] = useState(isOpen)
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen)
    if (isOpen) {
      setBudgetExhausted(false)
      setFeatureDisabled(false)
    }
  }

  const reset = () => {
    setPhase("input")
    setText("")
    setCards([])
    setError(null)
    setInputError(null)
    setBudgetExhausted(false)
    setFeatureDisabled(false)
    setEmptyNotice(null)
    lastRequestRef.current = null
    dragDepthRef.current = 0
    setIsDragging(false)
  }

  async function requestExtract(requestText: string) {
    setPhase("loading")
    setError(null)
    setBudgetExhausted(false)
    setFeatureDisabled(false)
    setEmptyNotice(null)
    lastRequestRef.current = requestText

    const key =
      extractKeyRef.current?.source === requestText
        ? extractKeyRef.current.key
        : createIdempotencyKey()
    extractKeyRef.current = { source: requestText, key }

    try {
      const response = await importApi.extract(requestText, key)

      if (response.proposals.length === 0) {
        if (response.reason) {
          // Parse/infra degrade — retryable, distinct from "no tasks found".
          setError("The import failed. Please try again.")
        } else {
          setEmptyNotice(
            "I couldn't find any tasks in those notes. Try pasting your to-dos."
          )
        }
      } else {
        setCards(
          response.proposals.map((proposal) =>
            toImportDraftCard(proposal, cardNumberRef.current++, projectId)
          )
        )
        setPhase("review")
        return
      }
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response
        ?.status
      const detail = (err as { response?: { data?: { detail?: unknown } } })
        .response?.data?.detail
      if (status === 429) {
        // Two different 429s: the daily AI budget (backend detail) dead-ends
        // until tomorrow; slowapi's per-minute RATE_LIMIT_IMPORT is a
        // retryable "slow down" — same status, very different meaning.
        if (
          typeof detail === "string" &&
          /daily ai usage limit/i.test(detail)
        ) {
          setBudgetExhausted(true)
        } else {
          setError("Too many attempts — wait a moment, then try again.")
        }
      } else if (status === 404) {
        // IMPORT_ENABLED=false — no retry can fix a disabled feature.
        setFeatureDisabled(true)
      } else {
        setError(
          status === 503 || status === undefined
            ? "The import service isn't available right now. Try again later."
            : "Something went wrong. Please try again."
        )
      }
    }
    setPhase("input")
  }

  const handleExtractClick = () => {
    const validationError = validateImportText(text)
    if (validationError) {
      setInputError(validationError)
      return
    }
    void requestExtract(text.trim())
  }

  const inputDisabled = !isOnline || budgetExhausted || featureDisabled

  const handleFile = async (file: File | undefined) => {
    if (!file || inputDisabled) return
    try {
      const fileText = await readImportFile(file)
      setText(fileText)
      setInputError(null)
      setError(null)
      setEmptyNotice(null)
    } catch (err) {
      setInputError(
        err instanceof Error ? err.message : "Couldn't read that file."
      )
    }
  }

  // Counter-depth tracking so the highlight doesn't flicker over children.
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (inputDisabled) return
    dragDepthRef.current += 1
    setIsDragging(true)
  }
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDragging(false)
  }
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragDepthRef.current = 0
    setIsDragging(false)
    if (inputDisabled) return
    void handleFile(event.dataTransfer.files[0])
  }

  const updateCard = (
    number: number,
    updater: (card: ImportDraftCard) => ImportDraftCard
  ) => {
    setCards((prev) =>
      prev.map((card) => (card.number === number ? updater(card) : card))
    )
  }

  const removeCard = (number: number) => {
    setCards((prev) => prev.filter((card) => card.number !== number))
  }

  const committable = committableCards(cards)
  // Only included failures count — an unchecked failed card isn't a target.
  const hasFailed = cards.some((c) => c.status === "failed" && c.included)
  const isCreating = cards.some((c) => c.status === "creating")
  const acceptedSubtaskCount = committable.reduce(
    (sum, card) =>
      sum + card.subtasks.filter((s) => s.accepted && s.title.trim()).length,
    0
  )

  async function commit() {
    setIsCommitting(true)
    try {
      const { created, failed } = await commitImportCards(
        cards,
        (data, idempotencyKey) => tasksApi.create(data, { idempotencyKey }),
        (number, status) => updateCard(number, (card) => ({ ...card, status })),
        // Persist the card's key so a retried commit replays, not re-creates.
        (number, idempotencyKey) =>
          updateCard(number, (card) => ({ ...card, idempotencyKey }))
      )
      if (failed === 0) {
        // Cumulative — a retry batch must report all created tasks, not just
        // the ones it retried.
        const alreadyCreated = cards.filter((c) => c.status === "created")
        const total = alreadyCreated.length + created
        const subtasks =
          alreadyCreated.reduce(
            (sum, card) =>
              sum +
              card.subtasks.filter((s) => s.accepted && s.title.trim()).length,
            0
          ) + acceptedSubtaskCount
        toast({
          title: "Tasks imported",
          description: `Added ${total} task${total === 1 ? "" : "s"} · ${subtasks} subtask${subtasks === 1 ? "" : "s"}.`,
          variant: "success",
        })
        // Back to a clean input — reopening shouldn't show stale "created" cards.
        reset()
        onClose()
      } else if (created > 0) {
        toast({
          title: `${created} task${created === 1 ? "" : "s"} imported`,
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
    if (lastRequestRef.current === null) return
    void requestExtract(lastRequestRef.current)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 sm:max-w-xl"
      >
        <SheetHeaderBlock
          icon={<FileUp className="h-4 w-4 text-primary" />}
          title="Import Notes"
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-4">
          {!isOnline ? (
            <OfflineBanner message="You're offline — importing notes needs a connection." />
          ) : featureDisabled ? (
            <p className="mb-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              Notes import isn't available on this server — the feature may be
              disabled.
            </p>
          ) : budgetExhausted ? (
            <BudgetBanner onRetry={handleRetryRequest} />
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
              setText={(value) => {
                setText(value)
                if (inputError) setInputError(null)
              }}
              inputError={inputError}
              disabled={inputDisabled}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              onFileChange={(file) => void handleFile(file)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSubmit={handleExtractClick}
            />
          ) : null}

          {phase === "loading" ? (
            <LoadingSkeleton label="Extracting tasks from your notes…" />
          ) : null}

          {phase === "review" ? (
            <>
              <StartOverButton onClick={reset} disabled={isCommitting} />
              <div className="flex flex-col gap-3">
                {cards.map((card) => (
                  <ImportCardView
                    key={card.number}
                    card={card}
                    projects={projects}
                    disabled={isCommitting}
                    onChange={updateCard}
                    onRemove={removeCard}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>

        {phase === "review" ? (
          <div className="shrink-0 border-t border-white/5 px-6 py-4">
            {committable.length > 0 || isCreating ? (
              <Button
                id="import-commit-btn"
                className="w-full"
                onClick={() => void commit()}
                disabled={
                  !isOnline ||
                  isCommitting ||
                  committable.length === 0 ||
                  isCreating
                }
              >
                {isCommitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Add {committable.length} task
                {committable.length === 1 ? "" : "s"} · {acceptedSubtaskCount}{" "}
                subtask{acceptedSubtaskCount === 1 ? "" : "s"}
              </Button>
            ) : null}
            <RetryFailedButton
              show={hasFailed && !isCommitting}
              hasCommittable={committable.length > 0}
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
  readonly inputError: string | null
  readonly disabled: boolean
  readonly isDragging: boolean
  readonly fileInputRef: RefObject<HTMLInputElement | null>
  readonly onFileChange: (file: File | undefined) => void
  readonly onDragEnter: (event: DragEvent<HTMLDivElement>) => void
  readonly onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  readonly onDrop: (event: DragEvent<HTMLDivElement>) => void
  readonly onSubmit: () => void
}

function InputSection({
  text,
  setText,
  inputError,
  disabled,
  isDragging,
  fileInputRef,
  onFileChange,
  onDragEnter,
  onDragLeave,
  onDrop,
  onSubmit,
}: InputSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="import-input" className="sr-only">
        Notes to import
      </Label>
      <div
        onDragEnter={onDragEnter}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "rounded-xl transition-colors",
          isDragging && "bg-primary/10 ring-2 ring-primary/40"
        )}
      >
        <Textarea
          id="import-input"
          placeholder="Paste your notes — meeting minutes, a brain-dump, a markdown list…"
          value={text}
          // No maxLength — a silent paste truncation loses extracted tasks;
          // the counter + validateImportText report the over-limit instead.
          onChange={(event) => setText(event.target.value)}
          className="min-h-40 resize-none"
          disabled={disabled}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <input
          ref={fileInputRef}
          id="import-file-input"
          type="file"
          accept=".md,.txt"
          aria-label="Choose a notes file"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            onFileChange(event.target.files?.[0])
            // Re-picking the same file must fire onChange again.
            event.target.value = ""
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="mr-2 h-4 w-4" />
          Drop or pick a .md/.txt file
        </Button>
        <CharacterCounter current={text.length} limit={IMPORT_TEXT_LIMIT} />
      </div>
      {inputError ? (
        <p role="alert" className="text-sm text-destructive">
          {inputError}
        </p>
      ) : null}
      <Button
        id="import-submit-btn"
        className="self-end"
        onClick={onSubmit}
        disabled={disabled || !text.trim()}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Extract tasks
      </Button>
    </div>
  )
}

function ImportCardView({
  card,
  projects,
  disabled = false,
  onChange,
  onRemove,
}: Readonly<{
  card: ImportDraftCard
  projects: { id: number; name: string; color?: string }[]
  /** Locks committability-changing controls while a commit runs. */
  disabled?: boolean
  onChange: (
    number: number,
    updater: (card: ImportDraftCard) => ImportDraftCard
  ) => void
  onRemove: (number: number) => void
}>) {
  if (card.status === "created") {
    return <CreatedCardRow number={card.number} title={card.title} />
  }

  const isExcluded = !card.included

  // Every edit goes through editImportCard — it never clears the persisted
  // key, so a retry can never mint a fresh one and double-create the task.
  const edit = (updater: (card: ImportDraftCard) => ImportDraftCard) =>
    onChange(card.number, (prev) => editImportCard(prev, updater))

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3 transition-opacity",
        isExcluded && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={card.included}
          disabled={disabled}
          aria-label={`Include task ${card.number}`}
          onCheckedChange={(checked) =>
            edit((prev) => ({
              ...prev,
              included: checked === true,
            }))
          }
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <NumberChip number={card.number} />
            <Select
              value={card.priority}
              disabled={disabled}
              onValueChange={(value: TaskPriority) =>
                edit((prev) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger
                aria-label={`Task ${card.number} priority`}
                className="h-7 w-28 border-transparent bg-muted/60 px-2 text-xs shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-background shadow-2xl">
                {(["LOW", "MEDIUM", "HIGH"] as const).map((priority) => (
                  <SelectItem
                    key={priority}
                    value={priority}
                    className="rounded-lg text-xs font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                  >
                    {priority.charAt(0) + priority.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={card.projectId != null ? String(card.projectId) : "none"}
              disabled={disabled}
              onValueChange={(value) =>
                edit((prev) => ({
                  ...prev,
                  projectId:
                    value === "none" ? null : Number.parseInt(value, 10),
                }))
              }
            >
              <SelectTrigger
                aria-label={`Task ${card.number} project`}
                className="h-7 min-w-0 flex-1 border-transparent bg-muted/60 px-2 text-xs shadow-none"
              >
                <SelectValue placeholder="No project" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border bg-background shadow-2xl">
                <SelectItem
                  value="none"
                  className="rounded-lg text-xs font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                >
                  No project
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem
                    key={project.id}
                    value={project.id.toString()}
                    className="rounded-lg text-xs font-medium focus:bg-primary/10 focus:text-primary dark:focus:bg-primary/20"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: project.color || "gray" }}
                      />
                      {project.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              aria-label={`Remove task ${card.number}`}
              disabled={disabled}
              onClick={() => onRemove(card.number)}
              className="shrink-0 text-muted-foreground/60 hover:text-destructive disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <Input
            value={card.title}
            disabled={disabled}
            maxLength={TASK_TITLE_LIMIT}
            aria-label={`Task ${card.number} title`}
            onChange={(event) =>
              edit((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
            className="mt-1.5 border-transparent bg-transparent px-0 font-medium shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-2"
          />
          <Textarea
            value={card.description}
            disabled={disabled}
            maxLength={TASK_DESCRIPTION_LIMIT}
            aria-label={`Task ${card.number} description`}
            placeholder="Add a description…"
            onChange={(event) =>
              edit((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            className="mt-1 min-h-14 resize-none border-transparent bg-transparent px-0 text-sm shadow-none focus-visible:border-input focus-visible:bg-background focus-visible:px-2"
          />
          <Input
            type="date"
            value={card.deadline ?? ""}
            disabled={disabled}
            aria-label={`Task ${card.number} deadline`}
            onChange={(event) =>
              edit((prev) => ({
                ...prev,
                deadline: event.target.value || null,
              }))
            }
            className="mt-1 h-8 w-40 border-transparent bg-muted/60 px-2 text-xs shadow-none"
          />

          <SubtaskListEditor
            cardNumber={card.number}
            subtasks={card.subtasks}
            disabled={disabled}
            onToggle={(index, accepted) =>
              edit(
                updateSubtaskAt<ImportDraftCard>(index, (item) => ({
                  ...item,
                  accepted,
                }))
              )
            }
            onEditTitle={(index, title) =>
              edit(
                updateSubtaskAt<ImportDraftCard>(index, (item) => ({
                  ...item,
                  title,
                }))
              )
            }
            onRemove={(index) =>
              edit((prev) => ({
                ...prev,
                subtasks: prev.subtasks.filter(
                  (_, itemIndex) => itemIndex !== index
                ),
              }))
            }
            onAdd={() =>
              edit((prev) => ({
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
