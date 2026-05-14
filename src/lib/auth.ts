import axios from "axios"

export interface AuthUser {
  id: string
  username?: string
  email?: string
  email_confirmed?: boolean
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong"
}

type BackendErrorDetail = {
  msg?: unknown
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_REGEX =
  /^(?=.{3,32}$)[A-Za-z0-9](?:[A-Za-z0-9._@\- ]*[A-Za-z0-9])?$/
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g

function normalizeText(value: string) {
  return value.normalize("NFKC").replaceAll(CONTROL_CHARS, "")
}

function formatFirstBackendError(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim().length > 0) {
    return detail
  }

  if (Array.isArray(detail)) {
    const firstError = detail[0] as BackendErrorDetail | undefined
    const message = firstError?.msg
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }

  if (detail && typeof detail === "object") {
    const typedDetail = detail as { detail?: unknown; message?: unknown }
    return (
      formatFirstBackendError(typedDetail.detail) ??
      formatFirstBackendError(typedDetail.message)
    )
  }

  return null
}

export function sanitizeUsername(value: string) {
  return normalizeText(value).replaceAll(/[^A-Za-z0-9._@\- ]/g, "")
}

export function sanitizeEmail(value: string) {
  return normalizeText(value).trim().toLowerCase()
}

export function sanitizePassword(value: string) {
  return normalizeText(value)
}

export function getPasswordStrength(value: string): PasswordStrength {
  const password = normalizeText(value)
  if (!password) {
    return { score: 0, label: "Very weak" }
  }

  let score = 0
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(
    Boolean
  ).length

  if (password.length >= 8) {
    score += 1
  }

  if (password.length >= 12) {
    score += 1
  }

  if (variety >= 2) {
    score += 1
  }

  if (variety >= 3) {
    score += 1
  }

  if (variety >= 4) {
    score += 1
  }

  if (score > 4) {
    score = 4
  }

  const labels: PasswordStrength["label"][] = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ]

  return {
    score: score as PasswordStrength["score"],
    label: labels[score],
  }
}

export function validateUsername(value: string) {
  if (!value) {
    return "Username is required."
  }

  if (!USERNAME_REGEX.test(value)) {
    return "Use 3-32 characters with letters, numbers, dots, underscores, or hyphens."
  }

  return null
}

export function validateEmail(value: string) {
  if (!value) {
    return "Email is required."
  }

  if (!EMAIL_REGEX.test(value)) {
    return "Enter a valid email address."
  }

  return null
}

export function validatePassword(value: string) {
  const sanitized = sanitizePassword(value)

  if (!sanitized) {
    return "Password is required."
  }

  if (sanitized.length < 8) {
    return "Password must be at least 8 characters."
  }

  return null
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string
) {
  const sanitizedPassword = sanitizePassword(password)
  const sanitizedConfirmation = sanitizePassword(confirmation)

  if (!sanitizedConfirmation) {
    return "Please confirm your password."
  }

  if (sanitizedPassword !== sanitizedConfirmation) {
    return "Passwords do not match."
  }

  return null
}

export function extractAccessToken(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const response = payload as Record<string, unknown>
  const candidateToken =
    response.access_token ?? response.accessToken ?? response.token

  return typeof candidateToken === "string" && candidateToken.length > 0
    ? candidateToken
    : null
}

export function normalizeAuthUser(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null
  }

  const response = payload as Record<string, unknown>
  const userPayload =
    response.user && typeof response.user === "object"
      ? (response.user as Record<string, unknown>)
      : response

  const rawId = userPayload.id
  if (typeof rawId !== "string" && typeof rawId !== "number") {
    return null
  }

  const user: AuthUser = { id: String(rawId) }

  if (typeof userPayload.username === "string" && userPayload.username.trim().length > 0) {
    user.username = userPayload.username
  } else if (typeof userPayload.email === "string" && userPayload.email.trim().length > 0) {
    // Fallback to email prefix as username if username is missing
    user.username = userPayload.email.split("@")[0]
  }

  if (typeof userPayload.email === "string") {
    user.email = userPayload.email
  }

  if (typeof userPayload.email_confirmed === "boolean") {
    user.email_confirmed = userPayload.email_confirmed
  }

  return user
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const data = error.response?.data

    if (status === 401) {
      const message = formatFirstBackendError(data)
      if (message === "Email not confirmed") {
        return "EMAIL_NOT_CONFIRMED"
      }
      return message ?? "Invalid email or password."
    }

    if (status === 422) {
      return (
        formatFirstBackendError(data) ??
        "Please fix the highlighted fields and try again."
      )
    }

    const backendMessage = formatFirstBackendError(data)
    if (backendMessage) {
      return backendMessage
    }
  }

  return fallback
}
