/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

// Only these NotificationOptions may come from a push payload — everything
// else (`data`, `image`, `requireInteraction`, arbitrary junk) stays ours so
// a payload can't clobber the click target or fetch cross-origin (#68).
const NOTIFICATION_OPTION_KEYS = [
  "tag",
  "badge",
  "renotify",
  "silent",
  "vibrate",
] as const

self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const { title, body, icon, action_url, ...rest } = data
    const options: NotificationOptions = {}
    for (const key of NOTIFICATION_OPTION_KEYS) {
      const value = (rest as Record<string, unknown>)[key]
      if (value !== undefined) {
        ;(options as Record<string, unknown>)[key] = value
      }
    }

    // Relay to window clients — a focused page plays an in-app cue; the OS
    // notification covers hidden/closed tabs (#68). A visible page makes
    // the OS copy silent so the two can't double the sound. The relay is
    // best-effort: a failed matchAll still shows the notification (with
    // sound — the page can't cue what it never heard about).
    const anyVisible = self.clients
      .matchAll({ type: "window" })
      .then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "tb:push-received" })
        }
        return clientList.some((client) => client.visibilityState === "visible")
      })
      .catch((err) => {
        console.warn("Push relay to window clients failed:", err)
        return false
      })

    // waitUntil must never reject — Chrome renders its generic "updated in
    // the background" notification on top of the real one when it does.
    event.waitUntil(
      anyVisible
        .then((visible) =>
          self.registration.showNotification(title || "Task Buddy", {
            ...options,
            body: body || "",
            icon: icon || "/task-buddy-icon.svg",
            silent: visible || options.silent === true,
            data: { action_url },
          })
        )
        .catch((err) => console.error("showNotification failed:", err))
    )
  } catch (err) {
    console.error("Push event error:", err)
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const action_url = event.notification.data?.action_url

  if (typeof action_url === "string") {
    const target = new URL(action_url, self.location.origin)
    if (target.origin !== self.location.origin) {
      console.warn("Ignoring cross-origin notification target:", action_url)
      return
    }
    const path = target.pathname + target.search

    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              client.url.includes(self.location.origin) &&
              "focus" in client
            ) {
              return client.focus().then((c) => c.navigate(path))
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(path)
          }
        })
    )
  }
})
