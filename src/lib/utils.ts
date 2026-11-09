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
    // Insecure-context fallback — crypto exists but randomUUID is gated;
    // hand-format RFC 4122 v4 so callers still get a real UUID shape.
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex
      .slice(12, 16)
      .join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`
  }
  // Non-crypto environment (uniqueness only — never a secret). NOSONAR
  return `${Date.now()}-${Math.random().toString(16).slice(2)}` // NOSONAR
}
