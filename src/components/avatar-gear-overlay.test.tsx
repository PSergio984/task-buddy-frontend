import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { AvatarGearOverlay } from "./avatar-gear-overlay"
import type { GearItem } from "@/lib/api"

const item = (over: Partial<GearItem>): GearItem => ({
  key: "k",
  name: "Thing",
  slot: "weapon",
  klass: "all",
  tier: 1,
  stats: {},
  cost: 0,
  losable: true,
  owned: true,
  equipped: false,
  costume: false,
  ...over,
})

const renderOverlay = (items: GearItem[], config?: { style?: unknown }) =>
  render(
    <div className="relative">
      <AvatarGearOverlay
        items={items}
        config={config ?? { style: "pixel-art" }}
      />
    </div>
  )

describe("AvatarGearOverlay", () => {
  it("renders an emblem per slot for equipped items", () => {
    renderOverlay([
      item({
        key: "w1",
        name: "Training Sword",
        slot: "weapon",
        equipped: true,
      }),
      item({
        key: "s1",
        name: "Wooden Shield",
        slot: "shield",
        equipped: true,
      }),
      // Unowned rows never show, equipped or not.
      item({
        key: "w2",
        name: "Broad Sword",
        slot: "body",
        owned: false,
        equipped: true,
      }),
    ])
    expect(
      screen.getByRole("img", { name: "Training Sword" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Wooden Shield" })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("img", { name: "Broad Sword" })
    ).not.toBeInTheDocument()
  })

  it("shows the costume-flagged item instead of the equipped one in a slot", () => {
    renderOverlay([
      item({
        key: "w1",
        name: "Training Sword",
        slot: "weapon",
        equipped: true,
      }),
      item({ key: "w2", name: "Broad Sword", slot: "weapon", costume: true }),
    ])
    expect(screen.getByRole("img", { name: "Broad Sword" })).toBeInTheDocument()
    expect(
      screen.queryByRole("img", { name: "Training Sword" })
    ).not.toBeInTheDocument()
  })

  it("renders nothing for non-pixel-art styles", () => {
    renderOverlay(
      [item({ key: "w1", name: "Training Sword", equipped: true })],
      { style: "bottts" }
    )
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("renders nothing when nothing is worn", () => {
    renderOverlay([item({ key: "w1", name: "Training Sword" })])
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })
})
