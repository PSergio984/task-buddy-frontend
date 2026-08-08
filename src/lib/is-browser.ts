export function hasLocalStorage(): boolean {
  return typeof globalThis.localStorage !== "undefined"
}
