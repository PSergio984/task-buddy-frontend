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

let mockIsOnline = true
let mockCharacterBusy = false
let mockMutationVariables: unknown[] = []

vi.mock("@/hooks/useIsOnline", () => ({
  useIsOnline: () => mockIsOnline,
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
    useMutationState: () => mockMutationVariables,
  }
})

vi.mock("@/hooks/useGameCharacter", () => ({
  GEAR_BUY_MUTATION_KEY: ["gear-buy"],
  GEAR_EQUIP_MUTATION_KEY: ["gear-equip"],
  useAllocateStats: () => ({ mutate: allocateMutate, isPending: false }),
  useUpdateCharacter: () => ({
    mutate: updateCharacterMutate,
    isPending: mockCharacterBusy,
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
    mockIsOnline = true
    mockCharacterBusy = false
    mockMutationVariables = []
  })

  it("exposes active character state and queries", () => {
    const { result } = renderHook(() => useGameProfileViewModel())

    expect(result.current.isOnline).toBe(true)
    expect(result.current.writesDisabled).toBe(false)
    expect(result.current.characterBusy).toBe(false)
    expect(result.current.profile?.level).toBe(5)
    expect(result.current.pendingGearKeys.size).toBe(0)
  })

  it("disables writes when user is offline", () => {
    mockIsOnline = false
    const { result } = renderHook(() => useGameProfileViewModel())

    expect(result.current.isOnline).toBe(false)
    expect(result.current.writesDisabled).toBe(true)
  })

  it("reports characterBusy when a character mutation is in flight", () => {
    mockCharacterBusy = true
    const { result } = renderHook(() => useGameProfileViewModel())

    expect(result.current.characterBusy).toBe(true)
  })

  it("exposes pending gear keys for in-flight buy and equip mutations", () => {
    mockMutationVariables = ["iron_helm", "magic_wand"]
    const { result } = renderHook(() => useGameProfileViewModel())

    expect(result.current.pendingGearKeys.has("iron_helm")).toBe(true)
    expect(result.current.pendingGearKeys.has("magic_wand")).toBe(true)
  })

  it("triggers character actions through ViewModel handlers", () => {
    const { result } = renderHook(() => useGameProfileViewModel())

    act(() => {
      result.current.allocateStat("str")
    })
    expect(allocateMutate).toHaveBeenCalledWith({ str: 1 })

    act(() => {
      result.current.selectClass("warrior")
    })
    expect(selectClassMutate).toHaveBeenCalledWith("warrior")

    act(() => {
      result.current.respecStats()
    })
    expect(respecMutate).toHaveBeenCalled()

    act(() => {
      result.current.buyGear("sword-1")
    })
    expect(buyGearMutate).toHaveBeenCalledWith("sword-1")

    act(() => {
      result.current.equipGear("sword-1", true)
    })
    expect(equipGearMutate).toHaveBeenCalledWith({
      key: "sword-1",
      equipped: true,
    })

    act(() => {
      result.current.refetchProfile()
    })
    expect(refetchProfileMock).toHaveBeenCalled()
  })
})
