import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest"
import { AvatarCard } from "./avatar-picker"
import type { GameProfile, GearItem } from "@/lib/api"

const mutate = vi.fn()
const costumeMutate = vi.fn()

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
  class_unlocked: false,
  auto_allocate: false,
  avatar_config: {
    style: "pixel-art",
    seed: "kiki",
    // futureOption stands in for trait keys the picker doesn't model yet.
    traits: { hair: "short01", eyes: "variant02", futureOption: "x9" },
    // Gear-layer blob the picker doesn't manage (#64) — must survive a save.
    costume: { slot: "cape", color: "crimson" },
    gear: { helmet: "iron" },
  },
  xp_today: 0,
  gold_today: 0,
  retention: "forever",
}

const GEAR: GearItem[] = [
  {
    key: "warrior-weapon-1",
    name: "Training Sword",
    slot: "weapon",
    klass: "warrior",
    tier: 1,
    stats: { str: 3 },
    cost: 100,
    losable: true,
    owned: true,
    equipped: true,
    costume: false,
  },
  {
    key: "all-shield-1",
    name: "Wooden Shield",
    slot: "shield",
    klass: "all",
    tier: 1,
    stats: { con: 1 },
    cost: 50,
    losable: true,
    owned: true,
    equipped: false,
    costume: true,
  },
  {
    key: "warrior-weapon-2",
    name: "Broad Sword",
    slot: "weapon",
    klass: "warrior",
    tier: 2,
    stats: { str: 6 },
    cost: 250,
    losable: true,
    owned: false,
    equipped: false,
    costume: false,
  },
]

let mockProfile: GameProfile | undefined = PROFILE
let mockPending = false
let mockGear: GearItem[] = []

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", username: "kiki" } }),
}))

vi.mock("@/hooks/useGameProfile", () => ({
  useGameProfile: () => ({
    data: mockProfile,
    isLoading: false,
    isError: false,
  }),
  useUpdateAvatarConfig: () => ({ mutate, isPending: mockPending }),
}))

vi.mock("@/hooks/useGear", () => ({
  useGear: () => ({ data: mockGear }),
  useToggleGearCostume: () => ({ mutate: costumeMutate, isPending: false }),
}))

