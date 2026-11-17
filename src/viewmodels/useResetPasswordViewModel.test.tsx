import React from "react"
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useResetPasswordViewModel } from "./useResetPasswordViewModel"
import { authApi } from "@/models/auth.model"

const navigateMock = vi.fn()
const toastMock = vi.fn()

vi.mock("react-router-dom", () => ({
  useParams: () => ({ token: "dummy_token" }),
  useNavigate: () => navigateMock,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

describe("useResetPasswordViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authApi, "resetPassword").mockResolvedValue({} as never)
  })

  it("checks password matching and strength", () => {
    const { result } = renderHook(() => useResetPasswordViewModel())
    expect(result.current.token).toBe("dummy_token")
    expect(result.current.passwordsMatch).toBe(false)

    act(() => {
      result.current.setNewPassword("StrongPassword123!")
      result.current.setConfirmPassword("StrongPassword123!")
    })

    expect(result.current.passwordsMatch).toBe(true)
    expect(result.current.isPasswordStrong).toBe(true)
    expect(result.current.isPasswordWeak).toBe(false)
  })

  it("rejects mismatched passwords without calling reset API", async () => {
    const { result } = renderHook(() => useResetPasswordViewModel())

    act(() => {
      result.current.setNewPassword("StrongPassword123!")
      result.current.setConfirmPassword("Different123!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.resetPassword).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Passwords mismatch" })
    )
    expect(result.current.error).toBe(
      "The new password and confirmation password do not match."
    )
  })

  it("rejects passwords shorter than 8 characters", async () => {
    const { result } = renderHook(() => useResetPasswordViewModel())

    act(() => {
      result.current.setNewPassword("Short1!")
      result.current.setConfirmPassword("Short1!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.resetPassword).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Password too short" })
    )
    expect(result.current.error).toBe(
      "Password must be at least 8 characters long."
    )
  })

  it("rejects weak passwords failing complexity rules", async () => {
    const { result } = renderHook(() => useResetPasswordViewModel())

    act(() => {
      result.current.setNewPassword("alllowercasepassword")
      result.current.setConfirmPassword("alllowercasepassword")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.resetPassword).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Password too weak" })
    )
    expect(result.current.error).toBe(
      "Choose a password that meets all strength rules."
    )
  })

  it("handles reset API rejection gracefully", async () => {
    vi.spyOn(authApi, "resetPassword").mockRejectedValueOnce(
      new Error("Token expired")
    )

    const { result } = renderHook(() => useResetPasswordViewModel())

    act(() => {
      result.current.setNewPassword("StrongPassword123!")
      result.current.setConfirmPassword("StrongPassword123!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.resetPassword).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(
      "Failed to reset password. The link may have expired or is invalid."
    )
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Reset Failed",
        variant: "destructive",
      })
    )
  })

  it("submits password reset and navigates to login", async () => {
    const { result } = renderHook(() => useResetPasswordViewModel())

    act(() => {
      result.current.setNewPassword("StrongPassword123!")
      result.current.setConfirmPassword("StrongPassword123!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.resetPassword).toHaveBeenCalledWith(
      "dummy_token",
      "StrongPassword123!"
    )
    expect(navigateMock).toHaveBeenCalledWith("/login")
  })
})
