import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { AuthProvider, useAuth } from "./AuthContext"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

vi.mock("@/lib/sync-queue", () => ({
  clearMutations: vi.fn(),
}))

vi.mock("@/lib/query-client", () => ({
  queryClient: {
    clear: vi.fn(),
  },
}))

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage.clear()
  })

  it("submits email with preserved plus tags to token endpoint", async () => {
    const postSpy = vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        id: "user-123",
        username: "user+tag@example.com",
        email: "user+tag@example.com",
      },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login({
        username: "user+tag@example.com",
        password: "SecretPassword123!",
      })
    })

    expect(postSpy).toHaveBeenCalledTimes(1)
    const [url, body] = postSpy.mock.calls[0]
    expect(url).toBe("/api/v1/users/token")
    expect(body).toBeInstanceOf(URLSearchParams)
    expect((body as URLSearchParams).get("username")).toBe(
      "user+tag@example.com"
    )
    expect((body as URLSearchParams).get("password")).toBe("SecretPassword123!")
  })
})
