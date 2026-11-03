import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { GameHud } from "./game-hud"
import type { GameProfile } from "@/lib/api"

const PROFILE: GameProfile = {
  level: 3,
  xp: 10,
  xp_to_next_level: 50,
  hp: 50,
  max_hp: 50,
  gold: 12,
  str_stat: 1,
  int_stat: 1,
  con_stat: 1,
  per_stat: 1,
  unspent_stat_points: 0,
  game_class: null,
  class_unlocked: false,
  auto_allocate: false,
  avatar_config: {},
  xp_today: 0,
  gold_today: 0,
  retention: "forever",
}

let mockProfile: GameProfile | undefined = PROFILE

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", username: "kiki" } }),
}))

vi.mock("@/contexts/GameContext", () => ({
  useGame: () => ({ pendingEventCount: 0 }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({
    data: mockProfile,
    isLoading: false,
    isError: false,
  }),
}))

vi.mock("@/hooks/useGameCharacter", () => ({
  useGear: () => ({ data: [] }),
}))

describe("GameHud", () => {
  beforeEach(() => {
    mockProfile = PROFILE
  })

  it("shows the death notice at zero hp — losable gear was dropped", () => {
    mockProfile = { ...PROFILE, hp: 0 }
    render(<GameHud />)
    expect(
      screen.getByText(/you died — losable gear was dropped/i)
    ).toBeInTheDocument()
  })

  it("omits the death notice while hp remains", () => {
    render(<GameHud />)
    expect(screen.queryByText(/you died/i)).not.toBeInTheDocument()
  })
})
