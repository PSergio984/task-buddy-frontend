import { useCallback, useEffect, useRef, useState } from "react"
import {
  MAX_RECORDING_SECONDS,
  isVoiceRecordingSupported,
  pickMimeType,
} from "@/lib/media"

/** Push-to-talk recorder (voice spec §2): tap to start, tap to stop early,
 * hard 60 s auto-stop with the countdown window derived from `elapsedSeconds`.
 * Owns the MediaRecorder lifecycle and explicit track release; permission
 * denial surfaces as `micDenied`. Unsupported browsers never reach start(). */
export function useMicRecorder(onComplete: (audio: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [micDenied, setMicDenied] = useState(false)
  const [supported] = useState(() => isVoiceRecordingSupported())

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const capRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const clearTimers = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (capRef.current) {
      clearTimeout(capRef.current)
      capRef.current = null
    }
  }, [])

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const stop = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop()
    }
  }, [])

  const start = useCallback(async () => {
    if (!supported || recorderRef.current?.state === "recording") return
    setMicDenied(false)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setMicDenied(true)
      return
    }
    streamRef.current = stream
    chunksRef.current = []
    const mimeType = pickMimeType((mime) => MediaRecorder.isTypeSupported(mime))
    const recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType } : undefined
    )
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const audio = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      })
      recorderRef.current = null
      clearTimers()
      releaseStream()
      setIsRecording(false)
      setElapsedSeconds(0)
      onCompleteRef.current(audio)
    }
    recorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
    setElapsedSeconds(0)
    tickRef.current = setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000
    )
    capRef.current = setTimeout(stop, MAX_RECORDING_SECONDS * 1000)
  }, [clearTimers, releaseStream, stop, supported])

  useEffect(
    () => () => {
      clearTimers()
      releaseStream()
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
    },
    [clearTimers, releaseStream]
  )

  return {
    supported,
    isRecording,
    elapsedSeconds,
    micDenied,
    start,
    stop,
  }
}
