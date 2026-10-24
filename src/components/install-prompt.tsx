"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISSED_KEY = "tb-install-dismissed"

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * Install prompt for the PWA. Shows an "Install" button when the browser
 * fires beforeinstallprompt, or iOS instructions on Safari (which has no
 * programmatic install). Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  )
  const [eligible, setEligible] = useState(false)
  const [showIOS, setShowIOS] = useState(false)

  useEffect(() => {
    const onInstalled = () => {
      setEligible(false)
      setDeferred(null)
      setShowIOS(false)
    }
    window.addEventListener("appinstalled", onInstalled)

    const id = requestAnimationFrame(() => {
      if (isStandalone() || localStorage.getItem(DISMISSED_KEY)) return
      if (isIOS()) {
        setShowIOS(true)
        return
      }
      setEligible(true)
    })

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("appinstalled", onInstalled)
      window.removeEventListener("beforeinstallprompt", onPrompt)
    }
  }, [])

  if ((!eligible && !showIOS) || (!deferred && !showIOS)) return null

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1")
    setDeferred(null)
    setShowIOS(false)
    setEligible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "accepted") setEligible(false)
    setDeferred(null)
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-lg backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-100">
            Install Task Buddy
          </p>
          {showIOS ? (
            <p className="mt-1 text-xs text-slate-400">
              Tap the Share button, then &quot;Add to Home Screen&quot; to
              install.
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">
              Add to your home screen for offline access and faster launches.
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="text-slate-500 hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      {!showIOS && (
        <button
          onClick={install}
          className="mt-3 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-white"
        >
          Install
        </button>
      )}
    </div>
  )
}
