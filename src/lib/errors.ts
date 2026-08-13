import axios from "axios"

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
