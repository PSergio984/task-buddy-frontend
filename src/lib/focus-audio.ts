/**
 * Phase-boundary alert tones — distinct work-end vs break-end beeps (spec:
 * "distinct work/break end alerts"). WebAudio only, no assets; silent no-op
 * where the API is missing or the context can't start.
 */
export function playPhaseAlert(kind: "focus" | "break"): void {
  try {
    const Ctx =
      globalThis.AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    if (typeof Ctx !== "function") return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    // Focus end = high double ping; break end = low single tone.
    const freq = kind === "focus" ? 880 : 520
    osc.type = "sine"
    osc.frequency.value = freq
    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.55)
    if (kind === "focus") {
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.value = 1174
      gain2.gain.setValueAtTime(0.0001, t + 0.15)
      gain2.gain.exponentialRampToValueAtTime(0.15, t + 0.17)
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(t + 0.15)
      osc2.stop(t + 0.65)
    }
    osc.onended = () => void ctx.close().catch(() => {})
  } catch {
    // Audio is best-effort — a blocked context must not break the timer.
  }
}
