"use client"

import { useEffect } from "react"
import { playNotificationCue } from "@/lib/focus-audio"

export function SwRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err)
    })

    // The SW relays each push to its window clients — the focused page
    // plays a short cue; unfocused/hidden tabs are covered by the OS
    // notification, and only the focused one cues so two visible windows
    // can't double it (#68).
    const onMessage = (event: MessageEvent) => {
      if (
        (event.data as { type?: string } | null)?.type === "tb:push-received" &&
        document.hasFocus()
      ) {
        playNotificationCue()
      }
    }
    navigator.serviceWorker.addEventListener("message", onMessage)
    return () =>
      navigator.serviceWorker.removeEventListener("message", onMessage)
  }, [])

  return null
}
