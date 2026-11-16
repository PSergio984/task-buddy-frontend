import { api } from "@/lib/api"
import {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  getPasswordStrength,
  getAuthErrorMessage,
} from "@/lib/auth"

/**
 * Pure domain model for Authentication.
 * Zero React/DOM hooks or JSX.
 */

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const authApi = {
  forgotPassword: async (email: string) => {
    return api.post("/api/v1/users/forgot-password/", { email })
  },
  resetPassword: async (token: string, newPassword: string) => {
    return api.post("/api/v1/users/reset-password", {
      token,
      new_password: newPassword,
    })
  },
}

export {
  sanitizeEmail,
  sanitizePassword,
  sanitizeUsername,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validateUsername,
  getPasswordStrength,
  getAuthErrorMessage,
}