describe("AvatarCard", () => {
  beforeAll(() => {
    // jsdom lacks ResizeObserver — a checked Radix Checkbox mounts its
    // bubble indicator, which sizes itself with one.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    )
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = PROFILE
    mockPending = false
    mockGear = []
    mutate.mockImplementation((_config, options) => options?.onSuccess?.())
  })

  afterEach(() => {
    vi.useRealTimers()
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
          traits: { hair: "short01", eyes: "variant02", futureOption: "x9" },
          costume: { slot: "cape", color: "crimson" },
          gear: { helmet: "iron" },
        },
        expect.anything()
      )
    )
  })

  it("carries keys the picker doesn't manage through a save untouched", async () => {
    render(<AvatarCard />)
    fireEvent.change(screen.getByLabelText(/seed/i), {
      target: { value: "newseed" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save avatar/i }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          costume: { slot: "cape", color: "crimson" },
          gear: { helmet: "iron" },
          traits: { hair: "short01", eyes: "variant02", futureOption: "x9" },
        }),
        expect.anything()
      )
    )
    const [config] = mutate.mock.calls[0]
    expect(config.traits).not.toHaveProperty("costume")
    expect(config.traits).not.toHaveProperty("gear")
  })

  it("saves the fallback seed when the stored seed is cleared", async () => {
    mockProfile = {
      ...PROFILE,
      avatar_config: { ...PROFILE.avatar_config, seed: "stored" },
    }
    render(<AvatarCard />)
    fireEvent.change(screen.getByLabelText(/seed/i), { target: { value: "" } })
    fireEvent.click(screen.getByRole("button", { name: /save avatar/i }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ seed: "kiki" }),
        expect.anything()
      )
    )
  })

  it("disables save until the draft differs from the saved config", () => {
    render(<AvatarCard />)
    const save = screen.getByRole("button", { name: /save avatar/i })
    expect(save).toBeDisabled()
    fireEvent.click(screen.getByRole("button", { name: "Skin f5cfa0" }))
    expect(save).toBeEnabled()
    fireEvent.click(screen.getAllByRole("button", { name: "Auto" })[0])
    expect(save).toBeDisabled()
  })

  it("previews the fallback seed as a saveable avatar when none is stored", async () => {
    mockProfile = { ...PROFILE, avatar_config: {} }
    render(<AvatarCard />)
    expect(screen.getByAltText("Avatar preview")).toHaveAttribute(
      "src",
      "https://api.dicebear.com/9.x/pixel-art/svg?seed=kiki"
    )
    const save = screen.getByRole("button", { name: /save avatar/i })
    expect(save).toBeEnabled()
    fireEvent.click(save)
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({ seed: "kiki", style: "pixel-art" }),
        expect.anything()
      )
    )
  })

  it("debounces preview URL updates while the seed is typed", async () => {
    vi.useFakeTimers()
    render(<AvatarCard />)
    const img = screen.getByAltText("Avatar preview")
    expect(img).toHaveAttribute("src", expect.stringContaining("seed=kiki"))
    fireEvent.change(screen.getByLabelText(/seed/i), {
      target: { value: "abc" },
    })
    // Still the old URL — the fetch waits for a pause in typing.
    expect(img).toHaveAttribute("src", expect.stringContaining("seed=kiki"))
    await act(async () => {
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByAltText("Avatar preview")).toHaveAttribute(
      "src",
      expect.stringContaining("seed=abc")
    )
  })

  it("falls back to the initial when the preview image fails to load", () => {
    render(<AvatarCard />)
    fireEvent.error(screen.getByAltText("Avatar preview"))
    expect(screen.queryByAltText("Avatar preview")).not.toBeInTheDocument()
    expect(screen.getByText("K")).toBeInTheDocument()
  })

  it("disables the controls while a save is in flight", () => {
    mockPending = true
    render(<AvatarCard />)
    expect(screen.getByLabelText(/seed/i)).toBeDisabled()
    expect(screen.getByRole("combobox", { name: "Hair" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Skin f5cfa0" })).toBeDisabled()
  })

  it("hides the pixel-art pickers for a non-pixel-art stored style", () => {
    mockProfile = {
      ...PROFILE,
      avatar_config: { ...PROFILE.avatar_config, style: "bottts" },
    }
    render(<AvatarCard />)
    expect(
      screen.queryByRole("combobox", { name: "Hair" })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Skin f5cfa0" })
    ).not.toBeInTheDocument()
    // The seed still applies to every style.
    expect(screen.getByLabelText(/seed/i)).toBeEnabled()
  })

  it("passes non-string costume members through a save untouched", async () => {
    mockProfile = {
      ...PROFILE,
      avatar_config: {
        ...PROFILE.avatar_config,
        costume: { slot: "cape", itemId: 42, glow: true },
      },
    }
    render(<AvatarCard />)
    fireEvent.change(screen.getByLabelText(/seed/i), {
      target: { value: "newseed" },
    })
    fireEvent.click(screen.getByRole("button", { name: /save avatar/i }))
    await waitFor(() =>
      expect(mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          costume: { slot: "cape", itemId: 42, glow: true },
        }),
        expect.anything()
      )
    )
  })

  it("lists owned gear with costume toggles that fire the mutation", () => {
    mockGear = GEAR
    render(<AvatarCard />)
    // Unowned catalog rows stay out of the worn-gear list.
    expect(screen.queryByText("Broad Sword")).not.toBeInTheDocument()
    expect(
      screen.getByRole("checkbox", { name: /wooden shield/i })
    ).toBeChecked()
    expect(
      screen.getByRole("checkbox", { name: /training sword/i })
    ).not.toBeChecked()
    fireEvent.click(screen.getByRole("checkbox", { name: /training sword/i }))
    expect(costumeMutate).toHaveBeenCalledWith({
      key: "warrior-weapon-1",
      costume: true,
    })
  })
})
