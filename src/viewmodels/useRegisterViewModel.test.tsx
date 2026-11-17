import React from "react"
import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useRegisterViewModel } from "./useRegisterViewModel"

const registerMock = vi.fn()
const navigateMock = vi.fn()
const toastMock = vi.fn()

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    register: registerMock,
    loading: false,
  }),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

describe("useRegisterViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    registerMock.mockResolvedValue({})
  })

  it("identifies invalid form inputs and prevents registration", async () => {
    const { result } = renderHook(() => useRegisterViewModel())
    expect(result.current.isFormValid).toBe(false)

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(registerMock).not.toHaveBeenCalled()
  })

  it("submits valid registration details and routes to verify-email", async () => {
    const { result } = renderHook(() => useRegisterViewModel())

    act(() => {
      result.current.setUsername("newuser")
      result.current.setEmail("newuser@example.com")
      result.current.setPassword("StrongPass123!@#")
      result.current.setConfirmPassword("StrongPass123!@#")
    })

    expect(result.current.isFormValid).toBe(true)

    const fakeEvent = {
      preventDefault: vi.fn(),
    } as unknown as React.SubmitEvent

    await act(async () => {
      await result.current.handleSubmit(fakeEvent)
    })

    expect(registerMock).toHaveBeenCalledWith({
      username: "newuser",
      email: "newuser@example.com",
      password: "StrongPass123!@#",
    })
    expect(navigateMock).toHaveBeenCalledWith("/verify-email")
  })
})
