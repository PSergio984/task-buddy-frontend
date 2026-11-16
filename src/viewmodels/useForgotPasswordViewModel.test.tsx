import React from "react"
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useForgotPasswordViewModel } from "./useForgotPasswordViewModel"
import { authApi } from "@/models/auth.model"

const toastMock = vi.fn()

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

describe("useForgotPasswordViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authApi, "forgotPassword").mockResolvedValue({} as never)
  })

  it("checks email validity and button disabled state", () => {
    const { result } = renderHook(() => useForgotPasswordViewModel())
    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.setEmail("invalid-email")
    })
    expect(result.current.isEmailValid).toBe(false)
    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.setEmail("valid@example.com")
    })
    expect(result.current.isEmailValid).toBe(true)
    expect(result.current.isButtonDisabled).toBe(false)
  })

  it("submits forgot password request", async () => {
    const { result } = renderHook(() => useForgotPasswordViewModel())

    act(() => {
      result.current.setEmail("user@example.com")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(authApi.forgotPassword).toHaveBeenCalledWith("user@example.com")
    expect(result.current.isSubmitted).toBe(true)
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Reset link sent" })
    )
  })
})
