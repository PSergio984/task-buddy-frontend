import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useProfileViewModel } from "./useProfileViewModel"
import { profileApi } from "@/models/profile.model"

const refreshUserMock = vi.fn()
const logoutMock = vi.fn()
const toastMock = vi.fn()
const setTimeFormatMock = vi.fn()
const setPreferenceMock = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", username: "original_name" },
    refreshUser: refreshUserMock,
    logout: logoutMock,
  }),
}))

vi.mock("@/contexts/SettingsContext", () => ({
  useSettings: () => ({
    timeFormat: "24h",
    setTimeFormat: setTimeFormatMock,
  }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

const mutateAsyncMock = vi.fn()
const unregisterPushMock = vi.fn().mockResolvedValue({})

vi.mock("@/lib/api", () => ({
  notificationsApi: {
    unregisterPushSubscription: (endpoint: string) =>
      unregisterPushMock(endpoint),
  },
}))

vi.mock("@/hooks/useNotifications", () => ({
  useVapidKey: () => ({ data: { public_key: "AAAA" }, isLoading: false }),
  useRegisterPush: () => ({ mutateAsync: mutateAsyncMock }),
}))

vi.mock("@/hooks/useUserPreferences", () => ({
  useUserPreferences: () => ({
    skipTaskCompletionConfirm: false,
    setPreference: setPreferenceMock,
  }),
}))

describe("useProfileViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(profileApi, "updateUsername").mockResolvedValue(undefined)
    vi.spyOn(profileApi, "updatePassword").mockResolvedValue(undefined)
  })

  it("initializes with user state and computes username validation", () => {
    const { result } = renderHook(() => useProfileViewModel())

    expect(result.current.user?.username).toBe("original_name")
    expect(result.current.username.effectiveUsername).toBe("original_name")
    expect(result.current.username.hasChanged).toBe(false)
    expect(result.current.username.validation.isValid).toBe(true)
  })

  it("handles username draft changes and valid update", async () => {
    refreshUserMock.mockResolvedValueOnce({
      id: "u1",
      username: "new_cool_name",
    })
    const { result } = renderHook(() => useProfileViewModel())

    act(() => {
      result.current.username.setDraft("new_cool_name")
    })

    expect(result.current.username.effectiveUsername).toBe("new_cool_name")
    expect(result.current.username.hasChanged).toBe(true)
    expect(result.current.username.validation.isValid).toBe(true)

    await act(async () => {
      await result.current.username.update()
    })

    expect(profileApi.updateUsername).toHaveBeenCalledWith("new_cool_name")
    expect(refreshUserMock).toHaveBeenCalled()
    expect(result.current.username.draft).toBeNull()
  })

  it("retains username draft if refresh confirmation fails", async () => {
    refreshUserMock.mockResolvedValueOnce({
      id: "u1",
      username: "original_name",
    })
    const { result } = renderHook(() => useProfileViewModel())

    act(() => {
      result.current.username.setDraft("new_cool_name")
    })

    await act(async () => {
      await result.current.username.update()
    })

    expect(profileApi.updateUsername).toHaveBeenCalledWith("new_cool_name")
    expect(result.current.username.draft).toBe("new_cool_name")
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Update failed",
        description: "Failed to confirm username update",
      })
    )
  })

  it("prevents password mismatch submissions", async () => {
    const { result } = renderHook(() => useProfileViewModel())

    act(() => {
      result.current.security.setCurrentPassword("OldPassword123!")
      result.current.security.setNewPassword("NewPassword123!")
      result.current.security.setConfirmPassword("MismatchPass123!")
    })

    await act(async () => {
      await result.current.security.update()
    })

    expect(profileApi.updatePassword).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Passwords mismatch" })
    )
  })

  it("submits valid password changes", async () => {
    const { result } = renderHook(() => useProfileViewModel())

    act(() => {
      result.current.security.setCurrentPassword("OldPass123!")
      result.current.security.setNewPassword("StrongPass123!")
      result.current.security.setConfirmPassword("StrongPass123!")
    })

    await act(async () => {
      await result.current.security.update()
    })

    expect(profileApi.updatePassword).toHaveBeenCalledWith(
      "OldPass123!",
      "StrongPass123!"
    )
    expect(result.current.security.newPassword).toBe("")
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Password updated" })
    )
  })

  it("rolls back remote and local push subscription if server registration fails", async () => {
    const unsubscribeMock = vi.fn().mockResolvedValue(true)
    const mockSubscription = {
      endpoint: "https://push.example.com/sub/123",
      keys: { p256dh: "key1", auth: "auth1" },
      toJSON: () => ({
        endpoint: "https://push.example.com/sub/123",
        keys: { p256dh: "key1", auth: "auth1" },
      }),
      unsubscribe: unsubscribeMock,
    }

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(mockSubscription),
      },
    }

    Object.defineProperty(window, "Notification", {
      writable: true,
      configurable: true,
      value: {
        permission: "default",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    })

    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
      },
    })

    mutateAsyncMock.mockRejectedValueOnce(new Error("Network server error"))

    const { result } = renderHook(() => useProfileViewModel())

    await act(async () => {
      await result.current.preferences.togglePush(true)
    })

    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    expect(unregisterPushMock).toHaveBeenCalledWith(
      "https://push.example.com/sub/123"
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Setup failed",
      })
    )
  })

  it("disables push notifications and calls unregister endpoint", async () => {
    const unsubscribeMock = vi.fn().mockResolvedValue(true)
    const mockSubscription = {
      endpoint: "https://push.example.com/sub/999",
      unsubscribe: unsubscribeMock,
    }

    const mockRegistration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(mockSubscription),
      },
    }

    Object.defineProperty(window, "Notification", {
      writable: true,
      configurable: true,
      value: {
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    })

    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: {
        ready: Promise.resolve(mockRegistration),
      },
    })

    const { result } = renderHook(() => useProfileViewModel())

    await act(async () => {
      await result.current.preferences.togglePush(false)
    })

    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    expect(unregisterPushMock).toHaveBeenCalledWith(
      "https://push.example.com/sub/999"
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Push disabled",
      })
    )
  })

  it("shows failure toast when push disable fails", async () => {
    Object.defineProperty(window, "Notification", {
      writable: true,
      configurable: true,
      value: {
        permission: "granted",
        requestPermission: vi.fn().mockResolvedValue("granted"),
      },
    })

    Object.defineProperty(navigator, "serviceWorker", {
      writable: true,
      configurable: true,
      value: {
        ready: Promise.reject(new Error("Service worker error")),
      },
    })

    const { result } = renderHook(() => useProfileViewModel())

    await act(async () => {
      await result.current.preferences.togglePush(false)
    })

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Action failed",
        variant: "destructive",
      })
    )
  })
})
