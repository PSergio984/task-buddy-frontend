import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { StatsPanel } from "./stats-panel"
import type { GameProfile } from "@/lib/api"

function profile(overrides: Partial<GameProfile> = {}): GameProfile {
  return {
    level: 1,
    xp: 0,
    xp_to_next_level: 100,
    hp: 50,
    max_hp: 50,
    gold: 5,
    str_stat: 2,
    int_stat: 0,
    con_stat: 0,
    per_stat: 1,
    unspent_stat_points: 0,
    game_class: null,
    class_unlocked: false,
    auto_allocate: false,
    avatar_config: {},
    xp_today: 0,
    gold_today: 0,
    retention: "forever",
    ...overrides,
  }
}

function renderPanel(p: GameProfile, props: Record<string, unknown> = {}) {
  return render(
    <StatsPanel
      profile={p}
      isPending={false}
      isError={false}
      isOnline
      onRetry={vi.fn()}
      {...props}
    />
  )
}

describe("StatsPanel", () => {
  it("enables the + buttons only while points remain unspent", () => {
    const onAllocate = vi.fn()
    renderPanel(profile({ unspent_stat_points: 3 }), { onAllocate })

    const add = screen.getByLabelText("Add Strength point")
    expect(add).toBeEnabled()
    fireEvent.click(add)
    expect(onAllocate).toHaveBeenCalledWith("str")
  })

  it("guards allocation when nothing is left to spend", () => {
    const onAllocate = vi.fn()
    renderPanel(profile({ unspent_stat_points: 0 }), { onAllocate })

    expect(screen.getByLabelText("Add Strength point")).toBeDisabled()
    expect(screen.getByLabelText("Add Perception point")).toBeDisabled()
    expect(onAllocate).not.toHaveBeenCalled()
  })

  it("hides write affordances while offline", () => {
    renderPanel(profile({ unspent_stat_points: 2 }), {
      writesDisabled: true,
    })
    expect(
      screen.queryByLabelText("Add Strength point")
    ).not.toBeInTheDocument()
  })

  it("offers the class pick at level 10 and sends the choice", () => {
    const onSelectClass = vi.fn()
    renderPanel(profile({ level: 10 }), { onSelectClass })

    fireEvent.click(screen.getByRole("button", { name: /Warrior/ }))
    expect(onSelectClass).toHaveBeenCalledWith("warrior")
    fireEvent.click(screen.getByRole("button", { name: /Mage/ }))
    expect(onSelectClass).toHaveBeenCalledWith("mage")
  })

  it("explains the level gate instead of showing picks below 10", () => {
    renderPanel(profile({ level: 4 }))
    expect(screen.getByText(/Classes unlock at level 10/)).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /Warrior/ })
    ).not.toBeInTheDocument()
  })

  it("disables respec when the gold balance can't cover it", () => {
    const onRespec = vi.fn()
    renderPanel(profile({ game_class: "mage", gold: 50 }), { onRespec })
    const respec = screen.getByRole("button", { name: /Respec/ })
    expect(respec).toBeDisabled()
    expect(onRespec).not.toHaveBeenCalled()
  })
})
