import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { AvatarCard } from "./avatar-picker"
import type { GameProfile } from "@/lib/api"

const mutate = vi.fn()

const PROFILE: GameProfile = {
  level: 3,
  xp: 10,
  xp_to_next_level: 50,
  hp: 80,
  max_hp: 100,
  gold: 12,
  str_stat: 1,
  int_stat: 1,
  con_stat: 1,
  per_stat: 1,
  unspent_stat_points: 0,
  game_class: null,
  avatar_config: {
    style: "pixel-art",
    seed: "kiki",
    traits: { hair: "short01", eyes: "variant02" },
    costume: { name: "knight" },
  },
  xp_today: 0,
  gold_today: 0,
  retention: "forever",
}

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", username: "kiki" } }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({ data: PROFILE, isLoading: false, isError: false }),
  useUpdateAvatarConfig: () => ({ mutate, isPending: false }),
}))

describe("AvatarCard", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutate.mockImplementation((_config, options) => options?.onSuccess?.())
  })

  it("previews the saved config as a DiceBear URL with trait params", () => {
    render(<AvatarCard />)
    const img = screen.getByAltText("Avatar preview")
    expect(img).toHaveAttribute(
      "src",
      "https://api.dicebear.com/9.x/pixel-art/svg?seed=kiki&hair=short01&eyes=variant02"
    )
  })

  it("saves the built config blob through the mutation", async () => {
    render(<AvatarCard />)
    fireEvent.change(screen.getByLabelText(/seed/i), {
      target: { value: "newseed" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save avatar/i }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        {
          style: "pixel-art",
          seed: "newseed",
          traits: { hair: "short01", eyes: "variant02" },
          costume: { name: "knight" },
        },
        expect.anything()
      )
    )
  })

  it("stores the costume pick in the distinct costume field, not traits", async () => {
    render(<AvatarCard />)
    fireEvent.click(screen.getByRole("button", { name: "Mage" }))
    fireEvent.click(screen.getByRole("button", { name: /save avatar/i }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          costume: { name: "mage" },
          traits: { hair: "short01", eyes: "variant02" },
        }),
        expect.anything()
      )
    )
    const [config] = mutate.mock.calls[0]
    expect(config.traits).not.toHaveProperty("costume")
    expect(config.traits).not.toHaveProperty("name")
  })

  it("disables save until the draft differs from the saved config", () => {
    render(<AvatarCard />)
    const save = screen.getByRole("button", { name: /save avatar/i })
    expect(save).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Rogue" }))
    expect(save).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Knight" }))
    expect(save).toBeDisabled()
  })
})
