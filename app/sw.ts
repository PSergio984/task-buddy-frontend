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
// a payload can't clobber the click target (#68). `renotify`/`vibrate` are
// deliberately excluded: `renotify` throws without a non-empty `tag`, and
// `vibrate` throws alongside `silent` (which we set for focused windows) or
// a non-iterable value — either TypeError swallows the whole notification.
const NOTIFICATION_OPTION_KEYS = ["tag", "badge", "silent"] as const

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
    // notification covers everything else (#68). Silence the OS copy only
    // when a focused window exists to cue instead: a merely visible page
    // plays no cue, so its notification must keep the OS sound. Rare
    // zero-audio edges remain — focus lost between matchAll and delivery,
    // or an autoplay-blocked AudioContext — accepted: the notification
    // still displays. The relay is best-effort: a failed matchAll still
    // shows the notification (with sound — the page can't cue what it
    // never heard about).
    const anyFocused = self.clients
      .matchAll({ type: "window" })
      .then((clientList) => {
        for (const client of clientList) {
          client.postMessage({ type: "tb:push-received" })
        }
        return clientList.some((client) => client.focused === true)
      })
      .catch((err) => {
        console.warn("Push relay to window clients failed:", err)
        return false
      })

    // waitUntil must never reject — Chrome renders its generic "updated in
    // the background" notification on top of the real one when it does.
    event.waitUntil(
      anyFocused
        .then((focused) =>
          self.registration.showNotification(title || "Task Buddy", {
            ...options,
            body: body || "",
            icon: icon || "/task-buddy-icon.svg",
            silent: focused || options.silent === true,
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
