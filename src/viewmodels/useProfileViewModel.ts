import React, { useState, useEffect } from "react"
import axios from "axios"
import { useAuth } from "@/contexts/AuthContext"
import { useSettings } from "@/contexts/SettingsContext"
import { useToast } from "@/hooks/use-toast"
import { useRegisterPush, useVapidKey } from "@/hooks/useNotifications"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { notificationsApi } from "@/lib/api"
import { getErrorMessage } from "@/lib/errors"
import {
  profileApi,
  validatePassword,
  validateUsernameInput,
  urlBase64ToUint8Array,
  CONFIRMATION_SETTINGS,
  PASSWORD_RULES,
} from "@/models/profile.model"

export function useProfileViewModel() {
  const { user, refreshUser, logout } = useAuth()
  const { toast } = useToast()
  const { timeFormat, setTimeFormat } = useSettings()
  const preferences = useUserPreferences(user?.id ?? "default")

  // --- Username State ---
  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false)

  const effectiveUsername = usernameDraft ?? user?.username ?? ""
  const usernameValidation = validateUsernameInput(effectiveUsername)
  const hasUsernameChanged =
    Boolean(user) &&
    usernameValidation.trimmed !== user?.username &&
    usernameValidation.isValid

  const handleUpdateUsername = async (
    e?: React.SubmitEvent<HTMLFormElement>
  ) => {
    if (e) e.preventDefault()
    if (!usernameValidation.isValid || !hasUsernameChanged) return

    setIsUpdatingUsername(true)
    try {
      await profileApi.updateUsername(usernameValidation.trimmed)
      const refreshedUser = await refreshUser()
      if (
        !refreshedUser ||
        refreshedUser.username !== usernameValidation.trimmed
      ) {
        throw new Error("Failed to confirm username update")
      }
      setUsernameDraft(null)
      toast({
        title: "Username updated",
        description: "Your display name has been changed successfully.",
        variant: "success",
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      toast({
        title: "Update failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUsername(false)
    }
  }

  const cancelUsernameEdit = () => {
    setUsernameDraft(null)
  }

  // --- Security / Password State ---
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleUpdatePassword = async (
    e?: React.SubmitEvent<HTMLFormElement>
  ) => {
    if (e) e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords mismatch",
        description: "The new password and confirmation password do not match.",
        variant: "destructive",
      })
      return
    }

    const pwError = validatePassword(newPassword)
    if (pwError) {
      toast({
        title: "Weak password",
        description: pwError,
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)
    try {
      await profileApi.updatePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast({
        title: "Password updated",
        description: "Your account password has been changed securely.",
        variant: "success",
      })
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        await logout()
        return
      }
      toast({
        title: "Update failed",
        description: getErrorMessage(err),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // --- Push Preferences State ---
  const [pushEnabled, setPushEnabled] = useState(false)
  const [isRegisteringPush, setIsRegisteringPush] = useState(false)
  const { data: vapidData, isLoading: isLoadingVapid } = useVapidKey()
  const registerPush = useRegisterPush()

  useEffect(() => {
    let cancelled = false
    const checkPermission = async () => {
      if (!user) {
        if (!cancelled) setPushEnabled(false)
        return
      }
      if (
        "Notification" in globalThis &&
        "serviceWorker" in globalThis.navigator
      ) {
        if (globalThis.Notification.permission === "granted") {
          const registration = await globalThis.navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          if (!cancelled) {
            setPushEnabled(Boolean(subscription))
          }
        } else if (!cancelled) {
          setPushEnabled(false)
        }
      } else if (!cancelled) {
        setPushEnabled(false)
      }
    }
    void checkPermission().catch(() => {
      if (!cancelled) setPushEnabled(false)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  const handleTogglePush = async (enabled: boolean) => {
    if (isRegisteringPush) return

    if (
      !("Notification" in globalThis) ||
      !("serviceWorker" in globalThis.navigator)
    ) {
      toast({
        title: "Not supported",
        description: "Your browser does not support push notifications.",
        variant: "destructive",
      })
      return
    }

    setIsRegisteringPush(true)
    try {
      if (enabled) {
        const permission = await globalThis.Notification.requestPermission()
        if (permission !== "granted") {
          toast({
            title: "Permission denied",
            description:
              "You need to allow notifications to enable this feature.",
            variant: "destructive",
          })
          setPushEnabled(false)
          return
        }

        if (!vapidData?.public_key) {
          throw new Error(
            "Push notification service is temporarily unavailable. Please try again in a few moments."
          )
        }

        let timeoutId: ReturnType<typeof setTimeout> | undefined
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new Error(
                "Service worker initialization timed out. Please refresh the page."
              )
            )
          }, 10000)
        })

        let registration: ServiceWorkerRegistration
        try {
          registration = (await Promise.race([
            globalThis.navigator.serviceWorker.ready,
            timeoutPromise,
          ])) as ServiceWorkerRegistration
        } finally {
          if (timeoutId !== undefined) {
            clearTimeout(timeoutId)
          }
        }

        const existingSubscription =
          await registration.pushManager.getSubscription()
        if (existingSubscription) {
          await existingSubscription.unsubscribe()
        }

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            vapidData.public_key
          ) as unknown as BufferSource,
        })

        const sub = subscription.toJSON()
        try {
          await registerPush.mutateAsync({
            endpoint: sub.endpoint!,
            p256dh: sub.keys!.p256dh,
            auth: sub.keys!.auth,
          })
          setPushEnabled(true)
          toast({
            title: "Push enabled",
            description: "You will now receive notifications in this browser.",
            variant: "success",
          })
        } catch (mutateErr) {
          await subscription.unsubscribe().catch(() => {})
          if (sub.endpoint) {
            await notificationsApi
              .unregisterPushSubscription(sub.endpoint)
              .catch(() => {})
          }
          throw mutateErr
        }
      } else {
        const registration = await globalThis.navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const endpoint = subscription.endpoint
          await subscription.unsubscribe()
          if (endpoint) {
            await notificationsApi
              .unregisterPushSubscription(endpoint)
              .catch((err) => {
                console.error(
                  "Failed to unregister push subscription on server:",
                  err
                )
              })
          }
        }
        setPushEnabled(false)
        toast({
          title: "Push disabled",
          description:
            "You will no longer receive notifications in this browser.",
        })
      }
    } catch (err) {
      if (enabled) {
        console.error("Failed to subscribe to push notifications:", err)
        setPushEnabled(false)

        let description = "Could not register for push notifications."
        if (
          err instanceof Error &&
          err.message.includes("push service error")
        ) {
          description =
            "Your browser's push service is unavailable. If using Brave, enable 'Use Google Services for Push Messaging' in Privacy settings."
        }

        toast({
          title: "Setup failed",
          description,
          variant: "destructive",
        })
      } else {
        console.error("Failed to unsubscribe from push notifications:", err)
      }
    } finally {
      setIsRegisteringPush(false)
    }
  }

  return {
    user,
    // Username slice
    username: {
      draft: usernameDraft,
      setDraft: setUsernameDraft,
      effectiveUsername,
      validation: usernameValidation,
      hasChanged: hasUsernameChanged,
      isUpdating: isUpdatingUsername,
      update: handleUpdateUsername,
      cancel: cancelUsernameEdit,
    },
    // Security / Password slice
    security: {
      currentPassword,
      setCurrentPassword,
      newPassword,
      setNewPassword,
      confirmPassword,
      setConfirmPassword,
      showCurrentPassword,
      setShowCurrentPassword,
      showNewPassword,
      setShowNewPassword,
      showConfirmPassword,
      setShowConfirmPassword,
      isUpdating: isUpdatingPassword,
      update: handleUpdatePassword,
      passwordRules: PASSWORD_RULES,
    },
    // Preferences slice
    preferences: {
      timeFormat,
      setTimeFormat,
      pushEnabled,
      isRegisteringPush,
      isLoadingVapid,
      togglePush: handleTogglePush,
    },
    // Confirmation preferences slice
    confirmations: {
      settings: CONFIRMATION_SETTINGS,
      userPreferences: preferences,
    },
  }
}

export type ProfileViewModel = ReturnType<typeof useProfileViewModel>
