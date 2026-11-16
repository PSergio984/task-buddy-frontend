import React from "react"
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useLoginViewModel } from "./useLoginViewModel"

const loginMock = vi.fn()
const navigateMock = vi.fn()
const toastMock = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
    loading: false,
  }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

describe("useLoginViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loginMock.mockResolvedValue({})
  })

  it("validates empty form on submission", async () => {
    const { result } = renderHook(() => useLoginViewModel())
    expect(result.current.isFormValid).toBe(false)

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(result.current.submitAttempted).toBe(true)
    expect(loginMock).not.toHaveBeenCalled()
  })

  it("submits valid credentials and navigates to dashboard", async () => {
    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail("user@example.com")
      result.current.setPassword("ValidPassword123!")
    })

    expect(result.current.isFormValid).toBe(true)

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(loginMock).toHaveBeenCalledWith({
      username: "user@example.com",
      password: "ValidPassword123!",
    })
    expect(navigateMock).toHaveBeenCalledWith("/dashboard")
  })

  it("redirects to /verify-email on unconfirmed email without error toast", async () => {
    const unconfirmedErr = {
      isAxiosError: true,
      response: {
        status: 401,
        data: { detail: "Email not confirmed" },
      },
    }
    loginMock.mockRejectedValueOnce(unconfirmedErr)

    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail("unverified@example.com")
      result.current.setPassword("ValidPassword123!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(navigateMock).toHaveBeenCalledWith("/verify-email")
    expect(toastMock).not.toHaveBeenCalled()
  })

  it("handles general authentication failure with error toast and no navigation", async () => {
    loginMock.mockRejectedValueOnce(new Error("Invalid credentials"))

    const { result } = renderHook(() => useLoginViewModel())

    act(() => {
      result.current.setEmail("user@example.com")
      result.current.setPassword("ValidPassword123!")
    })

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent<HTMLFormElement>

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(navigateMock).not.toHaveBeenCalled()
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Authentication failed",
        variant: "destructive",
      })
    )
  })
})
