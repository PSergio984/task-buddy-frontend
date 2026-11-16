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

vi.mock("@/hooks/useNotifications", () => ({
  useVapidKey: () => ({ data: { public_key: "test_key" }, isLoading: false }),
  useRegisterPush: () => ({ mutateAsync: vi.fn() }),
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
})
