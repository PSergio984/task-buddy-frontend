import type { PlanBucket } from "@/lib/api"

/** speechSynthesis works reliably with short utterances; chunk at ≤160 chars. */
export const SPEECH_CHUNK_LIMIT = 160

/** Split text into speakable chunks, breaking at word boundaries. */
export function chunkForSpeech(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  const chunks: string[] = []
  let remaining = trimmed
  while (remaining.length > SPEECH_CHUNK_LIMIT) {
    let cut = remaining.lastIndexOf(" ", SPEECH_CHUNK_LIMIT)
    if (cut <= 0) cut = SPEECH_CHUNK_LIMIT
    chunks.push(remaining.slice(0, cut).trim())
    remaining = remaining.slice(cut).trim()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

/** The spoken readout names only the top item ("Top pick tonight: X, …"). */
export function buildTopPickUtterance(
  period: PlanBucket["period"],
  title: string,
  effortMinutes: number | null
): string {
  const effort = effortMinutes != null ? `, about ${effortMinutes} minutes` : ""
  return `Top pick ${period}: ${title}${effort}.`
}

/** Speak chunks sequentially; must be called synchronously inside a user-gesture
 * handler (no autoplay). No-op where speechSynthesis is unavailable. */
export function speakChunks(chunks: string[]): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  window.speechSynthesis.cancel()
  for (const chunk of chunks) {
    const utterance = new SpeechSynthesisUtterance(chunk)
    window.speechSynthesis.speak(utterance)
  }
}
