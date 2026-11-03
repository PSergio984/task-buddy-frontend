"use client"

import { useEffect } from "react"
import { playNotificationCue } from "@/lib/focus-audio"

export function SwRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("Service worker registration failed:", err)
    })

    // The SW relays each push to its window clients — a visible page plays a
    // short cue; hidden tabs are covered by the OS notification (#68).
    const onMessage = (event: MessageEvent) => {
      if (
        (event.data as { type?: string } | null)?.type === "tb:push-received" &&
        document.visibilityState === "visible"
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
