/** Codec probe ladder for MediaRecorder (voice spec §2): first supported type
 * wins, falling through to the browser default when nothing matches. */

export const MIME_LADDER = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
] as const

export const MAX_RECORDING_SECONDS = 60

export function pickMimeType(
  isSupported: (mimeType: string) => boolean
): string | undefined {
  return MIME_LADDER.find((mime) => isSupported(mime))
}

/** Feature detection at mount: the mic button is not rendered at all on
 * unsupported browsers; text planning stays unaffected. */
export function isVoiceRecordingSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined"
  )
}
