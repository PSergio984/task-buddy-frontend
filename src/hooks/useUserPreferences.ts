import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  skipTaskCompletionConfirm: boolean
  skipSubtaskCompletionConfirm: boolean
  skipTagDeletionConfirm: boolean
  skipTagDetachmentConfirm: boolean
  skipSubtaskDeletionConfirm: boolean
  skipTaskDeletionConfirm: boolean
  setPreference: (key: keyof Omit<UserPreferences, 'setPreference'>, value: boolean) => void
}

const stores = new Map<number | string, ReturnType<typeof create<UserPreferences>>>()

export const useUserPreferences = (userId: number | string = "default") => {
  if (!stores.has(userId)) {
    stores.set(
      userId,
      create<UserPreferences>()(
        persist(
          (set) => ({
            skipTaskCompletionConfirm: false,
            skipSubtaskCompletionConfirm: false,
            skipTagDeletionConfirm: false,
            skipTagDetachmentConfirm: false,
            skipSubtaskDeletionConfirm: false,
            skipTaskDeletionConfirm: false,
            setPreference: (key, value) => set({ [key]: value }),
          }),
          {
            name: `tb_user_preferences_${userId}`,
          }
        )
      )
    )
  }
  return stores.get(userId)!()
}
