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

self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    const { title, body, icon, action_url, ...rest } = data

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(title || "Task Buddy", {
          body: body || "",
          icon: icon || "/task-buddy-icon.svg",
          data: { action_url },
          ...rest,
        }),
        // Relay to window clients — a visible page plays an in-app cue; the
        // OS notification above covers hidden/closed tabs (#68).
        self.clients.matchAll({ type: "window" }).then((clientList) => {
          for (const client of clientList) {
            client.postMessage({ type: "tb:push-received" })
          }
        }),
      ])
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
