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
