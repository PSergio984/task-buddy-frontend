/**
 * Phase-boundary alerts — distinct work-end vs break-end tones (spec:
 * "distinct work/break end alerts" that fire even from another tab).
 *
 * When the page is hidden and notification permission was granted, a
 * Notification fires instead — WebAudio can't reliably sound from a
 * backgrounded tab. One shared AudioContext is reused and resumed per alert
 * (a fresh context per beep leaks and hits the browser's context limit).
 * Best-effort throughout: a blocked context must not break the timer.
 */
import { speedrunVerdictCopy } from "@/lib/focus-session"
import type { SpeedrunState } from "@/lib/api"

let sharedCtx: AudioContext | null = null

function audioContext(): AudioContext | null {
  try {
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (typeof Ctor !== "function") return null
    sharedCtx ??= new Ctor()
    return sharedCtx
  } catch {
    return null
  }
}

/**
 * Create/resume the shared AudioContext inside the session-start click —
 * autoplay policy leaves a context created outside a gesture suspended, so
 * the first boundary tone would otherwise be silent.
 */
export function primeAlertAudio(): void {
  try {
    const ctx = audioContext()
    if (ctx !== null && ctx.state === "suspended") {
      void ctx.resume().catch(() => {})
    }
  } catch {
    // Audio is best-effort.
  }
}

/** Ask for notification permission from a user gesture (session start). */
export function requestAlertPermission(): void {
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "default"
  ) {
    void Notification.requestPermission().catch(() => {})
  }
}

function tone(
  ctx: AudioContext,
  t: number,
  level: number,
  freq: number,
  startOffset: number,
  peak: number,
  endOffset: number
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = "sine"
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, t + startOffset)
  gain.gain.exponentialRampToValueAtTime(
    Math.max(0.0001, peak * level),
    t + startOffset + 0.02
  )
  gain.gain.exponentialRampToValueAtTime(0.0001, t + endOffset)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t + startOffset)
  osc.stop(t + endOffset + 0.05)
}

export function playPhaseAlert(
  kind: "focus" | "break" | "speedrun-win" | "speedrun-miss",
  volume = 0.8
): void {
  try {
    const ctx = audioContext()
    if (ctx === null) return
    void ctx.resume().catch(() => {})
    const level = Math.min(1, Math.max(0, volume))
    const t = ctx.currentTime
    // Focus end = high double ping; break end = low single tone. Speedrun
    // resolves to a verdict: an ascending triple for a win, a low falling
    // pair for a miss/abandon — neither may sound like "next phase ready".
    if (kind === "focus") {
      tone(ctx, t, level, 880, 0, 0.2, 0.5)
      tone(ctx, t, level, 1174, 0.15, 0.15, 0.6)
    } else if (kind === "break") {
      tone(ctx, t, level, 520, 0, 0.2, 0.5)
    } else if (kind === "speedrun-win") {
      tone(ctx, t, level, 880, 0, 0.15, 0.5)
      tone(ctx, t, level, 1174, 0.1, 0.15, 0.6)
      tone(ctx, t, level, 1568, 0.2, 0.2, 0.75)
    } else {
      tone(ctx, t, level, 440, 0, 0.2, 0.5)
      tone(ctx, t, level, 294, 0.15, 0.25, 0.65)
    }
  } catch {
    // Audio is best-effort — a blocked context must not break the timer.
  }
}

/**
 * Short, soft cue for a push that arrives while the app is visible — the OS
 * notification covers hidden/closed tabs, so this only ever plays over a
 * foreground page. Deliberately quieter and distinct from the phase tones.
 */
export function playNotificationCue(volume = 0.5): void {
  try {
    const ctx = audioContext()
    if (ctx === null) return
    void ctx.resume().catch(() => {})
    const level = Math.min(1, Math.max(0, volume))
    const t = ctx.currentTime
    tone(ctx, t, level, 660, 0, 0.12, 0.25)
    tone(ctx, t, level, 990, 0.08, 0.1, 0.3)
  } catch {
    // Audio is best-effort — a suspended context stays silent.
  }
}

/** A judged speedrun's verdict → win tone vs miss tone. */
const speedrunWon = (run: SpeedrunState | null | undefined): boolean =>
  run?.result === "win" ||
  run?.result === "record" ||
  run?.result === "finished"

/**
 * Fire the phase-boundary alert through the best available channel: a system
 * Notification when the tab is hidden and permission was granted, else the
 * in-tab WebAudio tone. A "speedrun" boundary carries the judged blob — the
 * leg is the whole run, so the copy is the verdict, not "next phase ready".
 */
export function alertPhaseBoundary(
  kind: "focus" | "break" | "speedrun",
  volume = 0.8,
  run?: SpeedrunState | null,
  plannedSeconds?: number
): void {
  const won = kind === "speedrun" && speedrunWon(run)
  const copy =
    kind === "speedrun"
      ? speedrunVerdictCopy(run, plannedSeconds)
      : kind === "focus"
        ? {
            title: "Focus phase complete",
            body: "Nice sprint — your next phase is ready.",
          }
        : { title: "Break over", body: "Break ended — time to get back to it." }
  try {
    if (
      document.hidden &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(copy.title, {
        body: copy.body,
        tag: "tb-focus-phase",
      })
      return
    }
  } catch {
    // Fall through to the in-tab tone.
  }
  playPhaseAlert(
    kind === "speedrun" ? (won ? "speedrun-win" : "speedrun-miss") : kind,
    volume
  )
}
