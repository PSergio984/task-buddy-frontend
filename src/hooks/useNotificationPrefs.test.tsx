import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AxiosError } from "axios"
// AuthContext/useToast/useGameProfile mocks come from the shared utils —
// a local vi.mock for them would be dead (the imported mocks win), and the
// swap test needs the mutable authUser those register.
import { authUser, deferred, makeWrapper } from "./game-hook-test-utils"
import {
  useNotificationPrefs,
  useUpdateNotificationPrefs,
} from "./useNotificationPrefs"
import { notificationPrefsApi, type NotificationPrefs } from "@/lib/api"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    notificationPrefsApi: { get: vi.fn(), put: vi.fn() },
  }
})

const PREFS_KEY = ["notification-prefs", { userId: 1 }]

function prefsData(
  overrides: Partial<NotificationPrefs> = {}
): NotificationPrefs {
  return {
    prefs: {
      habit_reminder: { in_app: true, push: true, email: false },
    },
    quiet_hours: { start: "22:00", end: "08:00", timezone: "UTC" },
    ...overrides,
  }
}

describe("useNotificationPrefs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("fetches the prefs row", async () => {
    vi.mocked(notificationPrefsApi.get).mockResolvedValue(prefsData())
    const queryClient = new QueryClient()
    const { result } = renderHook(() => useNotificationPrefs(), {
      wrapper: makeWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(notificationPrefsApi.get).toHaveBeenCalled()
    expect(result.current.data).toEqual(prefsData())
  })
})

describe("useUpdateNotificationPrefs", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("applies the PUT optimistically, then folds the saved copy into the cache", async () => {
    const held = deferred<NotificationPrefs>()
    vi.mocked(notificationPrefsApi.put).mockImplementation(() => held.promise)
    const queryClient = new QueryClient()
    queryClient.setQueryData(PREFS_KEY, prefsData())
    const { result } = renderHook(() => useUpdateNotificationPrefs(), {
      wrapper: makeWrapper(queryClient),
    })

    const next = prefsData({
      prefs: {
        habit_reminder: { in_app: true, push: false, email: false },
      },
    })
    act(() => {
      result.current.mutate(next)
    })

    // Optimistic — the cache reflects the write before the server answers
    // (onMutate's cancel-then-write resolves inside a microtask).
    await waitFor(() =>
      expect(queryClient.getQueryData(PREFS_KEY)).toEqual(next)
    )
    expect(notificationPrefsApi.put).toHaveBeenCalledWith(next)

    // The response is authoritative — it replaces even the optimistic copy.
    const saved = prefsData({
      prefs: {
        habit_reminder: { in_app: true, push: false, email: false },
        streak_risk: { in_app: true, push: true, email: false },
      },
    })
    await act(async () => {
      held.resolve(saved)
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(PREFS_KEY)).toEqual(saved)
  })

  it("rolls the cache back and resyncs when the PUT fails", async () => {
    vi.mocked(notificationPrefsApi.put).mockRejectedValue(
      new AxiosError("boom")
    )
    const queryClient = new QueryClient()
    const previous = prefsData()
    queryClient.setQueryData(PREFS_KEY, previous)
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useUpdateNotificationPrefs(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate(
        prefsData({
          quiet_hours: { start: "21:00", end: "07:00", timezone: "UTC" },
        })
      )
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    // Rolled back to the pre-write copy — a timeout may still have committed
    // server-side, so the settle-time resync re-reads regardless.
    expect(queryClient.getQueryData(PREFS_KEY)).toEqual(previous)
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["notification-prefs", { userId: 1 }],
    })
  })

  it("folds under the account that fired the write when auth swaps mid-flight", async () => {
    // React Query swaps a pending mutation's options onto the latest render,
    // so the success path sees the NEW user — the owner must come from the
    // onMutate context captured at mutate() time.
    const held = deferred<NotificationPrefs>()
    vi.mocked(notificationPrefsApi.put).mockImplementation(() => held.promise)
    const queryClient = new QueryClient()
    queryClient.setQueryData(PREFS_KEY, prefsData())
    const { result, rerender } = renderHook(
      () => useUpdateNotificationPrefs(),
      {
        wrapper: makeWrapper(queryClient),
      }
    )

    act(() => {
      result.current.mutate(
        prefsData({
          quiet_hours: { start: "21:00", end: "07:00", timezone: "UTC" },
        })
      )
    })
    await waitFor(() => expect(result.current.isPending).toBe(true))

    try {
      // Logout → login as another account while the write is in flight.
      authUser.id = 2
      rerender()
      const saved = prefsData()
      await act(async () => {
        held.resolve(saved)
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      // The saved copy lands under the account that fired the write.
      expect(queryClient.getQueryData(PREFS_KEY)).toEqual(saved)
      expect(
        queryClient.getQueryData(["notification-prefs", { userId: 2 }])
      ).toBeUndefined()
    } finally {
      authUser.id = 1
    }
  })

  it("resyncs broadly when the mutate-time context never lands", async () => {
    // An onMutate that throws (here: cancelQueries rejects) leaves context
    // undefined — a { userId: undefined } partial key would miss the real
    // cache entry, so onSettled falls back to the broad key like onError.
    vi.mocked(notificationPrefsApi.put).mockResolvedValue(prefsData())
    const queryClient = new QueryClient()
    vi.spyOn(queryClient, "cancelQueries").mockRejectedValue(new Error("boom"))
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    const { result } = renderHook(() => useUpdateNotificationPrefs(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.mutate(prefsData())
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["notification-prefs"],
    })
    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: ["notification-prefs", { userId: undefined }],
    })
  })
})
