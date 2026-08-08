function storageAvailable(): boolean {
  return typeof globalThis.localStorage !== "undefined"
}

export function safeLocalStorageGet(key: string): string | null {
  if (!storageAvailable()) return null
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeLocalStorageSet(key: string, value: string): void {
  if (!storageAvailable()) return
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    // storage may be full or blocked by policy; ignore
  }
}

export function safeLocalStorageRemove(key: string): void {
  if (!storageAvailable()) return
  try {
    globalThis.localStorage.removeItem(key)
  } catch {
    // storage may be blocked by policy; ignore
  }
}
