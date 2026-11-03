import { describe, it, expect } from "vitest"
import type { ActivityDay, GameProfile, GearItem } from "@/lib/api"
import { buildWeeks, buyBlock, classChoiceOpen } from "@/lib/game-profile"

const profile: GameProfile = {
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
  game_class: null,
  class_unlocked: false,
  auto_allocate: false,
  avatar_config: {},
  xp_today: 0,
  gold_today: 0,
  retention: "forever",
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

function day(date: string, score = 0): ActivityDay {
  return { date, score, focus_minutes: 0, events: {}, tier: 0 }
}

describe("buildWeeks", () => {
  it("columns start on Monday, padding the first week's leading slots", () => {
    // 2025-11-01 is a Saturday, 2025-11-03 the next Monday.
    const weeks = buildWeeks([
      day("2025-11-01"),
      day("2025-11-02"),
      day("2025-11-03"),
      day("2025-11-04"),
    ])
    expect(weeks).toHaveLength(2)
    expect(weeks[0]).toHaveLength(7)
    expect(weeks[0].slice(0, 5)).toEqual([null, null, null, null, null])
    expect(weeks[0][5]?.date).toBe("2025-11-01")
    expect(weeks[0][6]?.date).toBe("2025-11-02")
    expect(weeks[1][0]?.date).toBe("2025-11-03")
    expect(weeks[1][1]?.date).toBe("2025-11-04")
    expect(weeks[1].slice(2)).toEqual([null, null, null, null, null])
  })

  it("keeps a full filled week in one column", () => {
    const days = [
      "2025-11-03",
      "2025-11-04",
      "2025-11-05",
      "2025-11-06",
      "2025-11-07",
      "2025-11-08",
      "2025-11-09",
    ].map((d) => day(d))
    const weeks = buildWeeks(days)
    expect(weeks).toHaveLength(1)
    expect(weeks[0].map((d) => d?.date)).toEqual(days.map((d) => d.date))
  })
})

describe("buyBlock", () => {
  it("blocks insufficient gold", () => {
    const item = gear()
    const warrior = { ...profile, game_class: "warrior" }
    expect(buyBlock(item, [item], { ...warrior, gold: 5 })).toBe("gold")
    expect(buyBlock(item, [item], { ...warrior, gold: 100 })).toBeNull()
  })

  it("blocks class-locked gear for the wrong class and classless users", () => {
    const item = gear()
    const rich = { ...profile, gold: 500, game_class: "mage" }
    expect(buyBlock(item, [item], rich)).toBe("class")
    expect(buyBlock(item, [item], { ...profile, gold: 500 })).toBe("class")
    expect(
      buyBlock(item, [item], { ...profile, gold: 500, game_class: "warrior" })
    ).toBeNull()
  })

  it("blocks the next ladder tier until the previous piece is owned", () => {
    const t1 = gear()
    const t2 = gear({ key: "warrior-weapon-2", tier: 2, cost: 250 })
    const rich = { ...profile, gold: 500, game_class: "warrior" }
    expect(buyBlock(t2, [t1, t2], rich)).toBe("tier")
    expect(buyBlock(t2, [{ ...t1, owned: true }, t2], rich)).toBeNull()
  })

  it("never blocks 'all'-class gear on class and marks owned items", () => {
    const allClass = gear({ klass: "all", key: "traveller-boots" })
    expect(buyBlock(allClass, [allClass], { ...profile, gold: 500 })).toBeNull()
    expect(
      buyBlock({ ...allClass, owned: true }, [allClass], {
        ...profile,
        gold: 500,
      })
    ).toBe("owned")
  })
})

describe("classChoiceOpen", () => {
  it("opens at level 10 or with the sticky unlock flag", () => {
    expect(classChoiceOpen({ ...profile, level: 9 })).toBe(false)
    expect(classChoiceOpen({ ...profile, level: 10 })).toBe(true)
    expect(
      classChoiceOpen({ ...profile, level: 3, class_unlocked: true })
    ).toBe(true)
  })
})
