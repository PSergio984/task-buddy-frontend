import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useDiaryViewModel } from "./useDiaryViewModel"
import { todayUtcDay, addUtcDays } from "@/models/diary.model"

const TODAY = todayUtcDay()

const updateMutate = vi.fn()
const createMutate = vi.fn()
const deleteMutate = vi.fn()
const retentionMutate = vi.fn()
const refetchMock = vi.fn()

vi.mock("@/hooks/useDiary", () => ({
  useDiaryEntries: (day: string, beyondHorizon: boolean) => ({
    data: beyondHorizon
      ? undefined
      : {
          entries: [
            { id: 1, kind: "freeform", entry_date: day, freeform: "test note" },
          ],
        },
    isPending: false,
    isError: false,
    refetch: refetchMock,
  }),
  useCreateDiaryEntry: () => ({ mutate: createMutate, isPending: false }),
  useUpdateDiaryEntry: () => ({ mutateAsync: updateMutate, isPending: false }),
  useDeleteDiaryEntry: () => ({ mutate: deleteMutate, isPending: false }),
  useUpdateRetention: () => ({ mutate: retentionMutate, isPending: false }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({ data: { retention: "90d" } }),
}))

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

describe("useDiaryViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    updateMutate.mockResolvedValue({})
  })

  it("initializes with today and exposes entries", () => {
    const { result } = renderHook(() => useDiaryViewModel())
    expect(result.current.day).toBe(TODAY)
    expect(result.current.entries).toHaveLength(1)
    expect(result.current.retention).toBe("90d")
    expect(result.current.writesDisabled).toBe(false)
  })

  it("navigating day updates day and beyondHorizon appropriately", () => {
    const { result } = renderHook(() => useDiaryViewModel())
    const yesterday = addUtcDays(TODAY, -1)

    act(() => {
      result.current.setDay(yesterday)
    })

    expect(result.current.day).toBe(yesterday)
    expect(result.current.beyondHorizon).toBe(false)
  })

  it("disables writes for future days with an informative message", () => {
    const { result } = renderHook(() => useDiaryViewModel())
    const tomorrow = addUtcDays(TODAY, 1)

    act(() => {
      result.current.setDay(tomorrow)
    })

    expect(result.current.futureDay).toBe(true)
    expect(result.current.writesDisabled).toBe(true)
    expect(result.current.disabledReason).toContain("hasn't started yet")
  })

  it("triggers mutations through ViewModel helper functions", async () => {
    const { result } = renderHook(() => useDiaryViewModel())

    act(() => {
      result.current.createStandup({
        good: " Good things ",
        bad: " Bad things ",
        next: " Next things ",
      })
    })

    expect(createMutate).toHaveBeenCalledWith({
      kind: "standup",
      entry_date: TODAY,
      good: "Good things",
      bad: "Bad things",
      next: "Next things",
    })

    act(() => {
      result.current.createFreeform("  free note  ")
    })

    expect(createMutate).toHaveBeenCalledWith({
      kind: "freeform",
      entry_date: TODAY,
      freeform: "free note",
    })

    await act(async () => {
      await result.current.updateEntry(1, { freeform: "  updated  " })
    })

    expect(updateMutate).toHaveBeenCalledWith({
      id: 1,
      patch: { freeform: "updated" },
    })

    act(() => {
      result.current.deleteEntry(1)
    })

    expect(deleteMutate).toHaveBeenCalledWith(1)

    act(() => {
      result.current.changeRetention("forever")
    })

    expect(retentionMutate).toHaveBeenCalledWith("forever")
  })
})
