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

/** Ask for notification permission from a user gesture (session start). */
export function requestAlertPermission(): void {
  try {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      void Notification.requestPermission()
    }
  } catch {
    // Permission prompts are best-effort.
  }
}

export function playPhaseAlert(
  kind: "focus" | "break",
  volume = 0.8
): void {
  try {
    const ctx = audioContext()
    if (ctx === null) return
    void ctx.resume().catch(() => {})
    const level = Math.min(1, Math.max(0, volume))
    const t = ctx.currentTime
    const tone = (
      freq: number,
      startOffset: number,
      peak: number,
      endOffset: number
    ) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t + startOffset)
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * level), t + startOffset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + endOffset)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t + startOffset)
      osc.stop(t + endOffset + 0.05)
    }
    // Focus end = high double ping; break end = low single tone.
    if (kind === "focus") {
      tone(880, 0, 0.2, 0.5)
      tone(1174, 0.15, 0.15, 0.6)
    } else {
      tone(520, 0, 0.2, 0.5)
    }
  } catch {
    // Audio is best-effort — a blocked context must not break the timer.
  }
}

/**
 * Fire the phase-boundary alert through the best available channel: a system
 * Notification when the tab is hidden and permission was granted, else the
 * in-tab WebAudio tone.
 */
export function alertPhaseBoundary(
  kind: "focus" | "break",
  volume = 0.8
): void {
  try {
    if (
      document.hidden &&
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(
        kind === "focus" ? "Focus phase complete" : "Break over",
        {
          body:
            kind === "focus"
              ? "Nice sprint — your next phase is ready."
              : "Break ended — time to get back to it.",
          tag: "tb-focus-phase",
        }
      )
      return
    }
  } catch {
    // Fall through to the in-tab tone.
  }
  playPhaseAlert(kind, volume)
}
