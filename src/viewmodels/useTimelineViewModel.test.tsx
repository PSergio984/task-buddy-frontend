import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useTimelineViewModel } from "./useTimelineViewModel"
import { todayUtcDay, addUtcDays } from "@/models/diary.model"

const TODAY = todayUtcDay()
const refetchMock = vi.fn()

vi.mock("@/hooks/useDiary", () => ({
  useTimelineDay: (day: string, beyondHorizon: boolean) => ({
    data: beyondHorizon
      ? undefined
      : {
          date: day,
          server_time: `${day}T12:00:00Z`,
          sessions: [],
          markers: [],
          diary: [],
        },
    isPending: false,
    isError: false,
    refetch: refetchMock,
  }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({ data: { retention: "forever" } }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

describe("useTimelineViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("initializes with today and computes timeline", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    expect(result.current.day).toBe(TODAY)
    expect(result.current.beyondHorizon).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(result.current.timeline).not.toBeNull()
  })

  it("updates day upon calling setDay", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    const yesterday = addUtcDays(TODAY, -1)

    act(() => {
      result.current.setDay(yesterday)
    })

    expect(result.current.day).toBe(yesterday)
  })

  it("calls refetch on underlying query", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    act(() => {
      result.current.refetch()
    })
    expect(refetchMock).toHaveBeenCalled()
  })
})
