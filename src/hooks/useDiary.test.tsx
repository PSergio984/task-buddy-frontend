import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
import type { ReactNode } from "react"
import { useCreateDiaryEntry, useDiaryEntries } from "./useDiary"
import { diaryApi } from "@/lib/api"

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    diaryApi: { ...mod.diaryApi, list: vi.fn(), create: vi.fn() },
  }
})

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useDiaryEntries", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(diaryApi.list).mockResolvedValue({
      entries: [],
      has_more: false,
    })
  })

  it("fetches the day's entries within the retention horizon", async () => {
    const queryClient = new QueryClient()
    renderHook(() => useDiaryEntries("2025-11-01"), {
      wrapper: makeWrapper(queryClient),
    })
    await waitFor(() =>
      expect(diaryApi.list).toHaveBeenCalledWith("2025-11-01")
    )
  })

  it("skips the fetch for a day beyond the retention horizon", async () => {
    const queryClient = new QueryClient()
    renderHook(() => useDiaryEntries("2020-01-01", true), {
      wrapper: makeWrapper(queryClient),
    })
    // Give the (disabled) query a tick to prove it never fires.
    await act(async () => new Promise((r) => setTimeout(r, 0)))
    expect(diaryApi.list).not.toHaveBeenCalled()
  })
})

describe("useCreateDiaryEntry", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("resyncs the diary cache when a create fails (stand-up 409 race)", async () => {
    // Two tabs race a stand-up: the loser 409s and must reload the
    // winner's row instead of retrying its own copy forever.
    vi.mocked(diaryApi.create).mockRejectedValue(new AxiosError("conflict"))
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: makeWrapper(queryClient),
    })
    act(() => {
      result.current.mutate({ kind: "standup", good: "shipped it" })
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["diary"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["timeline"] })
  })
})
