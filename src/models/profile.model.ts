import axios from "axios"
import { API_BASE_URL } from "@/lib/config"
import {
  sanitizeUsername,
  sanitizePassword,
  validatePassword,
  validateUsername,
} from "@/lib/auth"

/**
 * Pure domain model for Profile, Account Settings, and User Preferences.
 * Zero React/DOM hooks or JSX.
 */

export interface PasswordRule {
  readonly label: string
  readonly test: (pw: string) => boolean
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "One number", test: (pw: string) => /\d/.test(pw) },
  {
    label: "One special character",
    test: (pw: string) => /[^A-Za-z0-9]/.test(pw),
  },
]

export function urlBase64ToUint8Array(
  base64String: string
): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replaceAll("-", "+")
    .replaceAll("_", "/")
  const rawData = globalThis.atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const outputArray = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.codePointAt(i) ?? 0
  }
  return outputArray
}

export interface ConfirmationSettingItem {
  readonly key:
    | "skipTaskCompletionConfirm"
    | "skipSubtaskCompletionConfirm"
    | "skipTaskDeletionConfirm"
    | "skipSubtaskDeletionConfirm"
    | "skipTagDeletionConfirm"
    | "skipTagDetachmentConfirm"
  readonly label: string
  readonly description: string
  readonly destructive: boolean
}

export const CONFIRMATION_SETTINGS: readonly ConfirmationSettingItem[] = [
  {
    key: "skipTaskCompletionConfirm",
    label: "Task Completion",
    description: "Confirm before marking a major task as finished.",
    destructive: false,
  },
  {
    key: "skipSubtaskCompletionConfirm",
    label: "Subtask Completion",
    description: "Confirm before marking subtasks as complete.",
    destructive: false,
  },
  {
    key: "skipTaskDeletionConfirm",
    label: "Task Deletion",
    description: "Ask for confirmation before permanently deleting a task.",
    destructive: true,
  },
  {
    key: "skipSubtaskDeletionConfirm",
    label: "Subtask Deletion",
    description: "Ask for confirmation before removing a subtask.",
    destructive: true,
  },
  {
    key: "skipTagDeletionConfirm",
    label: "Tag Deletion",
    description: "Confirm before deleting a tag from the system.",
    destructive: true,
  },
  {
    key: "skipTagDetachmentConfirm",
    label: "Tag Removal",
    description: "Confirm before removing a tag from a specific task.",
    destructive: false,
  },
]

export interface UsernameValidationResult {
  readonly trimmed: string
  readonly isLongEnough: boolean
  readonly isFormatValid: boolean
  readonly isValid: boolean
  readonly error: string | null
}

export function validateUsernameInput(
  username: string
): UsernameValidationResult {
  const trimmed = username.trim()
  if (!username || trimmed.length === 0) {
    return {
      trimmed,
      isLongEnough: false,
      isFormatValid: false,
      isValid: false,
      error: "Username cannot be empty",
    }
  }
  const isLongEnough = trimmed.length >= 3
  if (!isLongEnough) {
    return {
      trimmed,
      isLongEnough: false,
      isFormatValid: false,
      isValid: false,
      error: "Username must be at least 3 characters",
    }
  }
  const authErr = validateUsername(trimmed)
  if (authErr) {
    return {
      trimmed,
      isLongEnough: true,
      isFormatValid: false,
      isValid: false,
      error: authErr,
    }
  }
  return {
    trimmed,
    isLongEnough: true,
    isFormatValid: true,
    isValid: true,
    error: null,
  }
}

export const profileApi = {
  updateUsername: async (username: string) => {
    const sanitized = sanitizeUsername(username)
    await axios.patch(
      `${API_BASE_URL}/api/v1/users/me/username`,
      { username: sanitized },
      { withCredentials: true }
    )
  },
  updatePassword: async (currentPassword: string, newPassword: string) => {
    await axios.patch(
      `${API_BASE_URL}/api/v1/users/me/password`,
      {
        current_password: sanitizePassword(currentPassword),
        new_password: sanitizePassword(newPassword),
      },
      { withCredentials: true }
    )
  },
}

export {
  sanitizeUsername,
  sanitizePassword,
  validatePassword,
  validateUsername,
}
