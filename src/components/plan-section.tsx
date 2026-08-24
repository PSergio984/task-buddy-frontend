import { useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Loader2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useMicRecorder } from "@/hooks/useMicRecorder"
import { MAX_RECORDING_SECONDS } from "@/lib/media"
import { buildTopPickUtterance, chunkForSpeech, speakChunks } from "@/lib/tts"
import { cn } from "@/lib/utils"
import { type PlanResponse, type Task, planApi, voiceApi } from "@/lib/api"
import {
  BUCKET_LABELS,
  type PlanBucket,
  buildTitlesById,
  resolveBucketRows,
} from "./plan-tasks"

type Phase = "idle" | "loading" | "done"

interface PlanSectionProps {
  readonly tasks: readonly Task[]
}

/** D-16: dashboard "What should I do next" — one button, LLM-judged
 * time-bucketed plan (tonight/tomorrow/later), stateless (re-ask to replan).
 * Voice entry (push-to-talk mic) triggers the same stateless planner; one
 * utterance, one plan. */
export function PlanSection({ tasks }: PlanSectionProps) {
  const isOnline = useIsOnline()
  const [phase, setPhase] = useState<Phase>("idle")
  const [buckets, setBuckets] = useState<PlanBucket[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [budgetExhausted, setBudgetExhausted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string | null>(null)
  const [voiceBusy, setVoiceBusy] = useState(false)

  function applyPlanResponse(response: PlanResponse) {
    const nonEmpty = response.buckets.filter(
      (bucket) => resolveBucketRows(bucket, buildTitlesById(tasks)).length > 0
    )
    if (nonEmpty.length === 0) {
      // Distinguish a parse/infra degrade (reason set) from a true empty
      // pool — same split as the breakdown sheet.
      if (response.reason) {
        setError("The planner couldn't generate a plan. Please try again.")
      } else {
        setNotice("Nothing to plan yet — add some open tasks first.")
      }
      setBuckets([])
    } else {
      setBuckets(nonEmpty)
      setPhase("done")
      return
    }
    setPhase("idle")
  }

  async function generate() {
    setPhase("loading")
    setError(null)
    setNotice(null)
    setBudgetExhausted(false)
    setTranscript(null)
    try {
      applyPlanResponse(await planApi.generate())
      return
    } catch (err) {
      handlePlanError(err)
    }
    setPhase("idle")
  }

  async function planFromRecording(audio: Blob) {
    setVoiceBusy(true)
    setError(null)
    setNotice(null)
    setBudgetExhausted(false)
    setTranscript(null)
    try {
      const response = await voiceApi.planFromAudio(audio)
      setTranscript(response.transcript)
      applyPlanResponse(response.plan)
      return
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response
        ?.status
      if (status === 422) {
        setError("Couldn't hear anything — get a bit closer and try again.")
      } else {
        handlePlanError(err)
      }
    } finally {
      setVoiceBusy(false)
    }
  }

  function handlePlanError(err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status
    if (status === 429) {
      setBudgetExhausted(true)
    } else {
      setError(
        status === 503
          ? "The planner isn't available right now. Try again later."
          : "Something went wrong. Please try again."
      )
    }
  }

  function playTopPick() {
    // First speak() must run synchronously inside the click handler (no autoplay).
    for (const bucket of buckets) {
      const row = resolveBucketRows(bucket, titlesById)[0]
      if (!row) continue
      speakChunks(
        chunkForSpeech(
          buildTopPickUtterance(bucket.period, row.title, row.effortMinutes)
        )
      )
      return
    }
  }

  const recorder = useMicRecorder((audio) => void planFromRecording(audio))

  const titlesById = buildTitlesById(tasks)
  const voiceLocked =
    !isOnline || phase === "loading" || voiceBusy || !recorder.supported
  const recording = recorder.isRecording
  const countdownLeft = MAX_RECORDING_SECONDS - recorder.elapsedSeconds

  return (
    <section
      aria-label="What should I do next"
      className="flex flex-col gap-4 rounded-[2rem] border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-2xl md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase">
            What should I do next?
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {recorder.supported ? (
            <Button
              id="plan-voice-btn"
              variant={recording ? "destructive" : "outline"}
              onClick={() =>
                recording ? recorder.stop() : void recorder.start()
              }
              disabled={voiceLocked}
              aria-label={recording ? "Stop recording" : "Start voice planning"}
              className={cn(
                recording &&
                  "relative animate-pulse ring-2 ring-red-500 ring-offset-2"
              )}
            >
              {voiceBusy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : recording ? (
                <Square className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {recording
                ? `${countdownLeft <= 5 ? `${countdownLeft}s left` : `${recorder.elapsedSeconds}s`}`
                : null}
            </Button>
          ) : null}
          <Button
            id="plan-generate-btn"
            onClick={() => void generate()}
            disabled={
              !isOnline || phase === "loading" || voiceBusy || recording
            }
          >
            {phase === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {phase === "done" ? "Replan" : "Plan my focus"}
          </Button>
        </div>
      </div>

      {!isOnline ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <WifiOff className="h-4 w-4 shrink-0" />
          You're offline — the planner needs a connection.
        </p>
      ) : recorder.micDenied ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <MicOffHint />
          Microphone access is blocked. Enable it in your browser settings and
          try again.
        </p>
      ) : budgetExhausted ? (
        <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Daily AI usage limit reached. Your budget resets tomorrow.
        </p>
      ) : error ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : notice ? (
        <p className="text-sm text-muted-foreground italic">{notice}</p>
      ) : transcript && phase === "done" ? (
        <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Heard: </span>
          <span className="font-medium">&ldquo;{transcript}&rdquo;</span>
          <span className="ml-2 text-xs text-muted-foreground/70">
            Not right? Tap the mic and try again
          </span>
        </div>
      ) : null}

      {isOnline && phase === "idle" && !voiceBusy && !recording ? (
        <p className="text-xs text-muted-foreground/60">
          Try: &ldquo;What should I work on tonight?&rdquo;
        </p>
      ) : null}

      {phase === "loading" || voiceBusy ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-muted/60"
            />
          ))}
          <p className="text-sm text-muted-foreground lg:col-span-3">
            Planning your focus…
          </p>
        </div>
      ) : null}

      {phase === "done" && buckets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {buckets.map((bucket) => (
            <PlanBucketCard
              key={bucket.period}
              bucket={bucket}
              titlesById={titlesById}
            />
          ))}
          <div className="flex items-center justify-between lg:col-span-3">
            <Button
              id="plan-speak-top-pick"
              variant="outline"
              size="sm"
              onClick={playTopPick}
            >
              <Volume2 className="mr-2 h-4 w-4" />
              Play top pick
            </Button>
            <p className="text-xs text-muted-foreground/60">
              Plans aren't saved — hit Replan for a fresh take anytime.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function MicOffHint() {
  return <Mic className="h-4 w-4 shrink-0" aria-hidden />
}

function PlanBucketCard({
  bucket,
  titlesById,
}: Readonly<{
  bucket: PlanBucket
  titlesById: Map<number, string>
}>) {
  const rows = resolveBucketRows(bucket, titlesById)
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/40 p-4">
      <h3 className="text-xs font-black tracking-[0.25em] text-primary uppercase">
        {BUCKET_LABELS[bucket.period]}
      </h3>
      {rows.map((row) => (
        <div key={row.taskId} className="rounded-xl bg-muted/30 px-3 py-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            {row.title}
            {row.effortMinutes != null ? (
              <span className="shrink-0 text-xs font-normal text-muted-foreground">
                ~{row.effortMinutes}m
              </span>
            ) : null}
          </p>
          <p
            className={cn(
              "mt-0.5 flex items-start gap-1 text-xs text-muted-foreground"
            )}
          >
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0" />
            {row.reason}
          </p>
        </div>
      ))}
    </div>
  )
}
