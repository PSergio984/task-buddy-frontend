import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatsPanel } from "@/components/character/stats-panel"
import { EquipmentPanel } from "@/components/character/equipment-panel"
import { AchievementsPanel } from "@/components/character/achievements-panel"
import { ActivityPanel } from "@/components/character/activity-panel"
import { TRIGGER_CLASS } from "@/models/gameProfile.model"
import { useGameProfileViewModel } from "@/viewmodels/useGameProfileViewModel"

export function GameProfilePage() {
  const vm = useGameProfileViewModel()

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

      {vm.writesDisabled && (
        <p
          role="status"
          className="rounded-2xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-xs font-bold text-amber-400"
        >
          You're offline — the sheet can be read from cache but not changed.
        </p>
      )}

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="h-auto gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
          <TabsTrigger value="stats" className={TRIGGER_CLASS}>
            Stats
          </TabsTrigger>
          <TabsTrigger value="equipment" className={TRIGGER_CLASS}>
            Equipment
          </TabsTrigger>
          <TabsTrigger value="achievements" className={TRIGGER_CLASS}>
            Achievements
          </TabsTrigger>
          <TabsTrigger value="activity" className={TRIGGER_CLASS}>
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <StatsPanel
            profile={vm.profile}
            isPending={vm.profileIsPending}
            isError={vm.profileIsError}
            isOnline={vm.isOnline}
            writesDisabled={vm.writesDisabled}
            busy={vm.characterBusy}
            onRetry={vm.refetchProfile}
            onAllocate={vm.allocateStat}
            onAutoAllocateChange={vm.setAutoAllocate}
            onSelectClass={vm.selectClass}
            onRespec={vm.respecStats}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <EquipmentPanel
            items={vm.gear}
            profile={vm.profile}
            isPending={vm.gearIsPending}
            isError={vm.gearIsError}
            isOnline={vm.isOnline}
            writesDisabled={vm.writesDisabled}
            pendingKeys={vm.pendingGearKeys}
            onRetry={vm.refetchGear}
            onBuy={vm.buyGear}
            onEquip={vm.equipGear}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementsPanel
            achievements={vm.achievements}
            isPending={vm.achievementsIsPending}
            isError={vm.achievementsIsError}
            isOnline={vm.isOnline}
            onRetry={vm.refetchAchievements}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivityPanel
            grid={vm.activityGrid}
            stats={vm.activityStats}
            gridIsPending={vm.activityGridIsPending}
            gridIsError={vm.activityGridIsError}
            statsIsPending={vm.activityStatsIsPending}
            statsIsError={vm.activityStatsIsError}
            isOnline={vm.isOnline}
            onGridRetry={vm.refetchActivityGrid}
            onStatsRetry={vm.refetchActivityStats}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
