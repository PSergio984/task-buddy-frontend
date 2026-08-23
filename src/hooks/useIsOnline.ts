import { useEffect, useState } from "react"

/** Tracks browser online/offline state (the breakdown bot is online-only). */
export function useIsOnline() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine)
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
    }
  }, [])

  return isOnline
}
