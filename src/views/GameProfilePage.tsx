import { motion } from "framer-motion"
import { useMutationState } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsPanel } from "@/components/character/stats-panel"
import { EquipmentPanel } from "@/components/character/equipment-panel"
import { AchievementsPanel } from "@/components/character/achievements-panel"
import { ActivityPanel } from "@/components/character/activity-panel"
import { useIsOnline } from "@/hooks/useIsOnline"
import { useGameProfile } from "@/hooks/useGameProfile"
import {
  GEAR_BUY_MUTATION_KEY,
  GEAR_EQUIP_MUTATION_KEY,
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

const triggerClass =
  "rounded-xl px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all data-[state=active]:bg-primary/15 data-[state=active]:text-primary"

export function GameProfilePage() {
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

  // Pending buy/equip item keys as a SET — mutation.variables tracks only
  // the latest call (same double-submit guard as the habit click set).
  const pendingBuyKeys = useMutationState({
    filters: { mutationKey: GEAR_BUY_MUTATION_KEY, status: "pending" },
    select: (m) => m.state.variables as string,
  })
  const pendingEquipKeys = useMutationState({
    filters: { mutationKey: GEAR_EQUIP_MUTATION_KEY, status: "pending" },
    select: (m) => (m.state.variables as { key: string }).key,
  })
  const pendingGearKeys = new Set([...pendingBuyKeys, ...pendingEquipKeys])

  // No offline write-queue for character writes: gold/stat arithmetic is
  // server-side (same convention as habits/dailies and the diary domain).
  const writesDisabled = !isOnline
  const characterBusy =
    allocate.isPending ||
    updateCharacter.isPending ||
    selectClass.isPending ||
    respec.isPending

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-1 flex-col gap-8 bg-background/20 p-4 backdrop-blur-3xl md:p-8 lg:p-12"
    >
      <header className="space-y-2">
        <Badge
          variant="outline"
          className="rounded-full border-primary/20 bg-primary/5 px-4 py-1 text-[10px] font-black tracking-widest text-primary uppercase"
        >
          Character sheet
        </Badge>
        <h1 className="font-heading text-4xl leading-none font-black tracking-tighter text-foreground uppercase md:text-6xl">
          Profile
        </h1>
      </header>

      {writesDisabled && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          You're offline — the sheet can be read from cache but not changed.
        </p>
      )}

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="h-auto gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          <TabsTrigger value="stats" className={triggerClass}>
            Stats
          </TabsTrigger>
          <TabsTrigger value="equipment" className={triggerClass}>
            Equipment
          </TabsTrigger>
          <TabsTrigger value="achievements" className={triggerClass}>
            Achievements
          </TabsTrigger>
          <TabsTrigger value="activity" className={triggerClass}>
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <StatsPanel
            profile={profileQuery.data}
            isPending={profileQuery.isPending}
            isError={profileQuery.isError}
            isOnline={isOnline}
            writesDisabled={writesDisabled}
            busy={characterBusy}
            onRetry={() => void profileQuery.refetch()}
            onAllocate={(stat) => allocate.mutate({ [stat]: 1 })}
            onAutoAllocateChange={(enabled) => updateCharacter.mutate(enabled)}
            onSelectClass={(gameClass) => selectClass.mutate(gameClass)}
            onRespec={() => respec.mutate()}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <EquipmentPanel
            items={gearQuery.data}
            profile={profileQuery.data}
            isPending={gearQuery.isPending}
            isError={gearQuery.isError}
            isOnline={isOnline}
            writesDisabled={writesDisabled}
            pendingKeys={pendingGearKeys}
            onRetry={() => void gearQuery.refetch()}
            onBuy={(key) => buyGear.mutate(key)}
            onEquip={(key, equipped) => equipGear.mutate({ key, equipped })}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementsPanel
            achievements={achievementsQuery.data}
            isPending={achievementsQuery.isPending}
            isError={achievementsQuery.isError}
            isOnline={isOnline}
            onRetry={() => void achievementsQuery.refetch()}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityPanel
            grid={activityGridQuery.data}
            stats={activityStatsQuery.data}
            gridIsPending={activityGridQuery.isPending}
            gridIsError={activityGridQuery.isError}
            statsIsPending={activityStatsQuery.isPending}
            statsIsError={activityStatsQuery.isError}
            isOnline={isOnline}
            onGridRetry={() => void activityGridQuery.refetch()}
            onStatsRetry={() => void activityStatsQuery.refetch()}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
