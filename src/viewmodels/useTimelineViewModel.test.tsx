import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useTimelineViewModel } from "./useTimelineViewModel"
import { todayUtcDay, addUtcDays } from "@/models/diary.model"

const TODAY = todayUtcDay()
const refetchMock = vi.fn()
const timelineDaySpy = vi.fn()

let mockProfileRetention: "forever" | "90d" | "1y" = "forever"

vi.mock("@/hooks/useDiary", () => ({
  useTimelineDay: (day: string, beyondHorizon: boolean) => {
    timelineDaySpy(day, beyondHorizon)
    return {
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
    }
  },
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({ data: { retention: mockProfileRetention } }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

describe("useTimelineViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfileRetention = "forever"
  })

  it("initializes with today and computes timeline", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    expect(result.current.day).toBe(TODAY)
    expect(result.current.beyondHorizon).toBe(false)
    expect(result.current.isPending).toBe(false)
    expect(result.current.timeline).not.toBeNull()
    expect(timelineDaySpy).toHaveBeenCalledWith(TODAY, false)
  })

  it("updates day upon calling setDay and updates underlying query parameter", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    const yesterday = addUtcDays(TODAY, -1)

    act(() => {
      result.current.setDay(yesterday)
    })

    expect(result.current.day).toBe(yesterday)
    expect(timelineDaySpy).toHaveBeenCalledWith(yesterday, false)
  })

  it("enforces retention cutoff and suppresses timeline data beyond horizon", () => {
    mockProfileRetention = "90d"
    const { result } = renderHook(() => useTimelineViewModel())
    const beyondDay = addUtcDays(TODAY, -100)

    act(() => {
      result.current.setDay(beyondDay)
    })

    expect(result.current.day).toBe(beyondDay)
    expect(result.current.beyondHorizon).toBe(true)
    expect(result.current.timeline).toBeNull()
    expect(timelineDaySpy).toHaveBeenCalledWith(beyondDay, true)
  })

  it("calls refetch on underlying query", () => {
    const { result } = renderHook(() => useTimelineViewModel())
    act(() => {
      result.current.refetch()
    })
    expect(refetchMock).toHaveBeenCalled()
  })
})
