import { useState } from "react"
import axios from "axios"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sessionNotesApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { getErrorMessage } from "@/lib/errors"

interface SessionNotePromptProps {
  readonly sessionId: number
}

/**
 * Sessions the user already answered or skipped this browser session.
 * Module scope so a dismissal survives unmount/remount (skip → navigate
 * away → back); it clears on a full reload — one-shot per browser session
 * is the intended affordance.
 */
const dismissedSessions = new Set<number>()

/**
 * The skippable reflection note offered at focus-session end (issue #67) —
 * renders inside the Focus page's ended state, one note per session
 * (POST /game/sessions/{id}/note; the backend 409s a duplicate). Local
 * (offline, id 0) sessions never reach this — they have no server row to
 * attach to.
 */
export function SessionNotePrompt({ sessionId }: SessionNotePromptProps) {
  const { toast } = useToast()
  const [content, setContent] = useState("")
  const [busy, setBusy] = useState(false)
  // "hidden" covers both skipped and saved — the prompt is one-shot.
  const [hidden, setHidden] = useState(() => dismissedSessions.has(sessionId))

  const dismiss = () => {
    dismissedSessions.add(sessionId)
    setHidden(true)
  }

  if (hidden) return null

  const trimmed = content.trim()

  const handleSave = async () => {
    if (trimmed === "") return
    setBusy(true)
    try {
      await sessionNotesApi.attach(sessionId, trimmed)
      toast({
        title: "Note saved",
        description: "Your session reflection was attached.",
        variant: "success",
      })
      dismiss()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        // A note already landed (retry/other tab) — nothing left to do.
        dismiss()
        return
      }
      toast({
        title: "Couldn't save note",
        description: getErrorMessage(error),
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      data-testid="session-note-prompt"
      className="w-full space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
    >
      <p className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        How did it go?
      </p>
      <Textarea
        aria-label="Session note"
        value={content}
        maxLength={10_000}
        placeholder="A quick note for your diary…"
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[64px] rounded-xl border-white/10 bg-white/5 text-sm focus-visible:ring-primary/30"
      />
      <div className="flex items-center gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={busy || trimmed === ""}
          className="h-9 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          Save note
        </Button>
        <Button
          variant="ghost"
          onClick={dismiss}
          disabled={busy}
          className="h-9 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
        >
          Skip
        </Button>
      </div>
    </div>
  )
}
