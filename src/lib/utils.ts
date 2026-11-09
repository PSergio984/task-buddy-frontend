import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createUuid(): string {
  if (typeof crypto !== "undefined") {
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
    // Insecure-context fallback — crypto exists but randomUUID is gated.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  }
  // Non-crypto environment (uniqueness only — never a secret). NOSONAR
  return `${Date.now()}-${Math.random().toString(16).slice(2)}` // NOSONAR
}
