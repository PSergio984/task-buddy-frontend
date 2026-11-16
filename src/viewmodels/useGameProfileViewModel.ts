import { useMutationState } from "@tanstack/react-query"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useGameProfile } from "@/hooks/useGameProfile"
import {
  useAchievements,
  useActivityGrid,
  useActivityStats,
  useAllocateStats,
  useBuyGear,
  useEquipGear,
  useGear,
  useRespec,
  useSelectClass,
  useUpdateCharacter,
} from "@/hooks/useGameCharacter"
import {
  GEAR_BUY_MUTATION_KEY,
  GEAR_EQUIP_MUTATION_KEY,
  computePendingGearKeys,
  type GameClass,
  type StatKey,
} from "@/models/gameProfile.model"

export function useGameProfileViewModel() {
  const isOnline = useIsOnline()

  const profileQuery = useGameProfile()
  const allocate = useAllocateStats()
  const updateCharacter = useUpdateCharacter()
  const selectClass = useSelectClass()
  const respec = useRespec()

  const gearQuery = useGear()
  const buyGear = useBuyGear()
  const equipGear = useEquipGear()

  const achievementsQuery = useAchievements()
  const activityGridQuery = useActivityGrid()
  const activityStatsQuery = useActivityStats()

  const pendingBuyKeys = useMutationState({
    filters: { mutationKey: GEAR_BUY_MUTATION_KEY, status: "pending" },
    select: (m) => m.state.variables as string,
  })
  const pendingEquipKeys = useMutationState({
    filters: { mutationKey: GEAR_EQUIP_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { key: string }).key,
  })
  const pendingGearKeys = computePendingGearKeys(
    pendingBuyKeys,
    pendingEquipKeys
  )

  const writesDisabled = !isOnline
  const characterBusy =
    allocate.isPending ||
    updateCharacter.isPending ||
    selectClass.isPending ||
    respec.isPending

  const handleAllocate = (stat: StatKey) => {
    allocate.mutate({ [stat]: 1 })
  }

  const handleAutoAllocateChange = (enabled: boolean) => {
    updateCharacter.mutate(enabled)
  }

  const handleSelectClass = (gameClass: GameClass) => {
    selectClass.mutate(gameClass)
  }

  const handleRespec = () => {
    respec.mutate()
  }

  const handleBuy = (key: string) => {
    buyGear.mutate(key)
  }

  const handleEquip = (key: string, equipped: boolean) => {
    equipGear.mutate({ key, equipped })
  }

  return {
    isOnline,
    writesDisabled,
    characterBusy,
    profile: profileQuery.data,
    profileIsPending: profileQuery.isPending,
    profileIsError: profileQuery.isError,
    gear: gearQuery.data,
    gearIsPending: gearQuery.isPending,
    gearIsError: gearQuery.isError,
    pendingGearKeys,
    achievements: achievementsQuery.data,
    achievementsIsPending: achievementsQuery.isPending,
    achievementsIsError: achievementsQuery.isError,
    activityGrid: activityGridQuery.data,
    activityGridIsPending: activityGridQuery.isPending,
    activityGridIsError: activityGridQuery.isError,
    activityStats: activityStatsQuery.data,
    activityStatsIsPending: activityStatsQuery.isPending,
    activityStatsIsError: activityStatsQuery.isError,
    refetchProfile: () => profileQuery.refetch(),
    allocateStat: handleAllocate,
    setAutoAllocate: handleAutoAllocateChange,
    selectClass: handleSelectClass,
    respecStats: handleRespec,
    refetchGear: () => gearQuery.refetch(),
    buyGear: handleBuy,
    equipGear: handleEquip,
    refetchAchievements: () => achievementsQuery.refetch(),
    refetchActivityGrid: () => activityGridQuery.refetch(),
    refetchActivityStats: () => activityStatsQuery.refetch(),
  }
}

export type GameProfileViewModel = ReturnType<typeof useGameProfileViewModel>
