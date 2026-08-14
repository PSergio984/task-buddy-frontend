import axios from "axios"

export function getHttpErrorStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: number } })?.response?.status
  return typeof status === "number" ? status : null
}

export function getRetryAfterSec(error: unknown): number | null {
  const retryAfter = (
    error as { response?: { headers?: Record<string, string> } }
  )?.response?.headers?.["retry-after"]
  const parsed = retryAfter ? Number(retryAfter) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data

    // Handle Pydantic validation errors (array of errors)
    if (data && typeof data === "object" && "detail" in data) {
      const detail = data.detail
      if (Array.isArray(detail)) {
        // Extract the first human-readable error message
        return detail.map((e) => e.msg).join(", ") || "Invalid input data"
      }
      if (typeof detail === "string") {
        return detail
      }
    }

    return err.message
  }
  return err instanceof Error ? err.message : "An unexpected error occurred"
}
