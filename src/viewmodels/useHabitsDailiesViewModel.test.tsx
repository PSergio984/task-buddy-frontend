import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient } from "@tanstack/react-query"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeWrapper, profile, SERVER_TIME } from "@/hooks/game-hook-test-utils"
import { useHabitsDailiesViewModel } from "./useHabitsDailiesViewModel"
import { habitsApi, dailiesApi } from "@/lib/api"

vi.mock("@/lib/api", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/api")>()
  return {
    ...mod,
    habitsApi: {
      ...mod.habitsApi,
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      click: vi.fn(),
    },
    dailiesApi: {
      ...mod.dailiesApi,
      list: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      check: vi.fn(),
    },
  }
})

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: vi.fn().mockReturnValue(true),
}))

describe("useHabitsDailiesViewModel", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  it("exposes structured reactive state and action handlers", () => {
    const { result } = renderHook(() => useHabitsDailiesViewModel(), {
      wrapper: makeWrapper(queryClient),
    })

    expect(result.current.isOnline).toBe(true)
    expect(result.current.writesDisabled).toBe(false)
    expect(result.current.habitsBusy).toBe(false)
    expect(result.current.dailiesBusy).toBe(false)
    expect(result.current.clickingIds).toBeInstanceOf(Set)
    expect(result.current.checkingIds).toBeInstanceOf(Set)
    expect(typeof result.current.handleClickHabit).toBe("function")
    expect(typeof result.current.handleCheckDaily).toBe("function")
  })

  it("triggers click mutation with unique idempotency keys and tracks in-flight state", async () => {
    let resolveClick!: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolveClick = resolve
    })

    vi.mocked(habitsApi.click).mockReturnValueOnce(
      pendingPromise as unknown as ReturnType<typeof habitsApi.click>
    )

    const { result } = renderHook(() => useHabitsDailiesViewModel(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.handleClickHabit(42, "positive")
    })

    await waitFor(() => {
      expect(result.current.clickingIds.has(42)).toBe(true)
    })

    act(() => {
      resolveClick({
        habit: {
          id: 42,
          title: "Test Habit",
          notes: null,
          direction: "positive",
          difficulty: "easy",
          value: 1,
          counter: 1,
          bind_focus: false,
          reminder_times: [],
          created_at: "2026-11-01T10:00:00Z",
          updated_at: "2026-11-01T10:00:00Z",
        },
        profile,
        status: "applied",
        server_time: SERVER_TIME,
      })
    })

    await waitFor(() => {
      expect(result.current.clickingIds.has(42)).toBe(false)
    })

    vi.mocked(habitsApi.click).mockResolvedValueOnce({
      habit: {
        id: 42,
        title: "Test Habit",
        notes: null,
        direction: "positive",
        difficulty: "easy",
        value: 1,
        counter: 1,
        bind_focus: false,
        reminder_times: [],
        created_at: "2026-11-01T10:00:00Z",
        updated_at: "2026-11-01T10:00:00Z",
      },
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })

    act(() => {
      result.current.handleClickHabit(42, "positive")
    })

    await waitFor(() => {
      expect(habitsApi.click).toHaveBeenCalledTimes(2)
    })

    const key1 = vi.mocked(habitsApi.click).mock.calls[0][2]
    const key2 = vi.mocked(habitsApi.click).mock.calls[1][2]
    expect(key1).toMatch(/^[a-zA-Z0-9_-]+$/)
    expect(key2).toMatch(/^[a-zA-Z0-9_-]+$/)
    expect(key1).not.toBe(key2)
  })

  it("triggers check mutation with unique idempotency keys and tracks in-flight state", async () => {
    let resolveCheck!: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolveCheck = resolve
    })

    vi.mocked(dailiesApi.check).mockReturnValueOnce(
      pendingPromise as unknown as ReturnType<typeof dailiesApi.check>
    )

    const { result } = renderHook(() => useHabitsDailiesViewModel(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.handleCheckDaily(99, { done: true })
    })

    await waitFor(() => {
      expect(result.current.checkingIds.has(99)).toBe(true)
    })

    act(() => {
      resolveCheck({
        daily: {
          id: 99,
          title: "Test Daily",
          notes: null,
          difficulty: "easy",
          recurrence: { kind: "daily" },
          streak: 1,
          active: true,
          reminder_times: [],
          items: [],
          completed_today: true,
          created_at: "2026-11-01T10:00:00Z",
          updated_at: "2026-11-01T10:00:00Z",
        },
        profile,
        status: "applied",
        server_time: SERVER_TIME,
      })
    })

    await waitFor(() => {
      expect(result.current.checkingIds.has(99)).toBe(false)
    })

    vi.mocked(dailiesApi.check).mockResolvedValueOnce({
      daily: {
        id: 99,
        title: "Test Daily",
        notes: null,
        difficulty: "easy",
        recurrence: { kind: "daily" },
        streak: 1,
        active: true,
        reminder_times: [],
        items: [],
        completed_today: true,
        created_at: "2026-11-01T10:00:00Z",
        updated_at: "2026-11-01T10:00:00Z",
      },
      profile,
      status: "applied",
      server_time: SERVER_TIME,
    })

    act(() => {
      result.current.handleCheckDaily(99, { done: true })
    })

    await waitFor(() => {
      expect(dailiesApi.check).toHaveBeenCalledTimes(2)
    })

    const key1 = vi.mocked(dailiesApi.check).mock.calls[0][2]
    const key2 = vi.mocked(dailiesApi.check).mock.calls[1][2]
    expect(key1).toMatch(/^[a-zA-Z0-9_-]+$/)
    expect(key2).toMatch(/^[a-zA-Z0-9_-]+$/)
    expect(key1).not.toBe(key2)
  })
})
