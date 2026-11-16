import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { useGameProfileViewModel } from "./useGameProfileViewModel"

const allocateMutate = vi.fn()
const updateCharacterMutate = vi.fn()
const selectClassMutate = vi.fn()
const respecMutate = vi.fn()
const buyGearMutate = vi.fn()
const equipGearMutate = vi.fn()
const refetchProfileMock = vi.fn()

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => true,
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({
    data: { id: "p1", level: 5, gold: 100 },
    isPending: false,
    isError: false,
    refetch: refetchProfileMock,
  }),
}))

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual("@tanstack/react-query")
  return {
    ...actual,
    useMutationState: () => [],
  }
})

vi.mock("@/hooks/useGameCharacter", () => ({
  GEAR_BUY_MUTATION_KEY: ["gear-buy"],
  GEAR_EQUIP_MUTATION_KEY: ["gear-equip"],
  useAllocateStats: () => ({ mutate: allocateMutate, isPending: false }),
  useUpdateCharacter: () => ({
    mutate: updateCharacterMutate,
    isPending: false,
  }),
  useSelectClass: () => ({ mutate: selectClassMutate, isPending: false }),
  useRespec: () => ({ mutate: respecMutate, isPending: false }),
  useGear: () => ({
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useBuyGear: () => ({ mutate: buyGearMutate, isPending: false }),
  useEquipGear: () => ({ mutate: equipGearMutate, isPending: false }),
  useAchievements: () => ({
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useActivityGrid: () => ({
    data: [],
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useActivityStats: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

describe("useGameProfileViewModel", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("exposes profile and gear data cleanly", () => {
    const { result } = renderHook(() => useGameProfileViewModel())
    expect(result.current.profile).toEqual({ id: "p1", level: 5, gold: 100 })
    expect(result.current.writesDisabled).toBe(false)
    expect(result.current.characterBusy).toBe(false)
  })

  it("delegates mutations through ViewModel actions", () => {
    const { result } = renderHook(() => useGameProfileViewModel())

    act(() => {
      result.current.allocateStat("str")
    })
    expect(allocateMutate).toHaveBeenCalledWith({ str: 1 })

    act(() => {
      result.current.setAutoAllocate(true)
    })
    expect(updateCharacterMutate).toHaveBeenCalledWith(true)

    act(() => {
      result.current.selectClass("warrior")
    })
    expect(selectClassMutate).toHaveBeenCalledWith("warrior")

    act(() => {
      result.current.respecStats()
    })
    expect(respecMutate).toHaveBeenCalled()

    act(() => {
      result.current.buyGear("sword_1")
    })
    expect(buyGearMutate).toHaveBeenCalledWith("sword_1")

    act(() => {
      result.current.equipGear("sword_1", true)
    })
    expect(equipGearMutate).toHaveBeenCalledWith({
      key: "sword_1",
      equipped: true,
    })

    act(() => {
      result.current.refetchProfile()
    })
    expect(refetchProfileMock).toHaveBeenCalled()
  })
})
