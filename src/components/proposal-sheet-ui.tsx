import type { ReactNode } from "react"
import {
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  WifiOff,
} from "lucide-react"
import { SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { SubtaskItem } from "./proposal-cards"

/** Shared chrome for the AI proposal sheets (breakdown + notes import). */

export function SheetHeaderBlock({
  icon,
  title,
  children,
}: Readonly<{
  icon: ReactNode
  title: string
  children?: ReactNode
}>) {
  return (
    <SheetHeader className="border-b border-white/5 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </div>
        <div>
          <SheetTitle className="text-sm font-black tracking-[0.2em] uppercase">
            {title}
          </SheetTitle>
          {children}
        </div>
      </div>
    </SheetHeader>
  )
}

export function OfflineBanner({ message }: Readonly<{ message: string }>) {
  return (
    <p className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <WifiOff className="h-4 w-4 shrink-0" />
      {message}
    </p>
  )
}

export function BudgetBanner() {
  return (
    <p className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      Daily AI usage limit reached. Your budget resets tomorrow.
    </p>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {message}
      </span>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1 h-3.5 w-3.5" />
        Retry
      </Button>
    </div>
  )
}

export function LoadingSkeleton({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
      </p>
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-20 animate-pulse rounded-xl bg-muted/60" />
      ))}
    </div>
  )
}

export function StartOverButton({
  onClick,
  disabled = false,
}: Readonly<{ onClick: () => void; disabled?: boolean }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mb-3 flex w-fit items-center gap-1 self-end text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      <RotateCcw className="h-3 w-3" />
      Start over
    </button>
  )
}

export function NumberChip({ number }: Readonly<{ number: number }>) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold text-muted-foreground">
      #{number}
    </span>
  )
}

export function CreatedCardRow({
  number,
  title,
}: Readonly<{ number: number; title: string }>) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
      <span className="font-semibold text-primary">#{number}</span> {title} —
      created ✓
    </div>
  )
}

export function SubtaskListEditor({
  cardNumber,
  subtasks,
  onToggle,
  onEditTitle,
  onRemove,
  onAdd,
}: Readonly<{
  cardNumber: number
  subtasks: SubtaskItem[]
  onToggle: (index: number, accepted: boolean) => void
  onEditTitle: (index: number, title: string) => void
  onRemove: (index: number) => void
  onAdd: () => void
}>) {
  return (
    <div className="mt-2 flex flex-col gap-1.5 pl-2">
      {subtasks.map((sub, index) => (
        <div key={index} className="flex items-center gap-2">
          <Checkbox
            checked={sub.accepted}
            aria-label={`Include subtask ${index + 1} of task ${cardNumber}`}
            onCheckedChange={(checked) => onToggle(index, checked === true)}
          />
          <Input
            value={sub.title}
            aria-label={`Task ${cardNumber} subtask ${index + 1}`}
            onChange={(event) => onEditTitle(index, event.target.value)}
            className="h-8 flex-1 border-transparent bg-transparent px-1 text-sm shadow-none focus-visible:border-input focus-visible:bg-background"
          />
          <button
            type="button"
            aria-label={`Remove subtask ${index + 1}`}
            onClick={() => onRemove(index)}
            className="text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3 w-3" />
        Add subtask
      </button>
    </div>
  )
}

export function RetryFailedButton({
  show,
  hasCommittable,
  disabled = false,
  onClick,
}: Readonly<{
  show: boolean
  hasCommittable: boolean
  disabled?: boolean
  onClick: () => void
}>) {
  if (!show) return null
  return (
    <Button
      variant="destructive"
      className={cn("w-full", hasCommittable ? "mt-2" : "mt-3")}
      disabled={disabled}
      onClick={onClick}
    >
      <RefreshCw className="mr-2 h-4 w-4" />
      Retry failed
    </Button>
  )
}
