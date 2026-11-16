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

  it("triggers click mutation with generated idempotency key", async () => {
    vi.mocked(habitsApi.click).mockResolvedValue({
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

    const { result } = renderHook(() => useHabitsDailiesViewModel(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.handleClickHabit(42, "positive")
    })

    await waitFor(() => {
      expect(habitsApi.click).toHaveBeenCalledTimes(1)
    })
    expect(habitsApi.click).toHaveBeenCalledWith(
      42,
      "positive",
      expect.stringMatching(/^[a-zA-Z0-9_-]+$/)
    )
  })

  it("triggers check mutation with generated idempotency key", async () => {
    vi.mocked(dailiesApi.check).mockResolvedValue({
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

    const { result } = renderHook(() => useHabitsDailiesViewModel(), {
      wrapper: makeWrapper(queryClient),
    })

    act(() => {
      result.current.handleCheckDaily(99, { done: true })
    })

    await waitFor(() => {
      expect(dailiesApi.check).toHaveBeenCalledTimes(1)
    })
    expect(dailiesApi.check).toHaveBeenCalledWith(
      99,
      { done: true },
      expect.stringMatching(/^[a-zA-Z0-9_-]+$/)
    )
  })
})
