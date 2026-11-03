import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { EquipmentPanel } from "./equipment-panel"
import type { GameProfile, GearItem } from "@/lib/api"

function profile(overrides: Partial<GameProfile> = {}): GameProfile {
  return {
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    hp: 50,
    max_hp: 50,
    gold: 5,
    str_stat: 0,
    int_stat: 0,
    con_stat: 0,
    per_stat: 0,
    unspent_stat_points: 0,
    game_class: "warrior",
    class_unlocked: true,
    auto_allocate: false,
    avatar_config: {},
    xp_today: 0,
    gold_today: 0,
    retention: "forever",
    ...overrides,
  }
}

function gear(overrides: Partial<GearItem> = {}): GearItem {
  return {
    key: "warrior-weapon-1",
    name: "Training Sword",
    slot: "weapon",
    klass: "warrior",
    tier: 1,
    stats: { str: 3 },
    cost: 100,
    losable: true,
    owned: false,
    equipped: false,
    ...overrides,
  }
}

function renderPanel(
  items: GearItem[],
  p: GameProfile,
  props: Record<string, unknown> = {}
) {
  return render(
    <EquipmentPanel
      items={items}
      profile={p}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      {...props}
    />
  )
}

describe("EquipmentPanel", () => {
  it("disables buy when gold can't cover the cost", () => {
    const onBuy = vi.fn()
    renderPanel([gear()], profile({ gold: 5 }), { onBuy })

    expect(screen.getByLabelText("Buy Training Sword")).toBeDisabled()
    expect(screen.getByText(/Not enough gold/)).toBeInTheDocument()
    expect(onBuy).not.toHaveBeenCalled()
  })

  it("sends the item key on an affordable buy", () => {
    const onBuy = vi.fn()
    renderPanel([gear()], profile({ gold: 150 }), { onBuy })

    fireEvent.click(screen.getByLabelText("Buy Training Sword"))
    expect(onBuy).toHaveBeenCalledWith("warrior-weapon-1")
  })

  it("keeps the next ladder tier locked until the previous is owned", () => {
    const t1 = gear()
    const t2 = gear({
      key: "warrior-weapon-2",
      name: "Broad Sword",
      tier: 2,
      cost: 10,
    })
    renderPanel([t1, t2], profile({ gold: 500 }))
    expect(screen.getByLabelText("Buy Broad Sword")).toBeDisabled()
    expect(screen.getByText(/previous tier/)).toBeInTheDocument()
  })

  it("offers equip on owned gear and unequip on worn gear", () => {
    const onEquip = vi.fn()
    renderPanel(
      [
        gear({ owned: true }),
        gear({
          key: "traveller-boots",
          name: "Traveller Boots",
          slot: "body",
          klass: "all",
          owned: true,
          equipped: true,
        }),
      ],
      profile({ gold: 0 }),
      { onEquip }
    )

    fireEvent.click(screen.getByLabelText("Equip Training Sword"))
    expect(onEquip).toHaveBeenCalledWith("warrior-weapon-1", true)
    fireEvent.click(screen.getByLabelText("Unequip Traveller Boots"))
    expect(onEquip).toHaveBeenCalledWith("traveller-boots", false)
  })

  it("locks equipping an owned cross-class piece — set_equipped rejects it", () => {
    const onEquip = vi.fn()
    renderPanel(
      [
        gear({ owned: true }),
        gear({
          key: "mage-staff-1",
          name: "Apprentice Staff",
          klass: "mage",
          owned: true,
        }),
      ],
      profile({ game_class: "warrior" }),
      { onEquip }
    )

    const locked = screen.getByLabelText("Equip Apprentice Staff")
    expect(locked).toBeDisabled()
    expect(locked).toHaveAttribute("title", "Class locked")
    // Same-class and 'all'-class owned pieces still equip.
    expect(screen.getByLabelText("Equip Training Sword")).toBeEnabled()
    fireEvent.click(locked)
    expect(onEquip).not.toHaveBeenCalled()
  })

  it("disables writes without a claimed reason while the profile is missing", () => {
    render(
      <EquipmentPanel
        items={[gear()]}
        profile={undefined}
        isPending={false}
        isError={false}
        isOnline
        onRetry={vi.fn()}
      />
    )
    expect(screen.getByLabelText("Buy Training Sword")).toBeDisabled()
    expect(screen.queryByText(/Not enough gold/)).not.toBeInTheDocument()
  })

  it("explains the missing cache on an offline cold-open", () => {
    render(
      <EquipmentPanel
        items={undefined}
        profile={undefined}
        isPending
        isError={false}
        isOnline={false}
        writesDisabled
        onRetry={vi.fn()}
      />
    )
    expect(
      screen.getByText(/gear catalog isn't in the local cache/)
    ).toBeInTheDocument()
  })
})
